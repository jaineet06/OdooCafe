import { tenantPOSClients, tenantKDSClients } from "./ws.server.js";

function sendToClients(clients, eventType, payload) {
  const message = JSON.stringify({ type: eventType, payload });
  for (const ws of clients) {
    if (ws.readyState === 1) {
      ws.send(message);
    }
  }
}

export function broadcastToKDS(tenantId, eventType, payload) {
  const clients = tenantKDSClients.get(tenantId);
  if (clients) sendToClients(clients, eventType, payload);
}

export function broadcastToPOS(tenantId, eventType, payload) {
  const clients = tenantPOSClients.get(tenantId);
  if (clients) sendToClients(clients, eventType, payload);
}

export function broadcastToAll(tenantId, eventType, payload) {
  broadcastToKDS(tenantId, eventType, payload);
  broadcastToPOS(tenantId, eventType, payload);
}
