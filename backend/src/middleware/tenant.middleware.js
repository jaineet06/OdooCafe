import { ApiError } from "../utils/ApiError.js";

export function tenantMiddleware(req, res, next) {
  if (!req.user?.tenantId) {
    throw new ApiError(401, "Tenant context missing");
  }
  req.tenantId = req.user.tenantId;
  next();
}
