const Appointment = require('../../models/appointment.model.js');
const ResultFile = require('../../models/resultFile.model.js');

const createError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

/**
 * GET /my-appointments
 * Returns all appointments assigned to the logged-in doctor, sorted soonest first.
 */
const getMyAppointments = async (doctorId, query = {}) => {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const filter = { doctorUserId: doctorId };

    if (query.appointmentStatus) {
        filter.appointmentStatus = query.appointmentStatus;
    }

    if (query.appointmentType) {
        filter.appointmentType = query.appointmentType;
    }

    const [appointments, total] = await Promise.all([
        Appointment.find(filter)
            .populate('patientProfileId', 'fullName gender dateOfBirth relationshipToPrimary isPrimary')
            .populate('doctorUserId', 'fullName phoneNumber role')
            .populate('createdByUserId', 'fullName role')
            .sort({ appointmentDate: 1, appointmentTime: 1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Appointment.countDocuments(filter),
    ]);

   return {
    data: appointments.map(appointment => ({
        ...appointment,
        _id: appointment._id.toString()
    })),
    pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    },
};
};

/**
 * GET /appointments/:appointmentId
 * Returns a single appointment detail — only if assigned to this doctor.
 */
const getAppointmentDetails = async (doctorId, appointmentId) => {
    const appointment = await Appointment.findOne({
        _id: appointmentId ,
        doctorUserId: doctorId,
    })
        .populate('patientProfileId', 'fullName gender dateOfBirth nationalId address relationshipToPrimary isPrimary')
        .populate('doctorUserId', 'fullName phoneNumber role')
        .populate('createdByUserId', 'fullName role')
        .populate('acceptedByUserId', 'fullName role')
        .lean();

    if (!appointment) {
        throw createError('Appointment not found or not assigned to you', 404);
    }

    return appointment;
};

/**
 * PATCH /appointments/:appointmentId/complete
 * Transitions a confirmed appointment → completed.
 * Only the assigned doctor can do this.
 */
const completeAppointment = async (doctorId, appointmentId) => {
    const appointment = await Appointment.findOne({
        _id: appointmentId,
        doctorUserId: doctorId,
    });

    if (!appointment) {
        throw createError('Appointment not found or not assigned to you', 404);
    }

    if (appointment.appointmentStatus === 'completed') {
        throw createError('Appointment is already completed', 400);
    }

    if (appointment.appointmentStatus === 'cancelled') {
        throw createError('Cancelled appointments cannot be completed', 400);
    }

    if (appointment.appointmentStatus !== 'confirmed') {
        throw createError('Only confirmed appointments can be completed', 400);
    }

    appointment.appointmentStatus = 'completed';
    await appointment.save();

    return appointment;
};

/**
 * POST /appointments/:appointmentId/results
 * Uploads a PDF result for a specific appointment + testName.
 * Implements full versioning: old isLatest → false, new record created with replacedResultFileId.
 * Uses the static ResultFile.replaceLatestResult() method from the model.
 */
const uploadResult = async (doctorId, appointmentId, body, file) => {
    // --- File validation ---
    if (!file) {
        throw createError('Result PDF file is required', 400);
    }

    if (file.mimetype !== 'application/pdf') {
        throw createError('Only PDF files are allowed', 400);
    }

    // --- testName validation ---
    if (!body.testName || String(body.testName).trim() === '') {
        throw createError('testName is required', 400);
    }

    const testName = String(body.testName).trim();

    // --- Appointment existence + ownership ---
    const appointment = await Appointment.findOne({
        _id: appointmentId,
        doctorUserId: doctorId,
    });

    if (!appointment) {
        throw createError('Appointment not found or not assigned to you', 404);
    }

    // --- Appointment status rules ---
    if (appointment.appointmentStatus === 'cancelled') {
        throw createError('Cannot upload results for a cancelled appointment', 400);
    }

    if (appointment.appointmentStatus === 'pending') {
        throw createError('Cannot upload results for a pending appointment. Appointment must be confirmed first.', 400);
    }

    // Allow upload on both confirmed and completed appointments.

    // --- Result versioning via model static ---
    const result = await ResultFile.replaceLatestResult({
        appointmentId,
        doctorUserId: doctorId,
        testName,
        fileName: file.filename,
        filePath: file.path,
        mimeType: file.mimetype,
        fileSize: file.size,
    });

    return result;
};

/**
 * GET /appointments/:appointmentId/results
 * Returns all result files for an appointment assigned to this doctor.
 * Sorted newest first. Includes version chain (replacedResultFileId).
 */
const getAppointmentResults = async (doctorId, appointmentId) => {
    const appointment = await Appointment.findOne({
        _id: appointmentId,
        doctorUserId: doctorId,
    }).lean();

    if (!appointment) {
        throw createError('Appointment not found or not assigned to you', 404);
    }

    const results = await ResultFile.find({ appointmentId })
        .populate('doctorUserId', 'fullName phoneNumber role')
        .populate('replacedResultFileId', 'testName fileName uploadedAt isLatest')
        .sort({ uploadedAt: -1 })
        .lean();

    return results;
};

const getDashboard = async (doctorId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
        totalAppointments,
        pendingAppointments,
        confirmedAppointments,
        completedAppointments,
        todayAppointments,
        recentResults
    ] = await Promise.all([
        Appointment.countDocuments({ doctorUserId: doctorId }),
        Appointment.countDocuments({ doctorUserId: doctorId, appointmentStatus: 'pending' }),
        Appointment.countDocuments({ doctorUserId: doctorId, appointmentStatus: 'confirmed' }),
        Appointment.countDocuments({ doctorUserId: doctorId, appointmentStatus: 'completed' }),
        Appointment.countDocuments({ 
            doctorUserId: doctorId, 
            appointmentDate: { $gte: today, $lt: tomorrow } 
        }),
        ResultFile.find({ doctorUserId: doctorId })
            .sort({ uploadedAt: -1 })
            .limit(5)
            .populate('appointmentId', 'appointmentDate appointmentType')
            .lean()
    ]);

    return {
        stats: {
            totalAppointments,
            pendingAppointments,
            confirmedAppointments,
            completedAppointments,
            todayAppointments
        },
        recentResults
    };
};

module.exports = {
    getMyAppointments,
    getAppointmentDetails,
    completeAppointment,
    uploadResult,
    getAppointmentResults,
    getDashboard,
};