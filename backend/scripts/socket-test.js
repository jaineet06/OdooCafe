import { io as ioClient } from "socket.io-client";
import pg from "pg";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const PORT = process.env.PORT || 5001;
const SOCKET_URL = `http://localhost:${PORT}`;
const API_URL = `http://localhost:${PORT}/api`;

async function main() {
  console.log("Starting Socket.io targeted delivery test...");

  const tenantRes = await pool.query("SELECT id FROM tenants LIMIT 1");
  if (tenantRes.rows.length === 0) {
    console.error("No tenants found in DB. Run seed first!");
    process.exit(1);
  }
  const tenantId = tenantRes.rows[0].id;

  const userRes = await pool.query("SELECT id FROM users WHERE tenant_id = $1 AND role = 'admin' LIMIT 1", [tenantId]);
  if (userRes.rows.length === 0) {
    console.error("No admin user found. Run seed first!");
    process.exit(1);
  }
  const userId = userRes.rows[0].id;

  const secret = process.env.JWT_SECRET;
  const posToken = jwt.sign({ userId, tenantId, role: "admin" }, secret, { expiresIn: "1h" });
  const kdsToken = jwt.sign({ userId: "00000000-0000-0000-0000-000000000000", tenantId, role: "kds_device" }, secret, { expiresIn: "1h" });

  console.log(`Connecting POS & KDS clients to Socket server at ${SOCKET_URL}...`);

  const posClient = ioClient(SOCKET_URL, {
    auth: { token: posToken },
    transports: ["websocket"]
  });

  const kdsClient = ioClient(SOCKET_URL, {
    auth: { token: kdsToken },
    transports: ["websocket"]
  });

  let posReceived = [];
  let kdsReceived = [];

  posClient.onAny((event, data) => {
    console.log("[POS Client] Received:", event, data);
    posReceived.push({ event, data });
  });

  kdsClient.onAny((event, data) => {
    console.log("[KDS Client] Received:", event, data);
    kdsReceived.push({ event, data });
  });

  await new Promise((resolve) => setTimeout(resolve, 1500));

  const tableRes = await pool.query("SELECT id FROM tables WHERE tenant_id = $1 LIMIT 1", [tenantId]);
  const tableId = tableRes.rows[0]?.id;

  const orderRes = await pool.query("SELECT id FROM orders WHERE tenant_id = $1 AND status = 'draft' LIMIT 1", [tenantId]);
  const orderId = orderRes.rows[0]?.id;

  if (!tableId || !orderId) {
    console.error("Could not find table or draft order to run tests.");
    posClient.disconnect();
    kdsClient.disconnect();
    await pool.end();
    process.exit(1);
  }

  console.log("\n--- TEST 1: Table Occupancy Change (Should go to all tenant POS clients) ---");
  const occRes = await fetch(`${API_URL}/tables/${tableId}/occupancy`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${posToken}`
    },
    body: JSON.stringify({ isOccupied: true })
  });
  if (!occRes.ok) {
    console.error("Occupancy PATCH failed", await occRes.text());
  }

  await new Promise((resolve) => setTimeout(resolve, 1500));

  console.log("\n--- TEST 2: Send Order to KDS (Should go to KDS room only) ---");
  const kdsRes = await fetch(`${API_URL}/orders/${orderId}/send-to-kds`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${posToken}`
    }
  });
  if (!kdsRes.ok) {
    console.error("Send to KDS failed", await kdsRes.text());
  }

  await new Promise((resolve) => setTimeout(resolve, 1500));

  posClient.disconnect();
  kdsClient.disconnect();
  await pool.end();

  console.log("\n--- Test Results Summary ---");
  console.log("POS client received events:", posReceived.map(r => r.event));
  console.log("KDS client received events:", kdsReceived.map(r => r.event));

  const tableStatusChecked = posReceived.some(r => r.event === "TABLE_STATUS_CHANGED");
  const orderSentToKdsPos = posReceived.some(r => r.event === "ORDER_SENT_TO_KDS");
  const orderSentToKdsKds = kdsReceived.some(r => r.event === "ORDER_SENT_TO_KDS");

  let success = true;
  if (!tableStatusChecked) {
    console.error("FAIL: TABLE_STATUS_CHANGED not received by POS");
    success = false;
  }
  if (orderSentToKdsPos) {
    console.error("FAIL: ORDER_SENT_TO_KDS was received by POS (should be KDS-only!)");
    success = false;
  }
  if (!orderSentToKdsKds) {
    console.error("FAIL: ORDER_SENT_TO_KDS not received by KDS");
    success = false;
  }

  if (success) {
    console.log("\nALL TESTS PASSED SUCCESSFULLY! Socket.io rooms and targeted delivery verified.");
    process.exit(0);
  } else {
    console.error("\nTEST SUITE FAILED.");
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Unhandled error in test runner", err);
  process.exit(1);
});
