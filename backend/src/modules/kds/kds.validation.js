import Joi from "joi";

export const updateStageSchema = Joi.object({
  stage: Joi.string().valid("to_cook", "preparing", "completed").required(),
});
