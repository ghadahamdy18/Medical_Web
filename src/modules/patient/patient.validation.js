const Joi = require("joi");

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const selectProfileSchema = Joi.object({
  profileId: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      "string.empty": "profileId is required",
      "any.required": "profileId is required",
      "string.pattern.base": "profileId must be a valid MongoDB ObjectId",
    }),
});

/**
 * Validates POST /patient/select-profile body (profileId must be a 24-char hex ObjectId).
 */
const validateSelectProfile = (req, res, next) => {
  const { error, value } = selectProfileSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const message = error.details.map((d) => d.message).join("; ");
    const err = new Error(message);
    err.statusCode = 400;
    return next(err);
  }

  req.body = value;
  next();
};

module.exports = {
  validateSelectProfile,
};
