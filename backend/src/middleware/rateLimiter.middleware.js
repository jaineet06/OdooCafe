import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { verifyToken } from "../utils/jwtHelper.js";

export const rateLimiter = rateLimit({
  windowMs: env.NODE_ENV === "development" ? 60000 : env.RATE_LIMIT_WINDOW_MS,
  max: env.NODE_ENV === "development" ? 10000 : env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    let tenantId = req.tenantId || "anon";
    if (tenantId === "anon" && req.headers.authorization?.startsWith("Bearer ")) {
      try {
        const token = req.headers.authorization.slice(7);
        const decoded = verifyToken(token);
        if (decoded?.tenantId) {
          tenantId = decoded.tenantId;
        }
      } catch {
        // Fallback to anon
      }
    }
    return `${tenantId}:${req.ip}`;
  },
});
