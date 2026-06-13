import pool from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";
import { calculateOrderTotals } from "../../utils/taxCalculator.js";
import { getActivePromotions, evaluatePromotions } from "../promotions/promotions.service.js";
import { validateCoupon } from "../coupons/coupons.service.js";
import { broadcastToKDS } from "../../websocket/ws.helpers.js";
import { WS_EVENTS } from "../../websocket/ws.events.js";
import { broadcastTableStatusChange } from "../tables/tables.service.js";
import { assertSessionOpen, assertOrderSessionOpen } from "../sessions/sessionGuards.js";
import { getPagination, paginationMeta } from "../../utils/pagination.js";
import { logger } from "../../utils/logger.js";

async function fetchProductPrices(tenantId, productIds) {
  const result = await pool.query(
    `SELECT id, name, price, tax_rate, is_kds_visible FROM products
     WHERE tenant_id = $1 AND id = ANY($2) AND is_deleted = FALSE`,
    [tenantId, productIds]
  );
  const map = new Map(result.rows.map((p) => [p.id, p]));
  for (const id of productIds) {
    if (!map.has(id)) throw new ApiError(404, `Product ${id} not found`);
  }
  return map;
}

async function buildOrderItems(tenantId, items, productMap) {
  return items.map((item) => {
    const product = productMap.get(item.productId);
    const unitPrice = Number(product.price);
    const lineTotal = unitPrice * item.quantity;
    return {
      productId: item.productId,
      productName: product.name,
      quantity: item.quantity,
      unitPrice,
      taxRate: Number(product.tax_rate),
      lineTotal,
      isKdsVisible: product.is_kds_visible,
    };
  });
}

async function computeOrderTotals(tenantId, orderItems, couponCode) {
  const calcItems = orderItems.map((i) => ({
    unitPrice: i.unitPrice,
    quantity: i.quantity,
    taxRate: i.taxRate,
    productId: i.productId,
  }));

  const subtotal = calcItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const promotions = await getActivePromotions(tenantId);
  const { discounts, applied } = evaluatePromotions(promotions, calcItems, subtotal);

  let couponApplied = null;
  if (couponCode) {
    const { coupon, discountAmount } = await validateCoupon(tenantId, couponCode, subtotal);
    discounts.push({ type: "order", amount: discountAmount });
    couponApplied = { sourceType: "coupon", sourceId: coupon.id, discountAmount };
  }

  const totals = calculateOrderTotals(calcItems, discounts);
  const allApplied = couponApplied ? [...applied, couponApplied] : applied;

  return { totals, applied: allApplied };
}

async function saveOrderDiscounts(client, tenantId, orderId, applied) {
  await client.query(`DELETE FROM order_discounts WHERE order_id = $1 AND tenant_id = $2`, [orderId, tenantId]);
  for (const d of applied) {
    await client.query(
      `INSERT INTO order_discounts (order_id, tenant_id, source_type, source_id, discount_amount)
       VALUES ($1, $2, $3, $4, $5)`,
      [orderId, tenantId, d.sourceType, d.sourceId, d.discountAmount]
    );
  }
}

export async function previewOrder(tenantId, body) {
  const productIds = body.items.map((i) => i.productId);
  const productMap = await fetchProductPrices(tenantId, productIds);
  const orderItems = await buildOrderItems(tenantId, body.items, productMap);
  const { totals, applied } = await computeOrderTotals(tenantId, orderItems, body.couponCode || null);
  return {
    subtotal: totals.subtotal,
    taxTotal: totals.taxTotal,
    discountTotal: totals.discountTotal,
    total: totals.total,
    appliedDiscounts: applied,
  };
}

export async function listOrders(tenantId, query) {
  const { page, limit, offset } = getPagination(query);
  const conditions = ["o.tenant_id = $1"];
  const params = [tenantId];
  let idx = 2;

  if (query.status) {
    conditions.push(`o.status = $${idx++}`);
    params.push(query.status);
  }
  if (query.sessionId) {
    conditions.push(`o.session_id = $${idx++}`);
    params.push(query.sessionId);
  }
  if (query.tableId) {
    conditions.push(`o.table_id = $${idx++}`);
    params.push(query.tableId);
  }

  const where = conditions.join(" AND ");
  const countResult = await pool.query(`SELECT COUNT(*) FROM orders o WHERE ${where}`, params);
  const total = parseInt(countResult.rows[0].count, 10);

  params.push(limit, offset);
  const result = await pool.query(
    `SELECT o.*, t.table_number, c.name AS customer_name, u.name AS employee_name,
            ko.stage AS kds_stage,
            (SELECT COUNT(*)::int FROM order_items oi WHERE oi.order_id = o.id) AS item_count,
            (SELECT string_agg(sub.product_name, ', ')
             FROM (
               SELECT oi.product_name
               FROM order_items oi
               WHERE oi.order_id = o.id
               ORDER BY oi.id
               LIMIT 3
             ) sub) AS item_preview
     FROM orders o
     LEFT JOIN tables t ON t.id = o.table_id
     LEFT JOIN customers c ON c.id = o.customer_id
     LEFT JOIN users u ON u.id = o.created_by
     LEFT JOIN kds_orders ko ON ko.order_id = o.id AND ko.tenant_id = o.tenant_id
     WHERE ${where} ORDER BY o.created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
    params
  );

  return { orders: result.rows, meta: paginationMeta(total, page, limit) };
}

export async function getOrderById(tenantId, id) {
  const orderResult = await pool.query(
    `SELECT o.*, t.table_number, c.name AS customer_name, ko.stage AS kds_stage
     FROM orders o
     LEFT JOIN tables t ON t.id = o.table_id
     LEFT JOIN customers c ON c.id = o.customer_id
     LEFT JOIN kds_orders ko ON ko.order_id = o.id AND ko.tenant_id = o.tenant_id
     WHERE o.id = $1 AND o.tenant_id = $2`,
    [id, tenantId]
  );
  if (orderResult.rows.length === 0) throw new ApiError(404, "Order not found");

  const itemsResult = await pool.query(
    `SELECT oi.*, p.name AS product_name FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1 AND oi.tenant_id = $2`,
    [id, tenantId]
  );

  const discountsResult = await pool.query(
    `SELECT * FROM order_discounts WHERE order_id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );

  return { ...orderResult.rows[0], items: itemsResult.rows, discounts: discountsResult.rows };
}

export async function createOrder(tenantId, userId, data) {
  await assertSessionOpen(tenantId, data.sessionId);

  const productIds = data.items.map((i) => i.productId);
  const productMap = await fetchProductPrices(tenantId, productIds);
  const orderItems = await buildOrderItems(tenantId, data.items, productMap);
  const { totals, applied } = await computeOrderTotals(tenantId, orderItems, data.couponCode);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `INSERT INTO orders (tenant_id, session_id, table_id, customer_id, status, subtotal, tax_total, discount_total, total, created_by)
       VALUES ($1, $2, $3, $4, 'draft', $5, $6, $7, $8, $9) RETURNING *`,
      [
        tenantId,
        data.sessionId,
        data.tableId || null,
        data.customerId || null,
        totals.subtotal,
        totals.taxTotal,
        totals.discountTotal,
        totals.total,
        userId,
      ]
    );
    const order = orderResult.rows[0];

    for (const item of orderItems) {
      await client.query(
        `INSERT INTO order_items (order_id, tenant_id, product_id, quantity, unit_price, tax_rate, line_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [order.id, tenantId, item.productId, item.quantity, item.unitPrice, item.taxRate, item.lineTotal]
      );
    }

    await saveOrderDiscounts(client, tenantId, order.id, applied);
    await client.query("COMMIT");

    if (data.tableId) await broadcastTableStatusChange(tenantId, data.tableId);

    logger.info("Order created", { tenantId, orderId: order.id });
    return getOrderById(tenantId, order.id);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function updateOrder(tenantId, id, data) {
  const existing = await pool.query(
    `SELECT id, status FROM orders WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );
  if (existing.rows.length === 0) throw new ApiError(404, "Order not found");
  if (existing.rows[0].status !== "draft") throw new ApiError(400, "Only draft orders can be updated");

  await assertOrderSessionOpen(tenantId, id);

  const productIds = data.items.map((i) => i.productId);
  const productMap = await fetchProductPrices(tenantId, productIds);
  const orderItems = await buildOrderItems(tenantId, data.items, productMap);
  const { totals, applied } = await computeOrderTotals(tenantId, orderItems, data.couponCode);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(`DELETE FROM order_items WHERE order_id = $1 AND tenant_id = $2`, [id, tenantId]);

    for (const item of orderItems) {
      await client.query(
        `INSERT INTO order_items (order_id, tenant_id, product_id, quantity, unit_price, tax_rate, line_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, tenantId, item.productId, item.quantity, item.unitPrice, item.taxRate, item.lineTotal]
      );
    }

    await client.query(
      `UPDATE orders SET table_id = COALESCE($3, table_id), customer_id = COALESCE($4, customer_id),
       subtotal = $5, tax_total = $6, discount_total = $7, total = $8, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $1`,
      [
        tenantId,
        id,
        data.tableId,
        data.customerId,
        totals.subtotal,
        totals.taxTotal,
        totals.discountTotal,
        totals.total,
      ]
    );

    await saveOrderDiscounts(client, tenantId, id, applied);
    await client.query("COMMIT");
    return getOrderById(tenantId, id);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function sendToKDS(tenantId, orderId) {
  await assertOrderSessionOpen(tenantId, orderId);
  const order = await getOrderById(tenantId, orderId);
  if (order.status === "cancelled") throw new ApiError(400, "Cannot send cancelled order to KDS");

  const visibleItems = await pool.query(
    `SELECT oi.id, oi.product_id, oi.quantity, p.name, p.is_kds_visible
     FROM order_items oi JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1 AND oi.tenant_id = $2 AND p.is_kds_visible = TRUE`,
    [orderId, tenantId]
  );

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const kdsResult = await client.query(
      `INSERT INTO kds_orders (order_id, tenant_id, stage)
       VALUES ($1, $2, 'to_cook')
       ON CONFLICT (order_id) DO UPDATE SET stage = 'to_cook', updated_at = NOW()
       RETURNING *`,
      [orderId, tenantId]
    );
    const kdsOrder = kdsResult.rows[0];

    for (const item of visibleItems.rows) {
      await client.query(
        `INSERT INTO kds_order_items (kds_order_id, order_item_id, tenant_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (kds_order_id, order_item_id) DO NOTHING`,
        [kdsOrder.id, item.id, tenantId]
      );
    }

    await client.query("COMMIT");

    broadcastToKDS(tenantId, WS_EVENTS.ORDER_SENT_TO_KDS, {
      orderId,
      orderNumber: order.order_number,
      items: visibleItems.rows,
    });

    return kdsOrder;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function cancelOrder(tenantId, id) {
  await assertOrderSessionOpen(tenantId, id);
  const result = await pool.query(
    `UPDATE orders SET status = 'cancelled', updated_at = NOW()
     WHERE id = $2 AND tenant_id = $1 AND status = 'draft' RETURNING *`,
    [tenantId, id]
  );
  if (result.rows.length === 0) throw new ApiError(400, "Order not found or cannot be cancelled");
  const order = result.rows[0];
  if (order.table_id) await broadcastTableStatusChange(tenantId, order.table_id);
  return order;
}
