import Joi from "joi";

const hexColor = Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/);

export const createCategorySchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  color: hexColor.default("#6B7280"),
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().min(1).max(100),
  color: hexColor,
}).min(1);
