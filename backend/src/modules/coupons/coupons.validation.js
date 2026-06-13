import Joi from "joi";

export const createCouponSchema = Joi.object({
  code: Joi.string().max(50).required(),
  discountType: Joi.string().valid("percentage", "fixed").required(),
  discountValue: Joi.number().positive().required(),
  isActive: Joi.boolean().default(true),
});

export const updateCouponSchema = Joi.object({
  code: Joi.string().max(50),
  discountType: Joi.string().valid("percentage", "fixed"),
  discountValue: Joi.number().positive(),
  isActive: Joi.boolean(),
}).min(1);

export const validateCouponSchema = Joi.object({
  code: Joi.string().required(),
  orderTotal: Joi.number().min(0).required(),
});
