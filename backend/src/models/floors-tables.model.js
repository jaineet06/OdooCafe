import pool from "../config/db.js";

// ── Floors ───────────────────────────────────────────────────────────────────

export async function findFloors(tenantId) {
  const result = await pool.query(
    `SELECT 
      f.id, f.name, f.created_at,
      COALESCE(
        json_agg(
          json_build_object(
            'id', t.id,
            'table_number', t.table_number,
            'seats', t.seats,
            'shape', t.shape,
            'is_occupied', COALESCE(
              (
                SELECT is_occupied FROM tables 
                WHERE id = COALESCE(
                  (SELECT primary_table_id FROM table_merges WHERE merged_table_id = t.id AND tenant_id = $1),
                  (SELECT primary_table_id FROM table_merges WHERE primary_table_id = t.id AND tenant_id = $1 LIMIT 1)
                ) AND tenant_id = $1
              ),
              t.is_occupied
            ),
            'occupied_since', COALESCE(
              (
                SELECT occupied_since FROM tables 
                WHERE id = COALESCE(
                  (SELECT primary_table_id FROM table_merges WHERE merged_table_id = t.id AND tenant_id = $1),
                  (SELECT primary_table_id FROM table_merges WHERE primary_table_id = t.id AND tenant_id = $1 LIMIT 1)
                ) AND tenant_id = $1
              ),
              t.occupied_since
            ),
            'is_active', t.is_active,
            'created_at', t.created_at,
            'floor_id', t.floor_id,
            'floor_name', f.name,
            'merge_primary_id', (
              SELECT primary_table_id FROM table_merges
              WHERE (merged_table_id = t.id OR primary_table_id = t.id) AND tenant_id = $1
              LIMIT 1
            ),
            'combined_seats', (
              SELECT SUM(t2.seats)::int 
              FROM tables t2
              WHERE t2.tenant_id = $1 
                AND (
                  t2.id = COALESCE(
                    (SELECT primary_table_id FROM table_merges WHERE merged_table_id = t.id AND tenant_id = $1),
                    (SELECT primary_table_id FROM table_merges WHERE primary_table_id = t.id AND tenant_id = $1 LIMIT 1)
                  )
                  OR t2.id IN (
                    SELECT merged_table_id FROM table_merges 
                    WHERE primary_table_id = COALESCE(
                      (SELECT primary_table_id FROM table_merges WHERE merged_table_id = t.id AND tenant_id = $1),
                      (SELECT primary_table_id FROM table_merges WHERE primary_table_id = t.id AND tenant_id = $1 LIMIT 1)
                    ) AND tenant_id = $1
                  )
                )
            ),
            'draft_order_id', latest_draft.id,
            'order_status', CASE WHEN t.is_occupied THEN 'occupied' ELSE 'available' END
          ) ORDER BY t.table_number
        ) FILTER (WHERE t.id IS NOT NULL), '[]'
      ) as tables
     FROM floors f
     LEFT JOIN tables t ON t.floor_id = f.id AND t.tenant_id = $1
     LEFT JOIN LATERAL (
       SELECT id FROM orders
       WHERE table_id = t.id AND tenant_id = $1 AND status = 'draft'
       ORDER BY created_at DESC
       LIMIT 1
     ) latest_draft ON true
     WHERE f.tenant_id = $1
     GROUP BY f.id
     ORDER BY f.name`,
    [tenantId]
  );
  return result.rows;
}

export async function findFloorById(tenantId, id) {
  const result = await pool.query(
    `SELECT id, name FROM floors WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );
  return result.rows[0] || null;
}

export async function insertFloor(tenantId, name) {
  const result = await pool.query(
    `INSERT INTO floors (tenant_id, name) VALUES ($1, $2) RETURNING id, name, created_at`,
    [tenantId, name]
  );
  return result.rows[0];
}

export async function updateFloor(tenantId, id, name) {
  const result = await pool.query(
    `UPDATE floors SET name = $3 WHERE id = $1 AND tenant_id = $2 RETURNING id, name`,
    [id, tenantId, name]
  );
  return result.rows[0] || null;
}

export async function deleteFloor(tenantId, id) {
  const result = await pool.query(
    `DELETE FROM floors WHERE id = $1 AND tenant_id = $2 RETURNING id`,
    [id, tenantId]
  );
  return result.rows[0] || null;
}

// ── Tables ───────────────────────────────────────────────────────────────────

export async function findTables(tenantId, { floorId } = {}) {
  const conditions = ["t.tenant_id = $1"];
  const params = [tenantId];

  if (floorId) {
    conditions.push(`t.floor_id = $2`);
    params.push(floorId);
  }

  const result = await pool.query(
    `SELECT t.id, t.table_number, t.seats, t.shape,
            COALESCE(
              (
                SELECT is_occupied FROM tables 
                WHERE id = COALESCE(
                  tm.primary_table_id,
                  (SELECT primary_table_id FROM table_merges WHERE primary_table_id = t.id AND tenant_id = t.tenant_id LIMIT 1)
                ) AND tenant_id = t.tenant_id
              ),
              t.is_occupied
            ) AS is_occupied,
            COALESCE(
              (
                SELECT occupied_since FROM tables 
                WHERE id = COALESCE(
                  tm.primary_table_id,
                  (SELECT primary_table_id FROM table_merges WHERE primary_table_id = t.id AND tenant_id = t.tenant_id LIMIT 1)
                ) AND tenant_id = t.tenant_id
              ),
              t.occupied_since
            ) AS occupied_since,
            t.is_active, t.created_at,
            f.id AS floor_id, f.name AS floor_name,
            COALESCE(tm.primary_table_id, (
              SELECT primary_table_id FROM table_merges
              WHERE primary_table_id = t.id AND tenant_id = t.tenant_id
              LIMIT 1
            )) AS merge_primary_id,
            (
              SELECT SUM(t2.seats)::int 
              FROM tables t2
              WHERE t2.tenant_id = t.tenant_id 
                AND (
                  t2.id = COALESCE(
                    tm.primary_table_id,
                    (SELECT primary_table_id FROM table_merges WHERE primary_table_id = t.id AND tenant_id = t.tenant_id LIMIT 1)
                  )
                  OR t2.id IN (
                    SELECT merged_table_id FROM table_merges 
                    WHERE primary_table_id = COALESCE(
                      tm.primary_table_id,
                      (SELECT primary_table_id FROM table_merges WHERE primary_table_id = t.id AND tenant_id = t.tenant_id LIMIT 1)
                    ) AND tenant_id = t.tenant_id
                  )
                )
            ) AS combined_seats,
            -- Get the most recent draft order for this table
            draft_orders.id AS draft_order_id,
            draft_orders.status AS order_status
     FROM tables t
     JOIN floors f ON f.id = t.floor_id
     LEFT JOIN table_merges tm ON tm.merged_table_id = t.id AND tm.tenant_id = t.tenant_id
     LEFT JOIN LATERAL (
       SELECT id, status FROM orders
       WHERE table_id = t.id AND tenant_id = $1 AND status = 'draft'
       ORDER BY created_at DESC
       LIMIT 1
     ) draft_orders ON true
     WHERE ${conditions.join(" AND ")}
     ORDER BY f.name, t.table_number`,
    params
  );
  return result.rows;
}

export async function findTableById(tenantId, id) {
  const result = await pool.query(
    `SELECT t.*, f.name AS floor_name FROM tables t
     JOIN floors f ON f.id = t.floor_id
     WHERE t.id = $1 AND t.tenant_id = $2`,
    [id, tenantId]
  );
  return result.rows[0] || null;
}

export async function insertTable(tenantId, data) {
  const result = await pool.query(
    `INSERT INTO tables (tenant_id, floor_id, table_number, seats, shape)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, table_number, seats, shape, is_occupied, is_active`,
    [tenantId, data.floorId, data.tableNumber, data.seats, data.shape || "square"]
  );
  return result.rows[0];
}

export async function updateTable(tenantId, id, data) {
  const result = await pool.query(
    `UPDATE tables SET floor_id = $3, table_number = $4, seats = $5, shape = $6
     WHERE id = $1 AND tenant_id = $2
     RETURNING id, table_number, seats, shape, is_occupied, is_active`,
    [id, tenantId, data.floorId, data.tableNumber, data.seats, data.shape || "square"]
  );
  return result.rows[0] || null;
}

export async function updateTableStatus(tenantId, id, isActive) {
  const result = await pool.query(
    `UPDATE tables SET is_active = $3 WHERE id = $1 AND tenant_id = $2 RETURNING id, is_active`,
    [id, tenantId, isActive]
  );
  return result.rows[0] || null;
}

export async function updateTableOccupancy(tenantId, id, isOccupied) {
  const result = await pool.query(
    `UPDATE tables SET is_occupied = $3, occupied_since = $4
     WHERE id = $1 AND tenant_id = $2 RETURNING id, is_occupied, occupied_since`,
    [id, tenantId, isOccupied, isOccupied ? new Date() : null]
  );
  return result.rows[0] || null;
}

export async function deleteTable(tenantId, id) {
  const result = await pool.query(
    `DELETE FROM tables WHERE id = $1 AND tenant_id = $2 RETURNING id`,
    [id, tenantId]
  );
  return result.rows[0] || null;
}

// ── Table Merges ─────────────────────────────────────────────────────────────

export async function insertTableMerge(tenantId, primaryTableId, tableIds) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const tableId of tableIds) {
      await client.query(
        `INSERT INTO table_merges (tenant_id, primary_table_id, merged_table_id)
         VALUES ($1, $2, $3) ON CONFLICT (tenant_id, merged_table_id) DO UPDATE
         SET primary_table_id = $2`,
        [tenantId, primaryTableId, tableId]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteTableMerge(tenantId, tableId) {
  await pool.query(
    `DELETE FROM table_merges
     WHERE tenant_id = $1 AND (primary_table_id = $2 OR merged_table_id = $2)`,
    [tenantId, tableId]
  );
}
