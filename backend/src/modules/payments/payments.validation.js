import Joi from "joi";

export const createIntentSchema = Joi.object({
  orderId: Joi.string().uuid().required(),
});

export const confirmCashSchema = Joi.object({
  orderId: Joi.string().uuid().required(),
  amountTendered: Joi.number().positive().required(),
});

export const confirmUpiSchema = Joi.object({
  orderId: Joi.string().uuid().required(),
  upiRef: Joi.string().required(),
});
