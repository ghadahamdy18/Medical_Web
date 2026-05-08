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

// ─── Param validations ───────────────────────────────────────────────────────

const appointmentIdParamValidation = validateParams(
    Joi.object({
        appointmentId: objectId.required().messages({
            'string.length': 'appointmentId must be a valid MongoDB ObjectId',
            'string.hex': 'appointmentId must be a valid MongoDB ObjectId',
            'any.required': 'appointmentId is required',
        }),
    })
);

// ─── Body validations ────────────────────────────────────────────────────────

/**
 * Validates the body of POST /appointments/:appointmentId/results.
 * Note: the file itself is validated in the service layer (mimetype + presence).
 */
const uploadResultValidation = validateBody(
    Joi.object({
        testName: Joi.string().trim().min(2).max(150).required().messages({
            'string.empty': 'testName is required',
            'string.min': 'testName must be at least 2 characters',
            'string.max': 'testName must not exceed 150 characters',
            'any.required': 'testName is required',
        }),
    })
);

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
    appointmentIdParamValidation,
    uploadResultValidation,
};
