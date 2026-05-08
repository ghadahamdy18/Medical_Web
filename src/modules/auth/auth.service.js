const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const User = require('../../models/user.model.js');
const PatientProfile = require('../../models/patientProfile.model.js');

const createError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const generateToken = (user) => {
    if (!process.env.JWT_SECRET) {
        throw createError('JWT_SECRET is missing in environment variables', 500);
    }

    return jwt.sign(
        {
            id: user._id,
            role: user.role,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        }
    );
};

const sanitizeUser = (user) => ({
    _id: user._id,
    fullName: user.fullName,
    phoneNumber: user.phoneNumber,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
    isActive: user.isActive,
    status: user.status,
    createdByUserId: user.createdByUserId,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});

const registerPatient = async (payload) => {
    const session = await mongoose.startSession();

    try {
        let createdUser;
        let createdProfile;

        await session.withTransaction(async () => {
            const existingPhone = await User.findOne({
                phoneNumber: payload.phoneNumber,
            }).session(session);

            if (existingPhone) {
                throw createError('Phone number already exists', 409);
            }

            if (payload.email) {
                const existingEmail = await User.findOne({
                    email: payload.email,
                }).session(session);

                if (existingEmail) {
                    throw createError('Email already exists', 409);
                }
            }

            createdUser = await User.create(
                [
                    {
                        fullName: payload.fullName,
                        phoneNumber: payload.phoneNumber,
                        email: payload.email || null,
                        password: payload.password,
                        role: 'patient',
                        mustChangePassword: false,
                        isActive: true,
                        status: 'active',
                        createdByUserId: null,
                    },
                ],
                { session }
            );

            createdUser = createdUser[0];

            createdProfile = await PatientProfile.create(
                [
                    {
                        userId: createdUser._id,
                        fullName: payload.fullName,
                        gender: payload.gender,
                        dateOfBirth: payload.dateOfBirth,
                        nationalId: payload.nationalId || null,
                        address: payload.address || '',
                        email: payload.email || null,
                        relationshipToPrimary: 'self',
                        isPrimary: true,
                        createdByUserId: null,
                        isActive: true,
                    },
                ],
                { session }
            );

            createdProfile = createdProfile[0];
        });

        const token = generateToken(createdUser);

        return {
            token,
            user: sanitizeUser(createdUser),
            primaryProfile: createdProfile,
        };
    } finally {
        session.endSession();
    }
};

const login = async ({ phoneNumber, password }) => {
    const user = await User.findOne({ phoneNumber }).select('+password');

    if (!user) {
        throw createError('Invalid phone number or password', 401);
    }

    if (!user.canLogin()) {
        throw createError('Account is inactive, blocked, or archived', 403);
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        throw createError('Invalid phone number or password', 401);
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user);

    return {
        token,
        user: sanitizeUser(user),
        mustChangePassword: user.mustChangePassword,
    };
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
    const user = await User.findById(userId).select('+password');

    if (!user) {
        throw createError('User not found', 404);
    }

    if (!user.canLogin()) {
        throw createError('Account is inactive, blocked, or archived', 403);
    }

    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
        throw createError('Current password is incorrect', 401);
    }

    user.password = newPassword;
    user.mustChangePassword = false;

    await user.save();

    return {
        message: 'Password changed successfully',
    };
};

const getMe = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw createError('User not found', 404);
    }

    return sanitizeUser(user);
};

module.exports = {
    registerPatient,
    login,
    changePassword,
    getMe,
};