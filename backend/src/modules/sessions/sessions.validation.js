import Joi from "joi";

export const openSessionSchema = Joi.object({
  openingBalance: Joi.number().min(0).default(0),
});

export const closeSessionSchema = Joi.object({
  closingBalance: Joi.number().min(0).allow(null),
  force: Joi.boolean().default(false),
});
