import Joi from "joi";

export const createProductSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  categoryId: Joi.string().uuid().allow(null),
  price: Joi.number().min(0).required(),
  uom: Joi.string().max(50).default("per piece"),
  taxRate: Joi.number().min(0).max(100).default(0),
  description: Joi.string().allow("", null),
  isKdsVisible: Joi.boolean().default(true),
});

export const updateProductSchema = Joi.object({
  name: Joi.string().min(1).max(255),
  categoryId: Joi.string().uuid().allow(null),
  price: Joi.number().min(0),
  uom: Joi.string().max(50),
  taxRate: Joi.number().min(0).max(100),
  description: Joi.string().allow("", null),
  isKdsVisible: Joi.boolean(),
}).min(1);
