import Joi from "joi";

const orderItemSchema = Joi.object({
  productId: Joi.string().uuid().required(),
  quantity: Joi.number().integer().min(1).required(),
});

export const createOrderSchema = Joi.object({
  sessionId: Joi.string().uuid().required(),
  tableId: Joi.string().uuid().allow(null),
  customerId: Joi.string().uuid().allow(null),
  items: Joi.array().items(orderItemSchema).min(1).required(),
  couponCode: Joi.string().allow(null, ""),
});

export const updateOrderSchema = Joi.object({
  tableId: Joi.string().uuid().allow(null),
  customerId: Joi.string().uuid().allow(null),
  items: Joi.array().items(orderItemSchema).min(1).required(),
  couponCode: Joi.string().allow(null, ""),
});

export const previewOrderSchema = Joi.object({
  items: Joi.array().items(orderItemSchema).min(1).required(),
  couponCode: Joi.string().allow(null, ""),
});
