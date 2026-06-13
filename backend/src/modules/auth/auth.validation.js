import Joi from "joi";

export const signupSchema = Joi.object({
  tenantName: Joi.string().min(2).max(255).required(),
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const registerKdsSchema = Joi.object({}).optional();
