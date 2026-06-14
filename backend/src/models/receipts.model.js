import pool from "../config/db.js";

export async function findOrderForReceipt(tenantId, orderId) {
  // Order base
  const orderRes = await pool.query(
    `SELECT o.*, t.table_number, u.name AS created_by_name,
            c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email,
            ten.name AS tenant_name, ten.logo_url AS tenant_logo
     FROM orders o
     LEFT JOIN tables t ON t.id = o.table_id
     LEFT JOIN users u ON u.id = o.created_by
     LEFT JOIN customers c ON c.id = o.customer_id
     LEFT JOIN tenants ten ON ten.id = o.tenant_id
     WHERE o.id = $1 AND o.tenant_id = $2`,
    [orderId, tenantId]
  );
  if (!orderRes.rows[0]) return null;
  const order = orderRes.rows[0];

  // Items
  const itemsRes = await pool.query(
    `SELECT oi.*, p.name AS product_name
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1`,
    [orderId]
  );

  // Discounts
  const discountsRes = await pool.query(
    `SELECT od.*, c.code AS coupon_code, pr.name AS promotion_name
     FROM order_discounts od
     LEFT JOIN coupons c ON c.id = od.source_id AND od.source_type = 'coupon'
     LEFT JOIN promotions pr ON pr.id = od.source_id AND od.source_type = 'promotion'
     WHERE od.order_id = $1`,
    [orderId]
  );

  // Latest payment
  const paymentRes = await pool.query(
    `SELECT * FROM payments WHERE order_id = $1 AND status = 'completed' ORDER BY created_at DESC LIMIT 1`,
    [orderId]
  );

  return {
    ...order,
    items: itemsRes.rows,
    discounts: discountsRes.rows,
    payment: paymentRes.rows[0] || null,
  };
}
