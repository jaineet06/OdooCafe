import Joi from "joi";

export const createCustomerSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  email: Joi.string().email().allow(null, ""),
  phone: Joi.string().max(20).allow(null, ""),
});

export const updateCustomerSchema = Joi.object({
  name: Joi.string().min(1).max(255),
  email: Joi.string().email().allow(null, ""),
  phone: Joi.string().max(20).allow(null, ""),
}).min(1);
