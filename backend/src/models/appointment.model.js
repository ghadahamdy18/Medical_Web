const mongoose = require('mongoose');

const APPOINTMENT_TYPES = ['in_lab', 'home_visit'];
const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

const appointmentSchema = new mongoose.Schema(
    {
        patientProfileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PatientProfile',
            required: [true, 'Patient profile is required'],
            index: true,
        },

        doctorUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Doctor is required'],
            index: true,
        },

        appointmentType: {
            type: String,
            enum: {
                values: APPOINTMENT_TYPES,
                message: 'Appointment type must be in_lab or home_visit',
            },
            required: [true, 'Appointment type is required'],
        },

        appointmentStatus: {
            type: String,
            enum: {
                values: APPOINTMENT_STATUSES,
                message: 'Appointment status must be pending, confirmed, completed, or cancelled',
            },
            default: 'pending',
            index: true,
        },

        appointmentDate: {
            type: Date,
            required: [true, 'Appointment date is required'],
        },

        appointmentTime: {
            type: String,
            required: [true, 'Appointment time is required'],
            trim: true,
        },

        homeVisitAddress: {
            type: String,
            trim: true,
            default: '',
            maxlength: [500, 'Home visit address must not exceed 500 characters'],
        },

        createdByUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Appointment creator is required'],
            index: true,
        },

        acceptedByUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },

        acceptedAt: {
            type: Date,
            default: null,
        },

        notes: {
            type: String,
            trim: true,
            default: '',
            maxlength: [1000, 'Appointment notes must not exceed 1000 characters'],
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

appointmentSchema.index({ patientProfileId: 1, appointmentDate: 1 });
appointmentSchema.index({ doctorUserId: 1, appointmentDate: 1 });
appointmentSchema.index({ appointmentStatus: 1, appointmentDate: 1 });
appointmentSchema.index({ appointmentType: 1 });

appointmentSchema.pre('validate', function () {
    if (this.appointmentType === 'home_visit') {
        if (!this.homeVisitAddress || String(this.homeVisitAddress).trim() === '') {
            this.invalidate(
                'homeVisitAddress',
                'Home visit address is required for home visit appointments'
            );
        }
    }

    if (this.appointmentType === 'in_lab') {
        this.homeVisitAddress = this.homeVisitAddress || '';
    }
});

appointmentSchema.pre('save', async function () {
    const User = mongoose.model('User');
    const PatientProfile = mongoose.model('PatientProfile');

    const profile = await PatientProfile.findOne({
        _id: this.patientProfileId,
        isActive: true,
    });

    if (!profile) {
        throw new Error('Appointment must be linked to an existing active patient profile');
    }

    const doctor = await User.findOne({
        _id: this.doctorUserId,
        role: 'doctor',
        isActive: true,
        status: 'active',
    });

    if (!doctor) {
        throw new Error('Appointment doctorUserId must reference an active user with role doctor');
    }

    const creator = await User.findById(this.createdByUserId);

    if (!creator) {
        throw new Error('Appointment creator user does not exist');
    }

    const allowedCreators = ['patient', 'admin', 'receptionist'];

    if (!allowedCreators.includes(creator.role)) {
        throw new Error('Appointments can only be created by patient, admin, or receptionist');
    }

    if (this.acceptedByUserId) {
        const accepter = await User.findById(this.acceptedByUserId);

        if (!accepter) {
            throw new Error('Appointment accepter user does not exist');
        }

        const allowedAccepters = ['admin', 'receptionist'];

        if (!allowedAccepters.includes(accepter.role)) {
            throw new Error('Appointments can only be confirmed by admin or receptionist');
        }

        if (!this.acceptedAt) {
            this.acceptedAt = new Date();
        }
    }
});

appointmentSchema.methods.canTransitionTo = function (newStatus) {
    const transitions = {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['completed', 'cancelled'],
        completed: [],
        cancelled: [],
    };

    return transitions[this.appointmentStatus]?.includes(newStatus) || false;
};

appointmentSchema.methods.confirm = function (acceptedByUserId) {
    if (this.appointmentStatus !== 'pending') {
        throw new Error('Only pending appointments can be confirmed');
    }

    this.appointmentStatus = 'confirmed';
    this.acceptedByUserId = acceptedByUserId;
    this.acceptedAt = new Date();

    return this;
};

appointmentSchema.methods.complete = function () {
    if (this.appointmentStatus !== 'confirmed') {
        throw new Error('Only confirmed appointments can be completed');
    }

    this.appointmentStatus = 'completed';

    return this;
};

appointmentSchema.methods.cancel = function () {
    if (!['pending', 'confirmed'].includes(this.appointmentStatus)) {
        throw new Error('Only pending or confirmed appointments can be cancelled');
    }

    this.appointmentStatus = 'cancelled';

    return this;
};

module.exports = mongoose.model('Appointment', appointmentSchema);