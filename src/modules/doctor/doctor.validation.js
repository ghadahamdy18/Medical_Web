import Joi from "joi";

const uploadResultSchema = Joi.object({
  testName: Joi.string().trim().required().messages({
    "string.empty": "testName is required",
    "any.required": "testName is required",
  }),
  resultFile: Joi.any().required().messages({
    "any.required": "Result file is required",
  }),
});
