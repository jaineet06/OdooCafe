import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";

export function errorHandler(err, req, res, next) {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    tenantId: req.tenantId,
  });

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  return res.status(500).json({ success: false, message: "Internal server error" });
}
