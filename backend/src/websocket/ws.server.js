import { WebSocketServer } from "ws";
import { verifyToken } from "../utils/jwtHelper.js";
import { logger } from "../utils/logger.js";

export const tenantPOSClients = new Map();
export const tenantKDSClients = new Map();

export function initWebSocket(server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    ws.isAuthenticated = false;

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw);

        if (msg.type === "AUTH") {
          const decoded = verifyToken(msg.token);
          if (!decoded) {
            ws.close(4001, "Invalid token");
            return;
          }

          ws.userId = decoded.userId;
          ws.tenantId = decoded.tenantId;
          ws.role = decoded.role;
          ws.isAuthenticated = true;

          if (decoded.role === "kds_device") {
            if (!tenantKDSClients.has(decoded.tenantId)) {
              tenantKDSClients.set(decoded.tenantId, new Set());
            }
            tenantKDSClients.get(decoded.tenantId).add(ws);
          } else {
            if (!tenantPOSClients.has(decoded.tenantId)) {
              tenantPOSClients.set(decoded.tenantId, new Set());
            }
            tenantPOSClients.get(decoded.tenantId).add(ws);
          }

          ws.send(JSON.stringify({ type: "AUTH_SUCCESS" }));
        }
      } catch (err) {
        logger.error("WebSocket message error", { error: err.message });
      }
    });

    ws.on("close", () => {
      if (ws.tenantId) {
        tenantKDSClients.get(ws.tenantId)?.delete(ws);
        tenantPOSClients.get(ws.tenantId)?.delete(ws);
      }
    });
  });

  return wss;
}
