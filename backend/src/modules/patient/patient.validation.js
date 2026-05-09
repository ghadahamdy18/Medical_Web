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

const appointmentTimePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const appointmentDateRule = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .required()
  .custom((value, helpers) => {
    const [y, m, d] = value.split("-").map(Number);
    const scheduled = new Date(Date.UTC(y, m - 1, d));
    if (Number.isNaN(scheduled.getTime())) {
      return helpers.error("any.invalid");
    }
    if (
      scheduled.getUTCFullYear() !== y ||
      scheduled.getUTCMonth() !== m - 1 ||
      scheduled.getUTCDate() !== d
    ) {
      return helpers.error("any.invalid");
    }
    const today = new Date();
    const todayStart = Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate()
    );
    if (scheduled.getTime() < todayStart) {
      return helpers.error("date.past");
    }
    return value;
  })
  .messages({
    "string.pattern.base": "appointmentDate must be YYYY-MM-DD",
    "any.required": "appointmentDate is required",
    "any.invalid": "appointmentDate must be a valid date",
    "date.past": "appointmentDate must not be in the past",
  });

const notesRule = Joi.string().trim().allow("").optional();

/** Optional query filter: calendar date only (no “not in the past” rule). */
const listAppointmentDateQueryRule = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .custom((value, helpers) => {
    const [y, m, d] = value.split("-").map(Number);
    const scheduled = new Date(Date.UTC(y, m - 1, d));
    if (Number.isNaN(scheduled.getTime())) {
      return helpers.error("any.invalid");
    }
    if (
      scheduled.getUTCFullYear() !== y ||
      scheduled.getUTCMonth() !== m - 1 ||
      scheduled.getUTCDate() !== d
    ) {
      return helpers.error("any.invalid");
    }
    return value;
  })
  .messages({
    "string.pattern.base": "date must be YYYY-MM-DD",
    "any.invalid": "date must be a valid calendar date",
  });

const bookInLabAppointmentSchema = Joi.object({
  profileId: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      "any.required": "profileId is required",
      "string.pattern.base": "profileId must be a valid MongoDB ObjectId",
    }),
  doctorUserId: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      "any.required": "doctorUserId is required",
      "string.pattern.base": "doctorUserId must be a valid MongoDB ObjectId",
    }),
  appointmentDate: appointmentDateRule,
  appointmentTime: Joi.string()
    .pattern(appointmentTimePattern)
    .required()
    .messages({
      "any.required": "appointmentTime is required",
      "string.pattern.base":
        "appointmentTime must be HH:mm in 24-hour format",
    }),
  notes: notesRule,
});

const bookHomeVisitAppointmentSchema = Joi.object({
  profileId: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      "any.required": "profileId is required",
      "string.pattern.base": "profileId must be a valid MongoDB ObjectId",
    }),
  doctorUserId: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      "any.required": "doctorUserId is required",
      "string.pattern.base": "doctorUserId must be a valid MongoDB ObjectId",
    }),
  appointmentDate: appointmentDateRule,
  appointmentTime: Joi.string()
    .pattern(appointmentTimePattern)
    .required()
    .messages({
      "any.required": "appointmentTime is required",
      "string.pattern.base":
        "appointmentTime must be HH:mm in 24-hour format",
    }),
  homeVisitAddress: Joi.string().trim().min(1).required().messages({
    "any.required": "homeVisitAddress is required",
    "string.empty": "homeVisitAddress is required",
    "string.min": "homeVisitAddress is required",
  }),
  notes: notesRule,
});

const runSchema = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
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

const appointmentIdParamSchema = Joi.object({
  appointmentId: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      "any.required": "appointmentId is required",
      "string.pattern.base": "appointmentId must be a valid MongoDB ObjectId",
    }),
});

const rescheduleAppointmentBodySchema = Joi.object({
  appointmentDate: appointmentDateRule,
  appointmentTime: Joi.string()
    .pattern(appointmentTimePattern)
    .required()
    .messages({
      "any.required": "appointmentTime is required",
      "string.pattern.base":
        "appointmentTime must be HH:mm in 24-hour format",
    }),
  homeVisitAddress: Joi.string().trim().allow("").optional(),
});

/**
 * PATCH /patient/appointments/:appointmentId/reschedule — validates param + body.
 */
const rescheduleAppointmentValidation = (req, res, next) => {
  const paramResult = appointmentIdParamSchema.validate(req.params, {
    abortEarly: false,
  });
  if (paramResult.error) {
    const message = paramResult.error.details.map((d) => d.message).join("; ");
    const err = new Error(message);
    err.statusCode = 400;
    return next(err);
  }
  Object.assign(req.params, paramResult.value);

  const bodyResult = rescheduleAppointmentBodySchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (bodyResult.error) {
    const message = bodyResult.error.details.map((d) => d.message).join("; ");
    const err = new Error(message);
    err.statusCode = 400;
    return next(err);
  }
  req.body = bodyResult.value;
  next();
};

/**
 * PATCH /patient/appointments/:appointmentId/cancel — validates appointmentId param only.
 */
const cancelAppointmentValidation = (req, res, next) => {
  const { error, value } = appointmentIdParamSchema.validate(req.params, {
    abortEarly: false,
  });
  if (error) {
    const message = error.details.map((d) => d.message).join("; ");
    const err = new Error(message);
    err.statusCode = 400;
    return next(err);
  }
  Object.assign(req.params, value);
  next();
};

/** Validates POST /patient/select-profile */
const validateSelectProfile = runSchema(selectProfileSchema);

/** Validates POST /patient/appointments/in-lab */
const bookInLabAppointmentValidation = runSchema(bookInLabAppointmentSchema);

/** Validates POST /patient/appointments/home-visit */
const bookHomeVisitAppointmentValidation = runSchema(
  bookHomeVisitAppointmentSchema
);

const getMyAppointmentsQuerySchema = Joi.object({
  profileId: Joi.string()
    .pattern(objectIdPattern)
    .optional()
    .messages({
      "string.pattern.base": "profileId must be a valid MongoDB ObjectId",
    }),
  status: Joi.string()
    .valid("pending", "confirmed", "completed", "cancelled")
    .optional()
    .messages({
      "any.only":
        "status must be one of: pending, confirmed, completed, cancelled",
    }),
  date: listAppointmentDateQueryRule.optional(),
});

/**
 * GET /patient/appointments — optional profileId, status, date query params.
 */
const getMyAppointmentsValidation = (req, res, next) => {
  const { error, value } = getMyAppointmentsQuerySchema.validate(req.query, {
    abortEarly: false,
    allowUnknown: true,
  });

  if (error) {
    const message = error.details.map((d) => d.message).join("; ");
    const err = new Error(message);
    err.statusCode = 400;
    return next(err);
  }

  const merged = { ...req.query };
  if (value.profileId !== undefined) {
    merged.profileId = value.profileId;
  } else {
    delete merged.profileId;
  }
  if (value.status !== undefined) {
    merged.status = value.status;
  } else {
    delete merged.status;
  }
  if (value.date !== undefined) {
    merged.date = value.date;
  } else {
    delete merged.date;
  }
  req.query = merged;
  next();
};

const getMyResultsQuerySchema = Joi.object({
  profileId: Joi.string()
    .pattern(objectIdPattern)
    .optional()
    .messages({
      "string.pattern.base": "profileId must be a valid MongoDB ObjectId",
    }),
  appointmentId: Joi.string()
    .pattern(objectIdPattern)
    .optional()
    .messages({
      "string.pattern.base": "appointmentId must be a valid MongoDB ObjectId",
    }),
});

/**
 * GET /patient/results — optional profileId and appointmentId query params.
 */
const getMyResultsValidation = (req, res, next) => {
  const { error, value } = getMyResultsQuerySchema.validate(req.query, {
    abortEarly: false,
    allowUnknown: true,
  });

  if (error) {
    const message = error.details.map((d) => d.message).join("; ");
    const err = new Error(message);
    err.statusCode = 400;
    return next(err);
  }

  const merged = { ...req.query };
  if (value.profileId !== undefined) {
    merged.profileId = value.profileId;
  } else {
    delete merged.profileId;
  }
  if (value.appointmentId !== undefined) {
    merged.appointmentId = value.appointmentId;
  } else {
    delete merged.appointmentId;
  }
  req.query = merged;
  next();
};

const resultIdParamSchema = Joi.object({
  resultId: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      "any.required": "resultId is required",
      "string.pattern.base": "resultId must be a valid MongoDB ObjectId",
    }),
});

/**
 * GET /patient/results/:resultId/download
 */
const downloadResultValidation = (req, res, next) => {
  const { error, value } = resultIdParamSchema.validate(req.params, {
    abortEarly: false,
  });
  if (error) {
    const message = error.details.map((d) => d.message).join("; ");
    const err = new Error(message);
    err.statusCode = 400;
    return next(err);
  }
  Object.assign(req.params, value);
  next();
};

module.exports = {
  validateSelectProfile,
  bookInLabAppointmentValidation,
  bookHomeVisitAppointmentValidation,
  rescheduleAppointmentValidation,
  cancelAppointmentValidation,
  getMyAppointmentsValidation,
  getMyResultsValidation,
  downloadResultValidation,
};
