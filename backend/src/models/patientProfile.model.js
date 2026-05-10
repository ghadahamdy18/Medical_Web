const mongoose = require('mongoose');

const GENDERS = ['male', 'female'];

const patientProfileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Patient userId is required'],
            index: true,
        },

        fullName: {
            type: String,
            required: [true, 'Patient profile full name is required'],
            trim: true,
            minlength: [2, 'Full name must be at least 2 characters'],
            maxlength: [100, 'Full name must not exceed 100 characters'],
        },

        gender: {
            type: String,
            enum: {
                values: GENDERS,
                message: 'Gender must be male or female',
            },
            required: false,
        },

        dateOfBirth: {
            type: Date,
            required: false,
            validate: {
                validator(value) {
                    if (!value) return true;
                    return value <= new Date();
                },
                message: 'Date of birth cannot be in the future',
            },
        },

        nationalId: {
            type: String,
            trim: true,
            default: null,
            sparse: true,
        },

        address: {
            type: String,
            trim: true,
            default: '',
            maxlength: [500, 'Address must not exceed 500 characters'],
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: null,
            validate: {
                validator(value) {
                    if (!value) return true;
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                },
                message: 'Invalid email format',
            },
        },

        relationshipToPrimary: {
            type: String,
            trim: true,
            required: [true, 'Relationship to primary profile is required'],
            default: 'self',
        },

        isPrimary: {
            type: Boolean,
            default: false,
            index: true,
        },

        createdByUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },

        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

patientProfileSchema.index(
    { userId: 1, isPrimary: 1 },
    {
        unique: true,
        partialFilterExpression: { isPrimary: true },
    }
);

patientProfileSchema.index(
    { nationalId: 1 },
    {
        unique: true,
        sparse: true,
    }
);

patientProfileSchema.index({ userId: 1, isActive: 1 });
patientProfileSchema.index({ fullName: 'text', nationalId: 'text' });

patientProfileSchema.pre('validate', function () {
    if (this.email === '') {
        this.email = null;
    }

    if (this.nationalId === '') {
        this.nationalId = null;
    }

    if (this.isPrimary) {
        this.relationshipToPrimary = 'self';
    }

    if (!this.isPrimary && !this.relationshipToPrimary) {
        this.invalidate(
            'relationshipToPrimary',
            'Relationship to primary profile is required for family member profiles'
        );
    }
});

patientProfileSchema.pre('save', async function () {
    const User = mongoose.model('User');
    const session = this.$session();

    const ownerQuery = User.findOne({
        _id: this.userId,
        role: 'patient',
    });

    if (session) {
        ownerQuery.session(session);
    }

    const owner = await ownerQuery;

    if (!owner) {
        throw new Error(
            'Patient profile must belong to an existing user with role patient'
        );
    }

    if (this.createdByUserId) {
        const creatorQuery = User.findById(this.createdByUserId);

        if (session) {
            creatorQuery.session(session);
        }

        const creator = await creatorQuery;

        if (!creator) {
            throw new Error('Profile creator user does not exist');
        }

        const allowedCreators = ['admin', 'receptionist', 'patient'];

        if (!allowedCreators.includes(creator.role)) {
            throw new Error(
                'Patient profile creator must be admin, receptionist, or patient'
            );
        }
    }
});

module.exports = mongoose.model('PatientProfile', patientProfileSchema);