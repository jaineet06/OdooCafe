import Joi from "joi";

export const createTableSchema = Joi.object({
  floorId: Joi.string().uuid().required(),
  tableNumber: Joi.string().max(20).required(),
  seats: Joi.number().integer().min(1).required(),
});

export const updateTableSchema = Joi.object({
  floorId: Joi.string().uuid(),
  tableNumber: Joi.string().max(20),
  seats: Joi.number().integer().min(1),
  isActive: Joi.boolean(),
}).min(1);

export const toggleStatusSchema = Joi.object({
  isActive: Joi.boolean().required(),
});
