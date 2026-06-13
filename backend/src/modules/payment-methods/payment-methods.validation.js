import Joi from "joi";

export const updateUpiIdSchema = Joi.object({
  upiId: Joi.string().max(100).required(),
});
