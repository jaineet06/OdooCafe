import pool from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";
import { broadcastToPOS } from "../../websocket/ws.helpers.js";
import { WS_EVENTS } from "../../websocket/ws.events.js";

const STAGE_ORDER = ["to_cook", "preparing", "completed"];

async function updateDeviceLastSeen(tenantId, userId, role) {
  if (role === "kds_device") {
    await pool.query(
      `UPDATE kds_devices SET last_seen_at = NOW() WHERE id = $1 AND tenant_id = $2`,
      [userId, tenantId]
    );
  }
}

export async function listKDSOrders(tenantId, userId, role) {
  await updateDeviceLastSeen(tenantId, userId, role);

  const result = await pool.query(
    `SELECT ko.id AS kds_order_id, ko.stage, ko.sent_at, ko.updated_at,
            o.id AS order_id, o.order_number, o.table_id, t.table_number,
            COALESCE(
              JSON_AGG(
                JSON_BUILD_OBJECT(
                  'kdsItemId', koi.id,
                  'orderItemId', oi.id,
                  'productId', oi.product_id,
                  'productName', p.name,
                  'quantity', oi.quantity,
                  'isCompleted', koi.is_completed,
                  'completedAt', koi.completed_at
                ) ORDER BY p.name
              ) FILTER (WHERE koi.id IS NOT NULL),
              '[]'
            ) AS items
     FROM kds_orders ko
     JOIN orders o ON o.id = ko.order_id AND o.tenant_id = ko.tenant_id
     LEFT JOIN tables t ON t.id = o.table_id
     LEFT JOIN kds_order_items koi ON koi.kds_order_id = ko.id
     LEFT JOIN order_items oi ON oi.id = koi.order_item_id
     LEFT JOIN products p ON p.id = oi.product_id AND p.is_kds_visible = TRUE
     WHERE ko.tenant_id = $1 AND ko.stage != 'completed'
     GROUP BY ko.id, o.id, t.table_number
     ORDER BY ko.sent_at ASC`,
    [tenantId]
  );
  return result.rows;
}

export async function searchKDSOrders(tenantId, userId, role, { query, stage } = {}) {
  await updateDeviceLastSeen(tenantId, userId, role);

  const conditions = ["ko.tenant_id = $1"];
  const params = [tenantId];
  let idx = 2;

  if (stage) {
    conditions.push(`ko.stage = $${idx++}`);
    params.push(stage);
  }
  if (query) {
    conditions.push(`(o.order_number::text ILIKE $${idx} OR t.table_number ILIKE $${idx})`);
    params.push(`%${query}%`);
    idx++;
  }

  const result = await pool.query(
    `SELECT ko.id AS kds_order_id, ko.stage, ko.sent_at,
            o.id AS order_id, o.order_number, t.table_number
     FROM kds_orders ko
     JOIN orders o ON o.id = ko.order_id
     LEFT JOIN tables t ON t.id = o.table_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY ko.sent_at DESC LIMIT 50`,
    params
  );
  return result.rows;
}

export async function advanceStage(tenantId, kdsOrderId, newStage) {
  const existing = await pool.query(
    `SELECT ko.*, o.id AS order_id FROM kds_orders ko
     JOIN orders o ON o.id = ko.order_id
     WHERE ko.id = $1 AND ko.tenant_id = $2`,
    [kdsOrderId, tenantId]
  );
  if (existing.rows.length === 0) throw new ApiError(404, "KDS order not found");

  const current = existing.rows[0];
  const currentIdx = STAGE_ORDER.indexOf(current.stage);
  const newIdx = STAGE_ORDER.indexOf(newStage);
  if (newIdx !== currentIdx + 1 && newIdx !== currentIdx) {
    throw new ApiError(400, "Invalid stage transition");
  }

  const result = await pool.query(
    `UPDATE kds_orders SET stage = $3, updated_at = NOW()
     WHERE id = $2 AND tenant_id = $1 RETURNING *`,
    [tenantId, kdsOrderId, newStage]
  );

  broadcastToPOS(tenantId, WS_EVENTS.KDS_STAGE_UPDATED, {
    kdsOrderId,
    orderId: current.order_id,
    newStage,
  });

  return result.rows[0];
}

export async function completeItem(tenantId, kdsOrderId, kdsItemId) {
  const result = await pool.query(
    `UPDATE kds_order_items SET is_completed = TRUE, completed_at = NOW()
     WHERE id = $3 AND kds_order_id = $2 AND tenant_id = $1
     RETURNING id, order_item_id`,
    [tenantId, kdsOrderId, kdsItemId]
  );
  if (result.rows.length === 0) throw new ApiError(404, "KDS item not found");

  broadcastToPOS(tenantId, WS_EVENTS.KDS_ITEM_COMPLETED, {
    kdsOrderId,
    orderItemId: result.rows[0].order_item_id,
  });

  return result.rows[0];
}
