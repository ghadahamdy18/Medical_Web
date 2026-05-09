const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const validateBody = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map((detail) => detail.message),
            });
        }

        req.body = value;
        next();
    };
};

const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map((detail) => detail.message),
            });
        }

        req.query = value;
        next();
    };
};

const validateParams = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map((detail) => detail.message),
            });
        }

        req.params = value;
        next();
    };
};

const paginationQuery = {
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
};

const userIdParamValidation = validateParams(
    Joi.object({
        userId: objectId.required(),
    })
);

const profileIdParamValidation = validateParams(
    Joi.object({
        profileId: objectId.required(),
    })
);

const appointmentIdParamValidation = validateParams(
    Joi.object({
        appointmentId: objectId.required(),
    })
);

const resultIdParamValidation = validateParams(
    Joi.object({
        resultId: objectId.required(),
    })
);

const createUserValidation = validateBody(
    Joi.object({
        fullName: Joi.string().trim().min(2).max(100).required(),
        phoneNumber: Joi.string().trim().min(6).max(20).required(),
        email: Joi.string().trim().email().allow('', null).optional(),
        password: Joi.string().min(6).max(100).required(),
        role: Joi.string()
            .valid('admin', 'doctor', 'patient', 'receptionist')
            .required(),
        mustChangePassword: Joi.boolean().optional(),
        isActive: Joi.boolean().optional(),
        status: Joi.string()
            .valid('active', 'inactive', 'blocked', 'archived')
            .optional(),

        profileFullName: Joi.when('role', {
            is: 'patient',
            then: Joi.string().trim().min(2).max(100).optional(),
            otherwise: Joi.forbidden(),
        }),
        gender: Joi.when('role', {
            is: 'patient',
            then: Joi.string().valid('male', 'female').optional(),
            otherwise: Joi.forbidden(),
        }),
        dateOfBirth: Joi.when('role', {
            is: 'patient',
            then: Joi.date().max('now').optional(),
            otherwise: Joi.forbidden(),
        }),
        nationalId: Joi.when('role', {
            is: 'patient',
            then: Joi.string().trim().allow('', null).optional(),
            otherwise: Joi.forbidden(),
        }),
        address: Joi.when('role', {
            is: 'patient',
            then: Joi.string().trim().max(500).allow('', null).optional(),
            otherwise: Joi.forbidden(),
        }),
    })
);

const getUsersValidation = validateQuery(
    Joi.object({
        ...paginationQuery,
        search: Joi.string().trim().allow('').optional(),
        role: Joi.string()
            .valid('admin', 'doctor', 'patient', 'receptionist')
            .optional(),
        status: Joi.string()
            .valid('active', 'inactive', 'blocked', 'archived')
            .optional(),
        isActive: Joi.boolean().truthy('true').falsy('false').optional(),
    })
);

const updateUserValidation = validateBody(
    Joi.object({
        fullName: Joi.string().trim().min(2).max(100).optional(),
        phoneNumber: Joi.string().trim().min(6).max(20).optional(),
        email: Joi.string().trim().email().allow('', null).optional(),
        mustChangePassword: Joi.boolean().optional(),
        isActive: Joi.boolean().optional(),
        status: Joi.string()
            .valid('active', 'inactive', 'blocked', 'archived')
            .optional(),
    }).min(1)
);

const updateUserStatusValidation = validateBody(
    Joi.object({
        status: Joi.string()
            .valid('active', 'inactive', 'blocked', 'archived')
            .optional(),
        isActive: Joi.boolean().optional(),
        mustChangePassword: Joi.boolean().optional(),
    }).min(1)
);

const getPatientProfilesValidation = validateQuery(
    Joi.object({
        ...paginationQuery,
        search: Joi.string().trim().allow('').optional(),
        userId: objectId.optional(),
        isActive: Joi.boolean().truthy('true').falsy('false').optional(),
        isPrimary: Joi.boolean().truthy('true').falsy('false').optional(),
    })
);

const createPatientProfileValidation = validateBody(
    Joi.object({
        fullName: Joi.string().trim().min(2).max(100).required(),
        gender: Joi.string().valid('male', 'female').optional(),
        dateOfBirth: Joi.date().max('now').optional(),
        nationalId: Joi.string().trim().allow('', null).optional(),
        address: Joi.string().trim().max(500).allow('', null).optional(),
        email: Joi.string().trim().email().allow('', null).optional(),
        relationshipToPrimary: Joi.string().trim().min(2).max(50).required(),
    })
);

const updatePatientProfileValidation = validateBody(
    Joi.object({
        fullName: Joi.string().trim().min(2).max(100).optional(),
        gender: Joi.string().valid('male', 'female').optional(),
        dateOfBirth: Joi.date().max('now').optional(),
        nationalId: Joi.string().trim().allow('', null).optional(),
        address: Joi.string().trim().max(500).allow('', null).optional(),
        email: Joi.string().trim().email().allow('', null).optional(),
        relationshipToPrimary: Joi.string().trim().min(2).max(50).optional(),
        isActive: Joi.boolean().optional(),
    }).min(1)
);

const createAppointmentValidation = validateBody(
    Joi.object({
        patientProfileId: objectId.required(),
        doctorUserId: objectId.required(),
        appointmentType: Joi.string().valid('in_lab', 'home_visit').required(),
        appointmentStatus: Joi.string()
            .valid('pending', 'confirmed', 'completed', 'cancelled')
            .optional(),
        appointmentDate: Joi.date().required(),
        appointmentTime: Joi.string().trim().required(),
        homeVisitAddress: Joi.when('appointmentType', {
            is: 'home_visit',
            then: Joi.string().trim().max(500).required(),
            otherwise: Joi.string().trim().max(500).allow('', null).optional(),
        }),
        notes: Joi.string().trim().max(1000).allow('', null).optional(),
    })
);

const getAppointmentsValidation = validateQuery(
    Joi.object({
        ...paginationQuery,
        patientProfileId: objectId.optional(),
        doctorUserId: objectId.optional(),
        appointmentType: Joi.string().valid('in_lab', 'home_visit').optional(),
        appointmentStatus: Joi.string()
            .valid('pending', 'confirmed', 'completed', 'cancelled')
            .optional(),
        date: Joi.date().optional(),
    })
);

const updateAppointmentValidation = validateBody(
    Joi.object({
        patientProfileId: objectId.optional(),
        doctorUserId: objectId.optional(),
        appointmentType: Joi.string().valid('in_lab', 'home_visit').optional(),
        appointmentDate: Joi.date().optional(),
        appointmentTime: Joi.string().trim().optional(),
        homeVisitAddress: Joi.string().trim().max(500).allow('', null).optional(),
        notes: Joi.string().trim().max(1000).allow('', null).optional(),
    }).min(1)
);

const getResultsValidation = validateQuery(
    Joi.object({
        ...paginationQuery,
        appointmentId: objectId.optional(),
        doctorUserId: objectId.optional(),
        testName: Joi.string().trim().allow('').optional(),
        isLatest: Joi.boolean().truthy('true').falsy('false').optional(),
    })
);

module.exports = {
    userIdParamValidation,
    profileIdParamValidation,
    appointmentIdParamValidation,
    resultIdParamValidation,
    createUserValidation,
    getUsersValidation,
    updateUserValidation,
    updateUserStatusValidation,
    getPatientProfilesValidation,
    createPatientProfileValidation,
    updatePatientProfileValidation,
    createAppointmentValidation,
    getAppointmentsValidation,
    updateAppointmentValidation,
    getResultsValidation,
};