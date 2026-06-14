import Joi from "joi";

export const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid("employee").default("employee"),
});

export const changePasswordSchema = Joi.object({
  password: Joi.string().min(8).required(),
});
