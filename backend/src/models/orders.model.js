import pool from "../config/db.js";

// ── Orders ───────────────────────────────────────────────────────────────────

export async function findOrders(tenantId, { sessionId, tableId, status, page = 1, limit = 50 } = {}) {
  const conditions = ["o.tenant_id = $1"];
  const params = [tenantId];
  let idx = 2;

  if (sessionId) { conditions.push(`o.session_id = $${idx++}`); params.push(sessionId); }
  if (tableId)   { conditions.push(`o.table_id = $${idx++}`);   params.push(tableId); }
  if (status)    { conditions.push(`o.status = $${idx++}`);     params.push(status); }

  const offset = (page - 1) * limit;
  const countRes = await pool.query(
    `SELECT COUNT(*) FROM orders o WHERE ${conditions.join(" AND ")}`, params
  );

  const result = await pool.query(
    `SELECT o.id, o.order_number, o.status, o.subtotal, o.tax_total,
            o.discount_total, o.tip_amount, o.total, o.note, o.created_at,
            t.table_number, u.name AS created_by_name
     FROM orders o
     LEFT JOIN tables t ON t.id = o.table_id
     LEFT JOIN users u ON u.id = o.created_by
     WHERE ${conditions.join(" AND ")}
     ORDER BY o.created_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, limit, offset]
  );
  return { data: result.rows, meta: { total: parseInt(countRes.rows[0].count), page, limit } };
}

export async function findOrderById(tenantId, id) {
  const orderRes = await pool.query(
    `SELECT o.*, t.table_number, u.name AS created_by_name
     FROM orders o
     LEFT JOIN tables t ON t.id = o.table_id
     LEFT JOIN users u ON u.id = o.created_by
     WHERE o.id = $1 AND o.tenant_id = $2`,
    [id, tenantId]
  );
  if (!orderRes.rows[0]) return null;

  const itemsRes = await pool.query(
    `SELECT oi.id, oi.quantity, oi.unit_price, oi.tax_rate, oi.line_total, oi.note,
            p.id AS product_id, p.name AS product_name, p.image_url AS product_image
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1`,
    [id]
  );

  const discountsRes = await pool.query(
    `SELECT id, source_type, source_id, discount_amount FROM order_discounts WHERE order_id = $1`,
    [id]
  );

  const paymentsRes = await pool.query(
    `SELECT id, method_type, amount, status FROM payments WHERE order_id = $1`,
    [id]
  );

  return {
    ...orderRes.rows[0],
    items: itemsRes.rows,
    discounts: discountsRes.rows,
    payments: paymentsRes.rows,
  };
}

export async function insertOrder(tenantId, sessionId, createdBy, data, totals) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const orderRes = await client.query(
      `INSERT INTO orders
         (tenant_id, session_id, table_id, customer_id, status,
          subtotal, tax_total, discount_total, tip_amount, total, note, created_by)
       VALUES ($1,$2,$3,$4,'draft',$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        tenantId, sessionId,
        data.tableId || null, data.customerId || null,
        totals.subtotal, totals.taxTotal, totals.discountTotal,
        data.tipAmount ?? 0, totals.total,
        data.note || null, createdBy,
      ]
    );
    const order = orderRes.rows[0];

    for (const item of data.items) {
      await client.query(
        `INSERT INTO order_items (order_id, tenant_id, product_id, quantity, unit_price, tax_rate, line_total, note)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [order.id, tenantId, item.productId, item.quantity, item.unitPrice, item.taxRate ?? 0, item.lineTotal, item.note || null]
      );
    }

    if (data.discounts?.length) {
      for (const d of data.discounts) {
        await client.query(
          `INSERT INTO order_discounts (order_id, tenant_id, source_type, source_id, discount_amount)
           VALUES ($1,$2,$3,$4,$5)`,
          [order.id, tenantId, d.sourceType, d.sourceId, d.discountAmount]
        );
      }
    }

    await client.query("COMMIT");
    return order;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function updateOrderStatus(tenantId, id, status) {
  const result = await pool.query(
    `UPDATE orders SET status = $3, updated_at = NOW()
     WHERE id = $1 AND tenant_id = $2 RETURNING id, status`,
    [id, tenantId, status]
  );
  return result.rows[0] || null;
}

// ── KDS Orders ───────────────────────────────────────────────────────────────

export async function findKdsOrders(tenantId, { stage, search } = {}) {
  const conditions = ["ko.tenant_id = $1"];
  const params = [tenantId];
  let idx = 2;

  if (stage) { conditions.push(`ko.stage = $${idx++}`); params.push(stage); }

  const result = await pool.query(
    `SELECT ko.id AS kds_order_id, ko.stage, ko.sent_at, ko.updated_at,
            o.id AS order_id, o.order_number, o.note AS order_note,
            t.table_number,
            json_agg(json_build_object(
              'id', ki.id,
              'kdsItemId', ki.id,
              'orderItemId', ki.order_item_id,
              'isCompleted', ki.is_completed,
              'completedAt', ki.completed_at,
              'quantity', oi.quantity,
              'note', oi.note,
              'productName', p.name
            ) ORDER BY p.name) AS items
     FROM kds_orders ko
     JOIN orders o ON o.id = ko.order_id
     LEFT JOIN tables t ON t.id = o.table_id
     JOIN kds_order_items ki ON ki.kds_order_id = ko.id
     JOIN order_items oi ON oi.id = ki.order_item_id
     JOIN products p ON p.id = oi.product_id
     WHERE ${conditions.join(" AND ")}
     GROUP BY ko.id, o.id, t.table_number
     ORDER BY ko.sent_at ASC`,
    params
  );
  return result.rows;
}

export async function insertKdsOrder(orderId, tenantId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const kdsRes = await client.query(
      `INSERT INTO kds_orders (order_id, tenant_id)
       VALUES ($1, $2) ON CONFLICT (order_id) DO UPDATE SET stage = 'to_cook', updated_at = NOW()
       RETURNING id`,
      [orderId, tenantId]
    );
    const kdsOrderId = kdsRes.rows[0].id;

    const items = await client.query(
      `SELECT id FROM order_items WHERE order_id = $1`, [orderId]
    );

    for (const item of items.rows) {
      await client.query(
        `INSERT INTO kds_order_items (kds_order_id, order_item_id, tenant_id)
         VALUES ($1, $2, $3) ON CONFLICT (kds_order_id, order_item_id) DO NOTHING`,
        [kdsOrderId, item.id, tenantId]
      );
    }

    await client.query("COMMIT");
    return kdsOrderId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function updateKdsStage(tenantId, kdsOrderId, stage) {
  const result = await pool.query(
    `UPDATE kds_orders SET stage = $3, updated_at = NOW()
     WHERE id = $1 AND tenant_id = $2 RETURNING id, order_id, stage`,
    [kdsOrderId, tenantId, stage]
  );
  return result.rows[0] || null;
}

export async function updateKdsItem(tenantId, kdsOrderId, itemId) {
  const result = await pool.query(
    `UPDATE kds_order_items SET is_completed = TRUE, completed_at = NOW()
     WHERE kds_order_id = $1 AND id = $2 AND tenant_id = $3 RETURNING id, order_item_id, is_completed`,
    [kdsOrderId, itemId, tenantId]
  );
  return result.rows[0] || null;
}

// ── Payment Methods ───────────────────────────────────────────────────────────

export async function findPaymentMethods(tenantId) {
  const result = await pool.query(
    `SELECT id, method_type, is_enabled, upi_id FROM payment_methods
     WHERE tenant_id = $1 ORDER BY method_type`,
    [tenantId]
  );
  return result.rows;
}

export async function findPaymentMethodById(tenantId, id) {
  const result = await pool.query(
    `SELECT id, method_type, is_enabled, upi_id FROM payment_methods
     WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );
  return result.rows[0] || null;
}

export async function togglePaymentMethod(tenantId, id) {
  const result = await pool.query(
    `UPDATE payment_methods SET is_enabled = NOT is_enabled
     WHERE id = $1 AND tenant_id = $2 RETURNING id, is_enabled`,
    [id, tenantId]
  );
  return result.rows[0] || null;
}

export async function updateUpiId(tenantId, id, upiId) {
  const result = await pool.query(
    `UPDATE payment_methods SET upi_id = $3
     WHERE id = $1 AND tenant_id = $2 RETURNING id, upi_id`,
    [id, tenantId, upiId]
  );
  return result.rows[0] || null;
}

export async function upsertDefaultPaymentMethods(tenantId) {
  for (const type of ["cash", "card", "upi"]) {
    await pool.query(
      `INSERT INTO payment_methods (tenant_id, method_type)
       VALUES ($1, $2) ON CONFLICT (tenant_id, method_type) DO NOTHING`,
      [tenantId, type]
    );
  }
}

// ── Payments ──────────────────────────────────────────────────────────────────

export async function insertPayment(tenantId, data) {
  const result = await pool.query(
    `INSERT INTO payments
       (order_id, tenant_id, method_type, amount, amount_tendered,
        change_due, stripe_payment_intent_id, upi_ref, card_ref, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      data.orderId, tenantId, data.methodType, data.amount,
      data.amountTendered ?? null, data.changeDue ?? null,
      data.stripePaymentIntentId ?? null,
      data.upiRef ?? null, data.cardRef ?? null,
      data.status || "pending",
    ]
  );
  return result.rows[0];
}

export async function updatePaymentStatus(id, status) {
  const result = await pool.query(
    `UPDATE payments SET status = $2 WHERE id = $1 RETURNING id, status`,
    [id, status]
  );
  return result.rows[0] || null;
}

export async function updatePaymentStatusByIntentId(intentId, status) {
  const result = await pool.query(
    `UPDATE payments SET status = $2 WHERE stripe_payment_intent_id = $1 RETURNING id, order_id, tenant_id, status`,
    [intentId, status]
  );
  return result.rows[0] || null;
}

