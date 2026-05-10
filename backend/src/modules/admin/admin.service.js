const User = require('../../models/user.model.js');
const PatientProfile = require('../../models/patientProfile.model.js');
const Appointment = require('../../models/appointment.model.js');
const ResultFile = require('../../models/resultFile.model.js');

const createError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const getPagination = (query) => {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

const buildPaginationResult = (data, total, page, limit) => ({
    data,
    pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    },
});

const sanitizeUser = (user) => {
    if (!user) return null;

    const obj = user.toObject ? user.toObject() : user;
    delete obj.password;

    return obj;
};

const assertUniqueUserFields = async ({ phoneNumber, email }, excludeUserId = null) => {
    if (phoneNumber) {
        const phoneQuery = { phoneNumber };

        if (excludeUserId) {
            phoneQuery._id = { $ne: excludeUserId };
        }

        const existingPhone = await User.findOne(phoneQuery);

        if (existingPhone) {
            throw createError('Phone number already exists', 409);
        }
    }

    if (email) {
        const emailQuery = { email };

        if (excludeUserId) {
            emailQuery._id = { $ne: excludeUserId };
        }

        const existingEmail = await User.findOne(emailQuery);

        if (existingEmail) {
            throw createError('Email already exists', 409);
        }
    }
};

const assertPatientUser = async (userId) => {
    const user = await User.findOne({ _id: userId, role: 'patient' });

    if (!user) {
        throw createError('Patient user not found', 404);
    }

    return user;
};

const assertDoctorUser = async (doctorUserId) => {
    const doctor = await User.findOne({
        _id: doctorUserId,
        role: 'doctor',
        isActive: true,
        status: 'active',
    });

    if (!doctor) {
        throw createError('Doctor not found or inactive', 404);
    }

    return doctor;
};

const assertActivePatientProfile = async (patientProfileId) => {
    const profile = await PatientProfile.findOne({
        _id: patientProfileId,
        isActive: true,
    });

    if (!profile) {
        throw createError('Patient profile not found or inactive', 404);
    }

    return profile;
};

const createUser = async (data, adminId) => {
    await assertUniqueUserFields({
        phoneNumber: data.phoneNumber,
        email: data.email,
    });

    const user = await User.create({
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        email: data.email || null,
        password: data.password,
        role: data.role,
        mustChangePassword: data.mustChangePassword ?? true,
        isActive: data.isActive ?? true,
        status: data.status || 'active',
        createdByUserId: adminId,
    });

    let primaryProfile = null;

    if (data.role === 'patient') {
        try {
            primaryProfile = await PatientProfile.create({
                userId: user._id,
                fullName: data.profileFullName || data.fullName,
                gender: data.gender,
                dateOfBirth: data.dateOfBirth,
                nationalId: data.nationalId || null,
                address: data.address || '',
                email: data.email || null,
                relationshipToPrimary: 'self',
                isPrimary: true,
                createdByUserId: adminId,
                isActive: true,
            });
        } catch (error) {
            await User.findByIdAndDelete(user._id);
            throw error;
        }
    }

    return {
        user: sanitizeUser(user),
        primaryProfile,
    };
};

const getUsers = async (query) => {
    const { page, limit, skip } = getPagination(query);

    const filter = {};

    if (query.role) {
        filter.role = query.role;
    }

    if (query.status) {
        filter.status = query.status;
    }

    if (query.isActive !== undefined) {
        filter.isActive = query.isActive === 'true' || query.isActive === true;
    }

    if (query.search) {
        filter.$or = [
            { fullName: { $regex: query.search, $options: 'i' } },
            { phoneNumber: { $regex: query.search, $options: 'i' } },
            { email: { $regex: query.search, $options: 'i' } },
        ];
    }

    const [users, total] = await Promise.all([
        User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        User.countDocuments(filter),
    ]);

    const patientIds = users
        .filter((user) => user.role === 'patient')
        .map((user) => user._id);

    let profilesMap = {};

    if (patientIds.length > 0) {
        const profiles = await PatientProfile.find({
            userId: { $in: patientIds },
            isPrimary: true,
        }).lean();

        profilesMap = profiles.reduce((acc, profile) => {
            acc[profile.userId.toString()] = profile;
            return acc;
        }, {});
    }

    const result = users.map((user) => ({
        ...user,
        primaryProfile:
            user.role === 'patient' ? profilesMap[user._id.toString()] || null : undefined,
    }));

    return buildPaginationResult(result, total, page, limit);
};

const getUserById = async (userId) => {
    const user = await User.findById(userId).select('-password').lean();

    if (!user) {
        throw createError('User not found', 404);
    }

    let profiles = [];

    if (user.role === 'patient') {
        profiles = await PatientProfile.find({ userId: user._id })
            .sort({ isPrimary: -1, createdAt: -1 })
            .lean();
    }

    return {
        user,
        profiles,
    };
};

const updateUser = async (userId, data) => {
    const user = await User.findById(userId);

    if (!user) {
        throw createError('User not found', 404);
    }

    await assertUniqueUserFields(
        {
            phoneNumber: data.phoneNumber,
            email: data.email,
        },
        userId
    );

    const allowedFields = [
        'fullName',
        'phoneNumber',
        'email',
        'mustChangePassword',
        'isActive',
        'status',
    ];

    allowedFields.forEach((field) => {
        if (data[field] !== undefined) {
            user[field] = data[field];
        }
    });

    await user.save();

    return sanitizeUser(user);
};

const updateUserStatus = async (userId, data) => {
    const user = await User.findById(userId);

    if (!user) {
        throw createError('User not found', 404);
    }

    if (data.status !== undefined) {
        user.status = data.status;
    }

    if (data.isActive !== undefined) {
        user.isActive = data.isActive;
    }

    if (data.mustChangePassword !== undefined) {
        user.mustChangePassword = data.mustChangePassword;
    }

    await user.save();

    return sanitizeUser(user);
};

const getPatientProfiles = async (query) => {
    const { page, limit, skip } = getPagination(query);

    const filter = {};

    if (query.userId) {
        filter.userId = query.userId;
    }

    if (query.isActive !== undefined) {
        filter.isActive = query.isActive === 'true' || query.isActive === true;
    }

    if (query.isPrimary !== undefined) {
        filter.isPrimary = query.isPrimary === 'true' || query.isPrimary === true;
    }

    if (query.search) {
        filter.$or = [
            { fullName: { $regex: query.search, $options: 'i' } },
            { nationalId: { $regex: query.search, $options: 'i' } },
            { email: { $regex: query.search, $options: 'i' } },
        ];
    }

    const [profiles, total] = await Promise.all([
        PatientProfile.find(filter)
            .populate('userId', 'fullName phoneNumber role status')
            .populate('createdByUserId', 'fullName role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        PatientProfile.countDocuments(filter),
    ]);

    return buildPaginationResult(profiles, total, page, limit);
};

const createPatientProfile = async (patientUserId, data, adminId) => {
    await assertPatientUser(patientUserId);

    const profile = await PatientProfile.create({
        userId: patientUserId,
        fullName: data.fullName,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        nationalId: data.nationalId || null,
        address: data.address || '',
        email: data.email || null,
        relationshipToPrimary: data.relationshipToPrimary,
        isPrimary: false,
        createdByUserId: adminId,
        isActive: true,
    });

    return profile;
};

const updatePatientProfile = async (profileId, data) => {
    const profile = await PatientProfile.findById(profileId);

    if (!profile) {
        throw createError('Patient profile not found', 404);
    }

    const protectedFields = ['_id', 'userId', 'createdByUserId', 'isPrimary'];

    Object.keys(data).forEach((key) => {
        if (!protectedFields.includes(key) && data[key] !== undefined) {
            profile[key] = data[key];
        }
    });

    await profile.save();

    return profile;
};

const deactivatePatientProfile = async (profileId) => {
    const profile = await PatientProfile.findById(profileId);

    if (!profile) {
        throw createError('Patient profile not found', 404);
    }

    if (profile.isPrimary) {
        throw createError('Primary patient profile cannot be deactivated', 400);
    }

    profile.isActive = false;
    await profile.save();

    return profile;
};

const createAppointment = async (data, adminId) => {
    await assertActivePatientProfile(data.patientProfileId);
    await assertDoctorUser(data.doctorUserId);

    if (
        data.appointmentType === 'home_visit' &&
        (!data.homeVisitAddress || String(data.homeVisitAddress).trim() === '')
    ) {
        throw createError('Home visit address is required for home visit appointments', 400);
    }

    const appointment = await Appointment.create({
        patientProfileId: data.patientProfileId,
        doctorUserId: data.doctorUserId,
        appointmentType: data.appointmentType,
        appointmentStatus: data.appointmentStatus || 'pending',
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        homeVisitAddress:
            data.appointmentType === 'home_visit' ? data.homeVisitAddress : '',
        createdByUserId: adminId,
        notes: data.notes || '',
    });

    return appointment;
};

const getAppointments = async (query) => {
    const { page, limit, skip } = getPagination(query);

    const filter = {};

    if (query.patientProfileId) {
        filter.patientProfileId = query.patientProfileId;
    }

    if (query.doctorUserId) {
        filter.doctorUserId = query.doctorUserId;
    }

    if (query.appointmentType) {
        filter.appointmentType = query.appointmentType;
    }

    if (query.appointmentStatus) {
        filter.appointmentStatus = query.appointmentStatus;
    }

    if (query.date) {
        const start = new Date(query.date);
        const end = new Date(query.date);
        end.setDate(end.getDate() + 1);

        filter.appointmentDate = {
            $gte: start,
            $lt: end,
        };
    }

    const [appointments, total] = await Promise.all([
        Appointment.find(filter)
            .populate('patientProfileId', 'fullName relationshipToPrimary isPrimary')
            .populate('doctorUserId', 'fullName phoneNumber role')
            .populate('createdByUserId', 'fullName role')
            .populate('acceptedByUserId', 'fullName role')
            .sort({ appointmentDate: -1, appointmentTime: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Appointment.countDocuments(filter),
    ]);

    return buildPaginationResult(appointments, total, page, limit);
};

const getAppointmentById = async (appointmentId) => {
    const appointment = await Appointment.findById(appointmentId)
        .populate('patientProfileId')
        .populate('doctorUserId', 'fullName phoneNumber role')
        .populate('createdByUserId', 'fullName role')
        .populate('acceptedByUserId', 'fullName role')
        .lean();

    if (!appointment) {
        throw createError('Appointment not found', 404);
    }

    const results = await ResultFile.find({ appointmentId })
        .populate('doctorUserId', 'fullName phoneNumber role')
        .sort({ uploadedAt: -1 })
        .lean();

    return {
        appointment,
        results,
    };
};

const updateAppointment = async (appointmentId, data) => {
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
        throw createError('Appointment not found', 404);
    }

    if (['completed', 'cancelled'].includes(appointment.appointmentStatus)) {
        throw createError('Completed or cancelled appointments cannot be updated', 400);
    }

    if (data.patientProfileId !== undefined) {
        await assertActivePatientProfile(data.patientProfileId);
        appointment.patientProfileId = data.patientProfileId;
    }

    if (data.doctorUserId !== undefined) {
        await assertDoctorUser(data.doctorUserId);
        appointment.doctorUserId = data.doctorUserId;
    }

    if (data.appointmentType !== undefined) {
        appointment.appointmentType = data.appointmentType;
    }

    if (data.appointmentDate !== undefined) {
        appointment.appointmentDate = data.appointmentDate;
    }

    if (data.appointmentTime !== undefined) {
        appointment.appointmentTime = data.appointmentTime;
    }

    if (data.homeVisitAddress !== undefined) {
        appointment.homeVisitAddress = data.homeVisitAddress;
    }

    if (data.notes !== undefined) {
        appointment.notes = data.notes;
    }

    await appointment.save();

    return appointment;
};

const confirmAppointment = async (appointmentId, adminId) => {
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
        throw createError('Appointment not found', 404);
    }

    if (appointment.appointmentStatus !== 'pending') {
        throw createError('Only pending appointments can be confirmed', 400);
    }

    appointment.appointmentStatus = 'confirmed';
    appointment.acceptedByUserId = adminId;
    appointment.acceptedAt = new Date();

    await appointment.save();

    return appointment;
};

const completeAppointment = async (appointmentId) => {
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
        throw createError('Appointment not found', 404);
    }

    if (appointment.appointmentStatus !== 'confirmed') {
        throw createError('Only confirmed appointments can be completed', 400);
    }

    appointment.appointmentStatus = 'completed';
    await appointment.save();

    return appointment;
};

const cancelAppointment = async (appointmentId) => {
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
        throw createError('Appointment not found', 404);
    }

    if (!['pending', 'confirmed'].includes(appointment.appointmentStatus)) {
        throw createError('Only pending or confirmed appointments can be cancelled', 400);
    }

    appointment.appointmentStatus = 'cancelled';
    await appointment.save();

    return appointment;
};

const getResults = async (query) => {
    const { page, limit, skip } = getPagination(query);

    const filter = {};

    if (query.appointmentId) {
        filter.appointmentId = query.appointmentId;
    }

    if (query.doctorUserId) {
        filter.doctorUserId = query.doctorUserId;
    }

    if (query.testName) {
        filter.testName = { $regex: query.testName, $options: 'i' };
    }

    if (query.isLatest !== undefined) {
        filter.isLatest = query.isLatest === 'true' || query.isLatest === true;
    }

    const [results, total] = await Promise.all([
        ResultFile.find(filter)
            .populate({
                path: 'appointmentId',
                select:
                    'patientProfileId doctorUserId appointmentDate appointmentTime appointmentStatus appointmentType',
                populate: {
                    path: 'patientProfileId',
                    select: 'fullName relationshipToPrimary isPrimary',
                },
            })
            .populate('doctorUserId', 'fullName phoneNumber role')
            .populate('replacedResultFileId', 'testName fileName uploadedAt isLatest')
            .sort({ uploadedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        ResultFile.countDocuments(filter),
    ]);

    return buildPaginationResult(results, total, page, limit);
};

const getResultById = async (resultId) => {
    const result = await ResultFile.findById(resultId)
        .populate({
            path: 'appointmentId',
            populate: [
                {
                    path: 'patientProfileId',
                    select: 'fullName gender dateOfBirth nationalId relationshipToPrimary isPrimary',
                },
                {
                    path: 'doctorUserId',
                    select: 'fullName phoneNumber role',
                },
            ],
        })
        .populate('doctorUserId', 'fullName phoneNumber role')
        .populate('replacedResultFileId', 'testName fileName uploadedAt isLatest')
        .lean();

    if (!result) {
        throw createError('Result file not found', 404);
    }

    return result;
};

const getDashboard = async () => {
    const [
        totalUsers,
        totalPatients,
        totalDoctors,
        totalReceptionists,
        totalAppointments,
        pendingAppointments,
        recentAppointments,
        recentResults,
    ] = await Promise.all([
        User.countDocuments(),

        User.countDocuments({ role: 'patient' }),

        User.countDocuments({
            role: 'doctor',
            status: 'active',
            isActive: true,
        }),

        User.countDocuments({ role: 'receptionist' }),

        Appointment.countDocuments(),

        Appointment.countDocuments({
            appointmentStatus: 'pending',
        }),

        Appointment.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('patientProfileId', 'fullName')
            .populate('doctorUserId', 'fullName')
            .populate('createdByUserId', 'fullName role')
            .populate('acceptedByUserId', 'fullName role')
            .lean(),

        ResultFile.find()
            .sort({ uploadedAt: -1 })
            .limit(5)
            .populate('appointmentId', 'appointmentDate appointmentType')
            .populate('doctorUserId', 'fullName')
            .lean()
            .populate({
                path: 'appointmentId',
                select: 'patientProfileId appointmentDate appointmentTime appointmentType',
                populate: {
                    path: 'patientProfileId',
                    select: 'fullName',
                },
            })
            .populate('doctorUserId', 'fullName')
            .lean(),
    ]);

    return {
        stats: {
            totalUsers,
            totalPatients,
            totalDoctors,
            totalReceptionists,
            totalAppointments,
            pendingAppointments,
            appointmentsByStatus: {
                pending: pendingAppointments,
            },
        },
        recentAppointments,
        recentResults,
    };
};

module.exports = {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    updateUserStatus,
    getPatientProfiles,
    createPatientProfile,
    updatePatientProfile,
    deactivatePatientProfile,
    createAppointment,
    getAppointments,
    getAppointmentById,
    updateAppointment,
    confirmAppointment,
    completeAppointment,
    cancelAppointment,
    getResults,
    getResultById,
    getDashboard,
};