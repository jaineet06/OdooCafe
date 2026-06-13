import { ApiError } from "../utils/ApiError.js";

export const validate =
  (schema, target = "body") =>
  (req, res, next) => {
    const { error } = schema.validate(req[target], { abortEarly: false });
    if (error) {
      const errors = error.details.map((d) => ({
        field: d.path.join("."),
        message: d.message,
      }));
      throw new ApiError(422, "Validation failed", errors);
    }
    next();
  };
