import * as reportsModel from "../models/reports.model.js";

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
  const row = await reportsModel.queryDashboard(conditions, params);

  const totalOrders = parseInt(row.total_orders, 10);
  const revenue = Number(row.revenue);
  const averageOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;

  return { totalOrders, revenue, averageOrderValue: Math.round(averageOrderValue * 100) / 100 };
}

export async function getSalesTrend(tenantId, query) {
  const { conditions, params } = buildFilters(tenantId, query);
  const rows = await reportsModel.querySalesTrend(conditions, params);
  return rows.map((r) => ({
    date: r.date,
    orderCount: parseInt(r.order_count, 10),
    revenue: Number(r.revenue),
  }));
}

export async function getTopProducts(tenantId, query) {
  const { conditions, params } = buildFilters(tenantId, query);
  return reportsModel.queryTopProducts(conditions, params);
}

export async function getTopCategories(tenantId, query) {
  const { conditions, params } = buildFilters(tenantId, query);
  return reportsModel.queryTopCategories(conditions, params);
}

export async function getTopOrders(tenantId, query) {
  const { conditions, params } = buildFilters(tenantId, query);
  return reportsModel.queryTopOrders(conditions, params);
}

export async function getOrderStatusAnalytics(tenantId) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const analytics = await reportsModel.queryOrderStatusAnalytics(tenantId, todayStart.toISOString());

  const byStatus = { draft: 0, paid: 0, cancelled: 0 };
  for (const row of analytics.ordersRes) {
    byStatus[row.status] = row.count;
  }

  const kdsPipeline = { to_cook: 0, preparing: 0, completed: 0 };
  for (const row of analytics.kdsRes) {
    kdsPipeline[row.stage] = row.count;
  }

  return {
    byStatus,
    kdsPipeline,
    tablesOccupied: analytics.tablesOccupied,
    recentOrders: analytics.recentOrders,
  };
}

export async function getExportData(tenantId, query) {
  const { conditions, params } = buildFilters(tenantId, query);
  return reportsModel.queryExportData(conditions, params);
}
