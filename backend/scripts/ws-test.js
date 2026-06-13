/**
 * WebSocket smoke test — run with backend dev server up.
 *
 *   node scripts/ws-test.js <jwt_token>
 *
 * Listens for all server events. Trigger actions via API (curl/Postman) to verify:
 *   ORDER_SENT_TO_KDS, KDS_STAGE_UPDATED, KDS_ITEM_COMPLETED,
 *   TABLE_STATUS_CHANGED, SESSION_CLOSED, ORDER_PAID
 */
import WebSocket from "ws";

const WS_URL = process.env.WS_URL || "ws://localhost:5001";
const token = process.argv[2];

if (!token) {
  console.error("Usage: node scripts/ws-test.js <jwt_token>");
  process.exit(1);
}

const ws = new WebSocket(WS_URL);
const seen = new Set();

ws.on("open", () => {
  console.log("Connected — sending AUTH…");
  ws.send(JSON.stringify({ type: "AUTH", token }));
});

ws.on("message", (raw) => {
  const msg = JSON.parse(raw.toString());
  if (msg.type === "AUTH_SUCCESS") {
    console.log("AUTH_SUCCESS — listening for events (Ctrl+C to exit)\n");
    return;
  }
  const key = `${msg.type}:${JSON.stringify(msg.payload)}`;
  if (seen.has(key)) return;
  seen.add(key);
  console.log(`[${new Date().toISOString()}] ${msg.type}`);
  console.log(JSON.stringify(msg.payload, null, 2));
  console.log("");
});

ws.on("close", () => console.log("Disconnected"));
ws.on("error", (err) => console.error("WS error:", err.message));
