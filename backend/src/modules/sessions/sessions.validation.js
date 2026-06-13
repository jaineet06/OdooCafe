import Joi from "joi";

export const openSessionSchema = Joi.object({
  openingBalance: Joi.number().min(0).default(0),
});
