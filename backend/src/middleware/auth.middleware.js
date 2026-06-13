import { verifyToken } from "../utils/jwtHelper.js";
import { ApiError } from "../utils/ApiError.js";

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new ApiError(401, "Unauthorized: missing token");
  }

  const token = header.slice(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    throw new ApiError(401, "Unauthorized: invalid or expired token");
  }

  req.user = {
    userId: decoded.userId,
    tenantId: decoded.tenantId,
    role: decoded.role,
  };
  next();
}
