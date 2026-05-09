const Joi = require('joi');

// ─── Reusable helpers ───────────────────────────────────────────────────────

const objectId = Joi.string().hex().length(24);

const validateBody = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });

    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details.map((d) => d.message),
        });
    }

    req.body = value;
    next();
};

const validateParams = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
    });

    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details.map((d) => d.message),
        });
    }

    req.params = value;
    next();
};

const validateQuery = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
    });

    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details.map((d) => d.message),
        });
    }

    req.query = value;
    next();
};

// ─── Param validations ───────────────────────────────────────────────────────

const userIdParamValidation = validateParams(
    Joi.object({
        userId: objectId.required().messages({
            'string.length': 'userId must be a valid MongoDB ObjectId',
            'string.hex': 'userId must be a valid MongoDB ObjectId',
            'any.required': 'userId is required',
        }),
    })
);

const profileIdParamValidation = validateParams(
    Joi.object({
        profileId: objectId.required().messages({
            'string.length': 'profileId must be a valid MongoDB ObjectId',
            'string.hex': 'profileId must be a valid MongoDB ObjectId',
            'any.required': 'profileId is required',
        }),
    })
);

const idParamValidation = validateParams(
    Joi.object({
        id: objectId.required().messages({
            'string.length': 'id must be a valid MongoDB ObjectId',
            'string.hex': 'id must be a valid MongoDB ObjectId',
            'any.required': 'id is required',
        }),
    })
);

// ─── Patient creation ────────────────────────────────────────────────────────

const createPatientValidation = validateBody(
    Joi.object({
        fullName: Joi.string().trim().min(2).max(100).required().messages({
            'string.empty': 'Full name is required',
            'any.required': 'Full name is required',
        }),
        phoneNumber: Joi.string().trim().min(6).max(20).required().messages({
            'string.empty': 'Phone number is required',
            'any.required': 'Phone number is required',
        }),
        password: Joi.string().min(6).max(100).optional(),
    })
);

// ─── Patient list query ──────────────────────────────────────────────────────

const getPatientsValidation = validateQuery(
    Joi.object({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        search: Joi.string().trim().allow('').optional(),
    })
);

// ─── Patient profile ─────────────────────────────────────────────────────────

const createPatientProfileValidation = validateBody(
    Joi.object({
        fullName: Joi.string().trim().min(2).max(100).required().messages({
            'string.empty': 'fullName is required',
            'any.required': 'fullName is required',
        }),
        relationshipToPrimary: Joi.string().trim().min(2).max(50).required().messages({
            'string.empty': 'relationshipToPrimary is required',
            'any.required': 'relationshipToPrimary is required',
        }),
        gender: Joi.string().valid('male', 'female').optional(),
        dateOfBirth: Joi.date().max('now').optional(),
        nationalId: Joi.string().trim().allow('', null).optional(),
        address: Joi.string().trim().max(500).allow('', null).optional(),
        email: Joi.string().trim().email().allow('', null).optional(),
    })
);

const updateProfileValidation = validateBody(
    Joi.object({
        fullName: Joi.string().trim().min(2).max(100).optional(),
        gender: Joi.string().valid('male', 'female').optional(),
        dateOfBirth: Joi.date().max('now').optional(),
        nationalId: Joi.string().trim().allow('', null).optional(),
        address: Joi.string().trim().max(500).allow('', null).optional(),
        email: Joi.string().trim().email().allow('', null).optional(),
        relationshipToPrimary: Joi.string().trim().min(2).max(50).optional(),
    }).min(1)
);

// ─── Appointments ────────────────────────────────────────────────────────────

const createAppointmentValidation = validateBody(
    Joi.object({
        patientProfileId: objectId.required().messages({
            'any.required': 'patientProfileId is required',
        }),
        doctorUserId: objectId.required().messages({
            'any.required': 'doctorUserId is required',
        }),
        appointmentType: Joi.string().valid('in_lab', 'home_visit').required().messages({
            'any.required': 'appointmentType is required',
            'any.only': 'appointmentType must be in_lab or home_visit',
        }),
        homeVisitAddress: Joi.when('appointmentType', {
            is: 'home_visit',
            then: Joi.string().trim().max(500).required().messages({
                'string.empty': 'homeVisitAddress is required for home visit appointments',
                'any.required': 'homeVisitAddress is required for home visit appointments',
            }),
            otherwise: Joi.string().trim().max(500).allow('', null).optional(),
        }),
        appointmentDate: Joi.date().min('now').required().messages({
            'any.required': 'appointmentDate is required',
            'date.min': 'appointmentDate must not be in the past',
        }),
        appointmentTime: Joi.string()
            .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
            .required()
            .messages({
                'any.required': 'appointmentTime is required',
                'string.pattern.base': 'appointmentTime must be HH:mm in 24-hour format',
            }),
        notes: Joi.string().trim().max(1000).allow('', null).optional(),
    })
);

const getAppointmentsValidation = validateQuery(
    Joi.object({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        status: Joi.string()
            .valid('pending', 'confirmed', 'completed', 'cancelled')
            .optional(),
        appointmentType: Joi.string().valid('in_lab', 'home_visit').optional(),
    })
);

const rescheduleAppointmentValidation = [
    validateParams(
        Joi.object({
            id: objectId.required().messages({
                'any.required': 'id is required',
            }),
        })
    ),
    validateBody(
        Joi.object({
            appointmentDate: Joi.date().min('now').required().messages({
                'any.required': 'appointmentDate is required',
                'date.min': 'appointmentDate must not be in the past',
            }),
            appointmentTime: Joi.string()
                .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
                .required()
                .messages({
                    'any.required': 'appointmentTime is required',
                    'string.pattern.base': 'appointmentTime must be HH:mm in 24-hour format',
                }),
        })
    ),
];

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
    userIdParamValidation,
    profileIdParamValidation,
    idParamValidation,
    createPatientValidation,
    getPatientsValidation,
    createPatientProfileValidation,
    updateProfileValidation,
    createAppointmentValidation,
    getAppointmentsValidation,
    rescheduleAppointmentValidation,
};
