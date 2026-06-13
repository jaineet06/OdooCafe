import { ApiError } from "../utils/ApiError.js";

export const rbac =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, "Forbidden: insufficient role");
    }

    if (
      req.user.role === "kds_device" &&
      !req.originalUrl.startsWith("/api/kds") &&
      req.baseUrl !== "/api/kds"
    ) {
      throw new ApiError(403, "KDS devices may only access /api/kds routes");
    }

    next();
  };
