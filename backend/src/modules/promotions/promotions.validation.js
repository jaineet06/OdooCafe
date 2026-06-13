import Joi from "joi";

export const createPromotionSchema = Joi.object({
  name: Joi.string().max(255).required(),
  applyTo: Joi.string().valid("product", "order").required(),
  productId: Joi.when("applyTo", { is: "product", then: Joi.string().uuid().required(), otherwise: Joi.forbidden() }),
  minQty: Joi.when("applyTo", { is: "product", then: Joi.number().integer().min(1).required(), otherwise: Joi.forbidden() }),
  minOrderAmount: Joi.when("applyTo", { is: "order", then: Joi.number().positive().required(), otherwise: Joi.forbidden() }),
  discountType: Joi.string().valid("percentage", "fixed").required(),
  discountValue: Joi.number().positive().required(),
  isActive: Joi.boolean().default(true),
});

export const updatePromotionSchema = Joi.object({
  name: Joi.string().max(255),
  applyTo: Joi.string().valid("product", "order"),
  productId: Joi.string().uuid().allow(null),
  minQty: Joi.number().integer().min(1).allow(null),
  minOrderAmount: Joi.number().positive().allow(null),
  discountType: Joi.string().valid("percentage", "fixed"),
  discountValue: Joi.number().positive(),
  isActive: Joi.boolean(),
}).min(1);
