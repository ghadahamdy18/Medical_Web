const mongoose = require('mongoose');

const resultFileSchema = new mongoose.Schema(
    {
        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Appointment',
            required: [true, 'Appointment is required'],
            index: true,
        },

        doctorUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Doctor uploader is required'],
            index: true,
        },

        testName: {
            type: String,
            required: [true, 'Test name is required'],
            trim: true,
            minlength: [2, 'Test name must be at least 2 characters'],
            maxlength: [150, 'Test name must not exceed 150 characters'],
            index: true,
        },

        fileName: {
            type: String,
            required: [true, 'File name is required'],
            trim: true,
        },

        filePath: {
            type: String,
            required: [true, 'File path is required'],
            trim: true,
        },

        mimeType: {
            type: String,
            required: [true, 'MIME type is required'],
            enum: {
                values: ['application/pdf'],
                message: 'Only PDF result files are allowed',
            },
            default: 'application/pdf',
        },

        fileSize: {
            type: Number,
            required: [true, 'File size is required'],
            min: [1, 'File size must be greater than 0'],
        },

        isLatest: {
            type: Boolean,
            default: true,
            index: true,
        },

        replacedResultFileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ResultFile',
            default: null,
        },

        uploadedAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

resultFileSchema.index({ appointmentId: 1, uploadedAt: -1 });
resultFileSchema.index({ appointmentId: 1, testName: 1 });
resultFileSchema.index({ doctorUserId: 1, uploadedAt: -1 });

resultFileSchema.index(
    { appointmentId: 1, testName: 1, isLatest: 1 },
    {
        unique: true,
        partialFilterExpression: { isLatest: true },
    }
);

resultFileSchema.pre('validate', function () {
    if (!this.uploadedAt) {
        this.uploadedAt = new Date();
    }

    if (!this.mimeType) {
        this.mimeType = 'application/pdf';
    }
});

resultFileSchema.pre('save', async function () {
    const User = mongoose.model('User');
    const Appointment = mongoose.model('Appointment');

    const appointment = await Appointment.findById(this.appointmentId);

    if (!appointment) {
        throw new Error('Result file must be linked to an existing appointment');
    }

    const doctor = await User.findOne({
        _id: this.doctorUserId,
        role: 'doctor',
        isActive: true,
        status: 'active',
    });

    if (!doctor) {
        throw new Error('Result file doctorUserId must reference an active user with role doctor');
    }

    if (String(appointment.doctorUserId) !== String(this.doctorUserId)) {
        throw new Error('Only the doctor assigned to the appointment can upload result files');
    }

    if (this.replacedResultFileId) {
        const replacedFile = await mongoose
            .model('ResultFile')
            .findById(this.replacedResultFileId);

        if (!replacedFile) {
            throw new Error('Replaced result file does not exist');
        }

        if (String(replacedFile.appointmentId) !== String(this.appointmentId)) {
            throw new Error('Replacement result must belong to the same appointment');
        }

        if (replacedFile.testName !== this.testName) {
            throw new Error('Replacement result must use the same testName as the replaced result');
        }
    }
});

resultFileSchema.statics.replaceLatestResult = async function ({
    appointmentId,
    doctorUserId,
    testName,
    fileName,
    filePath,
    mimeType,
    fileSize,
}) {
    const latestResult = await this.findOne({
        appointmentId,
        testName,
        isLatest: true,
    });

    if (!latestResult) {
        return this.create({
            appointmentId,
            doctorUserId,
            testName,
            fileName,
            filePath,
            mimeType,
            fileSize,
            isLatest: true,
            replacedResultFileId: null,
            uploadedAt: new Date(),
        });
    }

    latestResult.isLatest = false;
    await latestResult.save();

    return this.create({
        appointmentId,
        doctorUserId,
        testName,
        fileName,
        filePath,
        mimeType,
        fileSize,
        isLatest: true,
        replacedResultFileId: latestResult._id,
        uploadedAt: new Date(),
    });
};

module.exports = mongoose.model('ResultFile', resultFileSchema);