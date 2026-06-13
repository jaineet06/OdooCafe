import pool from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";
import { ACTIVE_ORDER_LATERAL, ORDER_STATUS_CASE } from "../tables/tableStatus.sql.js";

export async function listFloors(tenantId) {
  const result = await pool.query(
    `SELECT f.id, f.name, f.created_at,
            COALESCE(
              JSON_AGG(
                JSON_BUILD_OBJECT(
                  'id', t.id,
                  'table_number', t.table_number,
                  'seats', t.seats,
                  'is_active', t.is_active,
                  'created_at', t.created_at,
                  'order_status', ${ORDER_STATUS_CASE},
                  'draft_order_id', active_order.id,
                  'draft_order_number', active_order.order_number,
                  'draft_order_total', active_order.total
                ) ORDER BY t.table_number
              ) FILTER (WHERE t.id IS NOT NULL),
              '[]'
            ) AS tables
     FROM floors f
     LEFT JOIN tables t ON t.floor_id = f.id AND t.tenant_id = f.tenant_id
     ${ACTIVE_ORDER_LATERAL}
     WHERE f.tenant_id = $1
     GROUP BY f.id
     ORDER BY f.name`,
    [tenantId]
  );
  return result.rows;
}

export async function createFloor(tenantId, data) {
  const result = await pool.query(
    `INSERT INTO floors (tenant_id, name) VALUES ($1, $2) RETURNING id, name, created_at`,
    [tenantId, data.name]
  );
  return { ...result.rows[0], tables: [] };
}

export async function updateFloor(tenantId, id, data) {
  const result = await pool.query(
    `UPDATE floors SET name = $3 WHERE id = $2 AND tenant_id = $1
     RETURNING id, name, created_at`,
    [tenantId, id, data.name]
  );
  if (result.rows.length === 0) throw new ApiError(404, "Floor not found");
  return result.rows[0];
}

export async function deleteFloor(tenantId, id) {
  const result = await pool.query(
    `DELETE FROM floors WHERE id = $1 AND tenant_id = $2 RETURNING id`,
    [id, tenantId]
  );
  if (result.rows.length === 0) throw new ApiError(404, "Floor not found");
  return { id };
}
