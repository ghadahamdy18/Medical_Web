const User = require('../../models/user.model.js');
const PatientProfile = require('../../models/patientProfile.model.js');
const Appointment = require('../../models/appointment.model.js');
const bcrypt = require('bcryptjs');

const createPatient = async (data, receptionistId) => {
    const hashedPassword = await bcrypt.hash(data.password || 'defaultPassword123', 10);

    const newUser = new User({
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        password: hashedPassword,
        role: 'patient',
        mustChangePassword: true,
        status: 'active',
        createdByUserId: receptionistId
    });
    const savedUser = await newUser.save();

    const newProfile = new PatientProfile({
        userId: savedUser._id,
        fullName: data.fullName,
        isPrimary: true,
        relationshipToPrimary: 'self',
        isActive: true
    });
    const savedProfile = await newProfile.save();

    return { user: savedUser, primaryProfile: savedProfile };
};

const getPatients = async (query) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { role: 'patient' };

    // If search is provided, we can search by fullName or phone number
    if (query.search) {
        filter.$or = [
            { fullName: { $regex: query.search, $options: 'i' } },
            { phoneNumber: { $regex: query.search, $options: 'i' } }
        ];
    }

    const users = await User.find(filter)
        .skip(skip)
        .limit(limit)
        .lean();

    // Fetch primary profiles for these users
    const userIds = users.map(u => u._id);
    const profiles = await PatientProfile.find({ userId: { $in: userIds }, isPrimary: true }).lean();

    const profileMap = profiles.reduce((acc, profile) => {
        acc[profile.userId.toString()] = profile;
        return acc;
    }, {});

    const results = users.map(user => ({
        ...user,
        primaryProfile: profileMap[user._id.toString()] || null
    }));

    const total = await User.countDocuments(filter);

    return {
        data: results,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

const getPatientById = async (userId) => {
    const user = await User.findOne({ _id: userId, role: 'patient' }).lean();
    if (!user) {
        throw new Error('Patient not found');
    }

    const profiles = await PatientProfile.find({ userId }).lean();

    return { user, profiles };
};

const createPatientProfile = async (userId, data) => {
    const user = await User.findOne({ _id: userId, role: 'patient' });
    if (!user) {
        throw new Error('Patient user not found');
    }

    const newProfile = new PatientProfile({
        ...data,
        user: userId,
        isPrimary: false, // Ensure isPrimary is false
    });

    const savedProfile = await newProfile.save();
    return savedProfile;
};

const updatePatientProfile = async (profileId, data) => {
    const profile = await PatientProfile.findById(profileId);
    if (!profile) {
        throw new Error('Patient profile not found');
    }

    Object.assign(profile, data);
    const updatedProfile = await profile.save();
    return updatedProfile;
};

const createAppointment = async (data, receptionistId) => {
    const profile = await PatientProfile.findOne({ _id: data.patientProfileId, isActive: true });
    if (!profile) {
        throw new Error('Patient profile not found or inactive');
    }

    const doctor = await User.findOne({ _id: data.doctorUserId, role: 'doctor' });
    if (!doctor) {
        throw new Error('Doctor not found');
    }

    const newAppointment = new Appointment({
        patientProfileId: data.patientProfileId,
        doctorUserId: data.doctorUserId,
        appointmentType: data.appointmentType,
        homeVisitAddress: data.appointmentType === 'home_visit' ? data.homeVisitAddress : undefined,
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        appointmentStatus: 'pending',
        notes: data.notes,
        createdByUserId: receptionistId
    });

    const savedAppointment = await newAppointment.save();
    return savedAppointment;
};

const getAppointments = async (query) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.status) {
        filter.appointmentStatus = query.status;
    }
    if (query.appointmentType) {
        filter.appointmentType = query.appointmentType;
    }

    const appointments = await Appointment.find(filter)
        .populate({ path: 'patientProfileId', select: 'name' })
        .populate({ path: 'doctorUserId', select: 'name' })
        .skip(skip)
        .limit(limit)
        .lean();

    const total = await Appointment.countDocuments(filter);

    return {
        data: appointments,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

const confirmAppointment = async (id, receptionistId) => {
    const appointment = await Appointment.findById(id);
    if (!appointment) {
        throw new Error('Appointment not found');
    }

    if (appointment.appointmentStatus !== 'pending') {
        throw new Error('Invalid status transition');
    }

    appointment.appointmentStatus = 'confirmed';
    appointment.acceptedByUserId = receptionistId;
    appointment.acceptedAt = new Date();

    const updatedAppointment = await appointment.save();
    return updatedAppointment;
};

const rescheduleAppointment = async (id, data) => {
    const appointment = await Appointment.findById(id);
    if (!appointment) {
        throw new Error('Appointment not found');
    }

    if (!['pending', 'confirmed'].includes(appointment.appointmentStatus)) {
        throw new Error('Invalid status transition');
    }

    appointment.appointmentDate = data.appointmentDate;
    appointment.appointmentTime = data.appointmentTime;

    const updatedAppointment = await appointment.save();
    return updatedAppointment;
};

const cancelAppointment = async (id) => {
    const appointment = await Appointment.findById(id);
    if (!appointment) {
        throw new Error('Appointment not found');
    }

    if (!['pending', 'confirmed'].includes(appointment.appointmentStatus)) {
        throw new Error('Invalid status transition');
    }

    appointment.appointmentStatus = 'cancelled';

    const updatedAppointment = await appointment.save();
    return updatedAppointment;
};

module.exports = {
    createPatient,
    getPatients,
    getPatientById,
    createPatientProfile,
    updatePatientProfile,
    createAppointment,
    getAppointments,
    confirmAppointment,
    rescheduleAppointment,
    cancelAppointment
};
