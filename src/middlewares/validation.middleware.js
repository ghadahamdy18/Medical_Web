/**
 * Validation middleware factory.
 * Pass a Joi schema; validates req.body and calls next() or returns 422.
 */
const validationMiddleware = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/['"]/g, ''),
      }));

      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    req.body = value; // use sanitized value
    next();
  };
};

module.exports = validationMiddleware;
