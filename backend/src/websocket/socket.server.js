import { Server } from "socket.io";
import { verifyToken } from "../utils/jwtHelper.js";
import { logger } from "../utils/logger.js";

export let io = null;

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Authentication error: Token required"));
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return next(new Error("Authentication error: Invalid token"));
      }

      socket.userId = decoded.userId;
      socket.tenantId = decoded.tenantId;
      socket.role = decoded.role;
      next();
    } catch (err) {
      next(new Error("Authentication error: " + err.message));
    }
  });

  io.on("connection", (socket) => {
    const tenantId = socket.tenantId;
    const role = socket.role;

    logger.info(`Socket connected: ${socket.id}, User: ${socket.userId}, Tenant: ${tenantId}, Role: ${role}`);

    socket.join(`tenant:${tenantId}`);

    if (role === "kds_device") {
      socket.join(`tenant:${tenantId}:kds`);
      logger.info(`Socket ${socket.id} joined KDS room tenant:${tenantId}:kds`);
    }

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

