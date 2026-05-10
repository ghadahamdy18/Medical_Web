const Joi = require('joi');

const validate = (schema) => {
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

const registerPatientValidation = validate(
    Joi.object({
        fullName: Joi.string().trim().min(2).max(100).required(),
        phoneNumber: Joi.string().trim().min(6).max(20).required(),
        email: Joi.string().trim().email().allow('', null).optional(),
        password: Joi.string().min(6).max(100).required(),
        confirmPassword: Joi.string()
          .valid(Joi.ref('password'))
          .required()
          .messages({
            'any.only': 'Confirm password must match password',
          }),
        gender: Joi.string().valid('male', 'female').optional(),
        dateOfBirth: Joi.date().max('now').optional(),
        nationalId: Joi.string().trim().allow('', null).optional(),
        address: Joi.string().trim().max(500).allow('', null).optional(),
    })
);

const loginValidation = validate(
    Joi.object({
        phoneNumber: Joi.string().trim().required(),
        password: Joi.string().required(),
    })
);

const changePasswordValidation = validate(
    Joi.object({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string().min(6).max(100).required(),
        confirmPassword: Joi.string()
            .valid(Joi.ref('newPassword'))
            .required()
            .messages({
                'any.only': 'Confirm password must match new password',
            }),
    })
);

module.exports = {
    registerPatientValidation,
    loginValidation,
    changePasswordValidation,
};