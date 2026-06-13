import Joi from "joi";

export const emailReceiptSchema = Joi.object({
  email: Joi.string().email().required(),
});
