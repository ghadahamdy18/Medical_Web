const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const TokenBlacklist = require('../../models/tokenBlacklist.model.js');
const crypto = require('crypto');
const sendEmail = require('../../utils/email.js');

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

const logout = async (token) => {
    const decoded = jwt.decode(token);

    if (!decoded || !decoded.exp) {
        throw createError('Invalid token', 400);
    }

    const expiresAt = new Date(decoded.exp * 1000);

    await TokenBlacklist.create({
        token,
        expiresAt,
    });

    return {
        message: 'Logout successful. Token has been invalidated.',
    };
};

const updateProfile = async (userId, payload) => {
    const user = await User.findById(userId);

    if (!user) {
        throw createError('User not found', 404);
    }

    // Check email uniqueness if changing email
    if (payload.email && payload.email !== user.email) {
        const existing = await User.findOne({ email: payload.email });
        if (existing) {
            throw createError('Email already in use', 409);
        }
    }

    if (payload.fullName !== undefined) user.fullName = payload.fullName;
    if (payload.email !== undefined) user.email = payload.email;

    await user.save();

    return sanitizeUser(user);
};

const forgotPassword = async ({ email }) => {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select(
        '+passwordResetToken +passwordResetExpires'
    );

    if (!user) {
        throw createError('This email is not assigned', 404);
    }

    if (!user.canLogin()) {
        throw createError('Account is inactive, blocked, or archived', 403);
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);

    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password.html?token=${resetToken}`;

    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Medical Lab Password Reset</h2>
            <p>Hello ${user.fullName},</p>
            <p>You requested to reset your password.</p>
            <p>Click the button below to create a new password:</p>
            <p>
                <a href="${resetUrl}" 
                   style="display:inline-block;padding:12px 18px;background:#0f766e;color:#ffffff;text-decoration:none;border-radius:8px;">
                   Reset Password
                </a>
            </p>
            <p>This link will expire in 15 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
        </div>
    `;

    try {
        await sendEmail({
            to: user.email,
            subject: 'Reset your Medical Lab password',
            html,
            text: `Reset your password using this link: ${resetUrl}`,
        });

        return {
            message: 'Password reset link sent to your email',
        };
    } catch (error) {
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        await user.save({ validateBeforeSave: false });

        throw createError('Failed to send reset email', 500);
    }
};

const resetPassword = async ({ token, newPassword }) => {
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires +password');

    if (!user) {
        throw createError('Invalid or expired reset token', 400);
    }

    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.mustChangePassword = false;

    await user.save();

    return {
        message: 'Password reset successfully',
    };
};

module.exports = {
    registerPatient,
    login,
    changePassword,
    getMe,
    updateProfile,
    logout,
    forgotPassword,
    resetPassword,
};