const { body, param, query, validationResult } = require('express-validator');
const User = require('../../models/user.model.js');
const PatientProfile = require('../../models/patientProfile.model.js');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const createPatientValidation = [
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('phoneNumber')
        .isString()
        .notEmpty()
        .withMessage('Phone number is required')
        .custom(async (value) => {
            const user = await User.findOne({ phoneNumber: value });
            if (user) {
                return Promise.reject('Phone number already in use');
            }
        }),
    body('password').isString().optional(),
    handleValidationErrors
];

const getPatientsValidation = [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1 }).toInt(),
    query('search').optional().isString(),
    handleValidationErrors
];

const createPatientProfileValidation = [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    body('relationshipToPrimary').isString().notEmpty().withMessage('Relationship to primary is required'),
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('nationalId').optional().isString().custom(async (value) => {
        if (value) {
            const profile = await PatientProfile.findOne({ nationalId: value });
            if (profile) {
                return Promise.reject('National ID already in use');
            }
        }
    }),
    handleValidationErrors
];

const updateProfileValidation = [
    param('profileId').isMongoId().withMessage('Invalid profile ID'),
    body('nationalId').optional().isString().custom(async (value, { req }) => {
        if (value) {
            const profile = await PatientProfile.findOne({ nationalId: value, _id: { $ne: req.params.profileId } });
            if (profile) {
                return Promise.reject('National ID already in use by another profile');
            }
        }
    }),
    handleValidationErrors
];

const createAppointmentValidation = [
    body('patientProfileId').isMongoId().withMessage('Invalid patient profile ID'),
    body('doctorUserId').isMongoId().withMessage('Invalid doctor user ID'),
    body('appointmentType').isIn(['in_lab', 'home_visit']).withMessage('Invalid appointment type'),
    body('homeVisitAddress').if(body('appointmentType').equals('home_visit'))
        .notEmpty().withMessage('Home visit address is required for home visits'),
    body('appointmentDate').isISO8601().custom((value) => {
        const date = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) {
            return Promise.reject('Appointment date cannot be in the past');
        }
        return true;
    }).withMessage('Invalid appointment date'),
    body('appointmentTime').matches(/^([01]\d|2[0-3]):?([0-5]\d)$/).withMessage('Appointment time must be in HH:MM format'),
    body('notes').optional().isString(),
    handleValidationErrors
];

const getAppointmentsValidation = [
    query('status').optional().isIn(['pending', 'confirmed', 'completed', 'cancelled']),
    query('appointmentType').optional().isIn(['in_lab', 'home_visit']),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1 }).toInt(),
    handleValidationErrors
];

const rescheduleAppointmentValidation = [
    param('id').isMongoId().withMessage('Invalid appointment ID'),
    body('appointmentDate').isISO8601().custom((value) => {
        const date = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) {
            return Promise.reject('Appointment date cannot be in the past');
        }
        return true;
    }).withMessage('Invalid appointment date'),
    body('appointmentTime').matches(/^([01]\d|2[0-3]):?([0-5]\d)$/).withMessage('Appointment time must be in HH:MM format'),
    handleValidationErrors
];

const idParamValidation = [
    param('id').isMongoId().withMessage('Invalid ID'),
    handleValidationErrors
];

const userIdParamValidation = [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    handleValidationErrors
];

module.exports = {
    createPatientValidation,
    getPatientsValidation,
    createPatientProfileValidation,
    updateProfileValidation,
    createAppointmentValidation,
    getAppointmentsValidation,
    rescheduleAppointmentValidation,
    idParamValidation,
    userIdParamValidation
};
