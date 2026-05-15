const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const USER_ROLES = ['admin', 'doctor', 'patient', 'receptionist'];
const USER_STATUSES = ['active', 'inactive', 'blocked', 'archived'];

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true,
            minlength: [2, 'Full name must be at least 2 characters'],
            maxlength: [100, 'Full name must not exceed 100 characters'],
        },

        phoneNumber: {
            type: String,
            required: [true, 'Phone number is required'],
            unique: true,
            trim: true,
            index: true,
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: null,
            sparse: true,
            validate: {
                validator(value) {
                    if (!value) return true;
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                },
                message: 'Invalid email format',
            },
        },

        password: {
            type: String,
            required: [true, 'Password is required'],
            select: false,
        },

        role: {
            type: String,
            enum: {
                values: USER_ROLES,
                message: 'Role must be admin, doctor, patient, or receptionist',
            },
            required: [true, 'Role is required'],
            index: true,
        },

        mustChangePassword: {
            type: Boolean,
            default: false,
        },

        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },

        status: {
            type: String,
            enum: {
                values: USER_STATUSES,
                message: 'Status must be active, inactive, blocked, or archived',
            },
            default: 'active',
            index: true,
        },

        createdByUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },

        lastLoginAt: {
            type: Date,
            default: null,
        },

        passwordResetToken: {
            type: String,
            default: null,
            select: false,
        },

        passwordResetExpires: {
            type: Date,
            default: null,
            select: false,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ fullName: 'text', phoneNumber: 'text' });

userSchema.pre('validate', function () {
    if (this.email === '') {
        this.email = null;
    }
});

userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const alreadyHashed =
        typeof this.password === 'string' &&
        /^\$2[aby]\$\d{2}\$/.test(this.password);

    if (!alreadyHashed) {
        const saltRounds = 10;
        this.password = await bcrypt.hash(this.password, saltRounds);
    }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isBlocked = function () {
    return (
        !this.isActive ||
        this.status === 'inactive' ||
        this.status === 'blocked' ||
        this.status === 'archived'
    );
};

userSchema.methods.canLogin = function () {
    return this.isActive && this.status === 'active';
};

userSchema.statics.findActiveByPhone = function (phoneNumber) {
    return this.findOne({
        phoneNumber,
        isActive: true,
        status: 'active',
    }).select('+password');
};

userSchema.set('toJSON', {
    transform(doc, ret) {
        delete ret.password;
        return ret;
    },
});

userSchema.set('toObject', {
    transform(doc, ret) {
        delete ret.password;
        return ret;
    },
});

module.exports = mongoose.model('User', userSchema);