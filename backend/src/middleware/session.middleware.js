import * as sessionsService from "../services/sessions.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const sessionMiddleware = asyncHandler(async (req, res, next) => {
  if (req.tenantId) {
    const session = await sessionsService.getCurrentSession(req.tenantId);
    req.currentSession = session;
  }
  next();
});
