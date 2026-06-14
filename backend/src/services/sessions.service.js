import * as sessionsModel from "../models/sessions.model.js";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import { broadcastToAll } from "../websocket/socket.helpers.js";

export async function listSessions(tenantId) {
  return sessionsModel.findSessions(tenantId);
}

export async function getCurrentSession(tenantId) {
  // Returns null if no open session — not an error
  return sessionsModel.findCurrentSession(tenantId);
}

export async function openSession(tenantId, openedBy, openingBalance = 0) {
  const existing = await sessionsModel.findCurrentSession(tenantId);
  if (existing) {
    throw new ApiError(409, "A session is already open. Close it before opening a new one.");
  }

  const session = await sessionsModel.insertSession(tenantId, openedBy, openingBalance);
  logger.info("Session opened", { tenantId, sessionId: session.id, openedBy });
  return session;
}

export async function closeSession(tenantId, id, { closingBalance, force } = {}) {
  const session = await sessionsModel.findSessionById(tenantId, id);
  if (!session) throw new ApiError(404, "Session not found");
  if (session.status === "closed") throw new ApiError(409, "Session is already closed");

  const closed = await sessionsModel.closeSessionById(tenantId, id, closingBalance);
  if (!closed) throw new ApiError(500, "Failed to close session");

  logger.info("Session closed", { tenantId, sessionId: id });
  broadcastToAll(tenantId, "SESSION_CLOSED", { sessionId: id });
  return closed;
}
