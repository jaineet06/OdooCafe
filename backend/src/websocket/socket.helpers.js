import { io } from "./socket.server.js";
import { logger } from "../utils/logger.js";

export function broadcastToKDS(tenantId, eventType, payload) {
  if (!io) {
    logger.warn("Socket.io not initialized, cannot broadcastToKDS");
    return;
  }
  io.to(`tenant:${tenantId}:kds`).emit(eventType, payload);
}

export function broadcastToPOS(tenantId, eventType, payload) {
  if (!io) {
    logger.warn("Socket.io not initialized, cannot broadcastToPOS");
    return;
  }
  io.to(`tenant:${tenantId}`).emit(eventType, payload);
}

export function broadcastToAll(tenantId, eventType, payload) {
  if (!io) {
    logger.warn("Socket.io not initialized, cannot broadcastToAll");
    return;
  }
  io.to(`tenant:${tenantId}`).emit(eventType, payload);
}

