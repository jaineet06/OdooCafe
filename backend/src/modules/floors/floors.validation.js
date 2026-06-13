import Joi from "joi";

export const createFloorSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
});

export const updateFloorSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
});
