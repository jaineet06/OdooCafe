import pool from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";
import { broadcastToAll } from "../../websocket/ws.helpers.js";
import { WS_EVENTS } from "../../websocket/ws.events.js";
import { ACTIVE_ORDER_LATERAL, ORDER_STATUS_CASE } from "./tableStatus.sql.js";

async function getTableStatus(tenantId, tableId) {
  const result = await pool.query(
    `SELECT t.id,
            CASE WHEN EXISTS (
              SELECT 1 FROM orders o
              INNER JOIN sessions s ON s.id = o.session_id
                AND s.tenant_id = o.tenant_id
                AND s.status = 'open'
              WHERE o.table_id = t.id
                AND o.tenant_id = $1
                AND o.status NOT IN ('paid', 'cancelled')
            ) THEN 'occupied' ELSE 'available' END AS status
     FROM tables t WHERE t.id = $2 AND t.tenant_id = $1`,
    [tenantId, tableId]
  );
  return result.rows[0]?.status || "available";
}

export async function getTableStatuses(tenantId) {
  const openSessionId = await pool.query(
    `SELECT id FROM sessions WHERE tenant_id = $1 AND status = 'open' ORDER BY opened_at DESC LIMIT 1`,
    [tenantId]
  );
  const sessionId = openSessionId.rows[0]?.id;

  const result = await pool.query(
    `SELECT t.id, t.table_number, t.floor_id, f.name AS floor_name, t.seats, t.is_active,
            ${ORDER_STATUS_CASE} AS order_status,
            active_order.id AS draft_order_id,
            active_order.order_number AS draft_order_number,
            active_order.total AS draft_order_total
     FROM tables t
     JOIN floors f ON f.id = t.floor_id AND f.tenant_id = t.tenant_id
     ${ACTIVE_ORDER_LATERAL}
     WHERE t.tenant_id = $1
     ORDER BY f.name, t.table_number`,
    [tenantId]
  );

  return { sessionId, tables: result.rows };
}

export async function listTables(tenantId, { floorId } = {}) {
  const conditions = ["t.tenant_id = $1"];
  const params = [tenantId];
  if (floorId) {
    conditions.push("t.floor_id = $2");
    params.push(floorId);
  }

  const result = await pool.query(
    `SELECT t.*, f.name AS floor_name,
            ${ORDER_STATUS_CASE} AS order_status,
            active_order.id AS draft_order_id,
            active_order.order_number AS draft_order_number,
            active_order.total AS draft_order_total
     FROM tables t
     JOIN floors f ON f.id = t.floor_id AND f.tenant_id = t.tenant_id
     ${ACTIVE_ORDER_LATERAL}
     WHERE ${conditions.join(" AND ")}
     ORDER BY f.name, t.table_number`,
    params
  );
  return result.rows;
}

export async function createTable(tenantId, data) {
  const floor = await pool.query(
    `SELECT id FROM floors WHERE id = $1 AND tenant_id = $2`,
    [data.floorId, tenantId]
  );
  if (floor.rows.length === 0) throw new ApiError(404, "Floor not found");

  try {
    const result = await pool.query(
      `INSERT INTO tables (tenant_id, floor_id, table_number, seats)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [tenantId, data.floorId, data.tableNumber, data.seats]
    );
    return result.rows[0];
  } catch (err) {
    if (err.code === "23505") throw new ApiError(409, "Table number already exists");
    throw err;
  }
}

export async function updateTable(tenantId, id, data) {
  const existing = await pool.query(
    `SELECT id FROM tables WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );
  if (existing.rows.length === 0) throw new ApiError(404, "Table not found");

  const fields = [];
  const values = [tenantId, id];
  let idx = 3;
  const map = { floorId: "floor_id", tableNumber: "table_number", seats: "seats", isActive: "is_active" };
  for (const [key, col] of Object.entries(map)) {
    if (data[key] !== undefined) {
      fields.push(`${col} = $${idx++}`);
      values.push(data[key]);
    }
  }

  const result = await pool.query(
    `UPDATE tables SET ${fields.join(", ")} WHERE tenant_id = $1 AND id = $2 RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function deleteTable(tenantId, id) {
  const result = await pool.query(
    `DELETE FROM tables WHERE id = $1 AND tenant_id = $2 RETURNING id`,
    [id, tenantId]
  );
  if (result.rows.length === 0) throw new ApiError(404, "Table not found");
  return { id };
}

export async function toggleTableStatus(tenantId, id, isActive) {
  const result = await pool.query(
    `UPDATE tables SET is_active = $3 WHERE id = $2 AND tenant_id = $1 RETURNING *`,
    [tenantId, id, isActive]
  );
  if (result.rows.length === 0) throw new ApiError(404, "Table not found");

  const status = await getTableStatus(tenantId, id);
  broadcastToAll(tenantId, WS_EVENTS.TABLE_STATUS_CHANGED, { tableId: id, status, isActive });

  return result.rows[0];
}

export async function broadcastTableStatusChange(tenantId, tableId) {
  if (!tableId) return;
  const status = await getTableStatus(tenantId, tableId);
  broadcastToAll(tenantId, WS_EVENTS.TABLE_STATUS_CHANGED, { tableId, status });
}
