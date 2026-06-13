import { pool } from "../../config/db.js";

function getDateRange(period, startDate, endDate) {
  const now = new Date();
  let start;
  let end = new Date(now);
  end.setHours(23, 59, 59, 999);

  switch (period) {
    case "week": {
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case "month": {
      start = new Date(now);
      start.setMonth(start.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case "custom": {
      start = startDate ? new Date(startDate) : new Date(now.setHours(0, 0, 0, 0));
      end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999);
      break;
    }
    default: {
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
    }
  }

  return { start, end };
}

function buildFilters(tenantId, query) {
  const { period = "today", startDate, endDate, employeeId, sessionId, productId } = query;
  const { start, end } = getDateRange(period, startDate, endDate);

  const conditions = [
    "o.tenant_id = $1",
    "o.status = 'paid'",
    "o.created_at >= $2",
    "o.created_at <= $3",
  ];
  const params = [tenantId, start.toISOString(), end.toISOString()];
  let idx = 4;

  if (employeeId) {
    conditions.push(`o.created_by = $${idx++}`);
    params.push(employeeId);
  }
  if (sessionId) {
    conditions.push(`o.session_id = $${idx++}`);
    params.push(sessionId);
  }
  if (productId) {
    conditions.push(`EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = $${idx})`);
    params.push(productId);
    idx++;
  }

  return { conditions: conditions.join(" AND "), params };
}

export async function getDashboard(tenantId, query) {
  const { conditions, params } = buildFilters(tenantId, query);
  const result = await pool.query(
    `SELECT COUNT(*) AS total_orders, COALESCE(SUM(o.total), 0) AS revenue
     FROM orders o WHERE ${conditions}`,
    params
  );

  const totalOrders = parseInt(result.rows[0].total_orders, 10);
  const revenue = Number(result.rows[0].revenue);
  const averageOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;

  return { totalOrders, revenue, averageOrderValue: Math.round(averageOrderValue * 100) / 100 };
}

export async function getSalesTrend(tenantId, query) {
  const { conditions, params } = buildFilters(tenantId, query);
  const result = await pool.query(
    `SELECT DATE(o.created_at) AS date, COUNT(*) AS order_count, COALESCE(SUM(o.total), 0) AS revenue
     FROM orders o WHERE ${conditions}
     GROUP BY DATE(o.created_at) ORDER BY date`,
    params
  );
  return result.rows.map((r) => ({
    date: r.date,
    orderCount: parseInt(r.order_count, 10),
    revenue: Number(r.revenue),
  }));
}

export async function getTopProducts(tenantId, query) {
  const { conditions, params } = buildFilters(tenantId, query);
  const result = await pool.query(
    `SELECT p.id, p.name, SUM(oi.quantity) AS total_qty, SUM(oi.line_total) AS revenue
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN products p ON p.id = oi.product_id
     WHERE ${conditions.replace(/o\./g, "o.")}
     GROUP BY p.id, p.name ORDER BY revenue DESC LIMIT 10`,
    params
  );
  return result.rows;
}

export async function getTopCategories(tenantId, query) {
  const { conditions, params } = buildFilters(tenantId, query);
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

export async function getTopOrders(tenantId, query) {
  const { conditions, params } = buildFilters(tenantId, query);
  const result = await pool.query(
    `SELECT o.id, o.order_number, o.total, o.created_at, u.name AS created_by_name
     FROM orders o JOIN users u ON u.id = o.created_by
     WHERE ${conditions} ORDER BY o.total DESC LIMIT 10`,
    params
  );
  return result.rows;
}

export async function getExportData(tenantId, query) {
  const { conditions, params } = buildFilters(tenantId, query);
  const result = await pool.query(
    `SELECT o.order_number, o.total, o.subtotal, o.tax_total, o.discount_total, o.created_at, u.name AS employee
     FROM orders o JOIN users u ON u.id = o.created_by
     WHERE ${conditions} ORDER BY o.created_at DESC`,
    params
  );
  return result.rows;
}
