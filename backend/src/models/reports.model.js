import pool from "../config/db.js";

export async function queryDashboard(conditions, params) {
  const result = await pool.query(
    `SELECT COUNT(*) AS total_orders, COALESCE(SUM(o.total), 0) AS revenue
     FROM orders o WHERE ${conditions}`,
    params
  );
  return result.rows[0];
}

export async function querySalesTrend(conditions, params) {
  const result = await pool.query(
    `SELECT DATE(o.created_at) AS date, COUNT(*) AS order_count, COALESCE(SUM(o.total), 0) AS revenue
     FROM orders o WHERE ${conditions}
     GROUP BY DATE(o.created_at) ORDER BY date`,
    params
  );
  return result.rows;
}

export async function queryTopProducts(conditions, params) {
  const result = await pool.query(
    `SELECT p.id, p.name, SUM(oi.quantity) AS total_qty, SUM(oi.line_total) AS revenue
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN products p ON p.id = oi.product_id
     WHERE ${conditions}
     GROUP BY p.id, p.name ORDER BY revenue DESC LIMIT 10`,
    params
  );
  return result.rows;
}

export async function queryTopCategories(conditions, params) {
  const result = await pool.query(
    `SELECT c.id, c.name, c.color, SUM(oi.line_total) AS revenue
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN products p ON p.id = oi.product_id
     LEFT JOIN product_categories c ON c.id = p.category_id
     WHERE ${conditions}
     GROUP BY c.id, c.name, c.color ORDER BY revenue DESC LIMIT 10`,
    params
  );
  return result.rows;
}

export async function queryTopOrders(conditions, params) {
  const result = await pool.query(
    `SELECT o.id, o.order_number, o.total, o.created_at, u.name AS created_by_name
     FROM orders o JOIN users u ON u.id = o.created_by
     WHERE ${conditions} ORDER BY o.total DESC LIMIT 10`,
    params
  );
  return result.rows;
}

export async function queryOrderStatusAnalytics(tenantId, todayStartIso) {
  const [ordersRes, kdsRes, tablesRes, recentRes] = await Promise.all([
    pool.query(
      `SELECT status, COUNT(*)::int AS count
       FROM orders WHERE tenant_id = $1 AND created_at >= $2
       GROUP BY status`,
      [tenantId, todayStartIso]
    ),
    pool.query(
      `SELECT ko.stage, COUNT(*)::int AS count
       FROM kds_orders ko
       JOIN orders o ON o.id = ko.order_id AND o.tenant_id = ko.tenant_id
       WHERE ko.tenant_id = $1 AND o.status = 'draft' AND ko.stage != 'completed'
       GROUP BY ko.stage`,
      [tenantId]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS occupied
       FROM tables t
       WHERE t.tenant_id = $1 AND t.is_active = TRUE
         AND EXISTS (
           SELECT 1 FROM orders o
           INNER JOIN sessions s ON s.id = o.session_id
             AND s.tenant_id = o.tenant_id
             AND s.status = 'open'
           WHERE o.table_id = t.id
             AND o.tenant_id = t.tenant_id
             AND o.status NOT IN ('paid', 'cancelled')
         )`,
      [tenantId]
    ),
    pool.query(
      `SELECT o.id, o.order_number, o.status, o.total, o.created_at,
              t.table_number, ko.stage AS kds_stage
       FROM orders o
       LEFT JOIN tables t ON t.id = o.table_id
       LEFT JOIN kds_orders ko ON ko.order_id = o.id
       WHERE o.tenant_id = $1 AND o.created_at >= $2 AND o.status != 'cancelled'
       ORDER BY o.created_at DESC LIMIT 12`,
      [tenantId, todayStartIso]
    ),
  ]);

  return {
    ordersRes: ordersRes.rows,
    kdsRes: kdsRes.rows,
    tablesOccupied: tablesRes.rows[0]?.occupied || 0,
    recentOrders: recentRes.rows
  };
}

export async function queryExportData(conditions, params) {
  const result = await pool.query(
    `SELECT o.order_number, o.total, o.subtotal, o.tax_total, o.discount_total, o.created_at, u.name AS employee
     FROM orders o JOIN users u ON u.id = o.created_by
     WHERE ${conditions} ORDER BY o.created_at DESC`,
    params
  );
  return result.rows;
}
