import pool from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";
import { generateReceiptPDF } from "../../utils/pdfGenerator.js";
import { sendReceiptEmail } from "../../utils/emailSender.js";
import { renderReceiptEmail } from "../../utils/receiptTemplate.js";

async function loadOrderBundle(tenantId, orderId, { requirePaid = true } = {}) {
  const statusClause = requirePaid ? "AND o.status = 'paid'" : "AND o.status IN ('draft', 'paid')";
  const orderResult = await pool.query(
    `SELECT o.*, t.table_number, c.name AS customer_name, u.name AS employee_name
     FROM orders o
     LEFT JOIN tables t ON t.id = o.table_id
     LEFT JOIN customers c ON c.id = o.customer_id
     LEFT JOIN users u ON u.id = o.created_by
     WHERE o.id = $1 AND o.tenant_id = $2 ${statusClause}`,
    [orderId, tenantId]
  );
  if (orderResult.rows.length === 0) {
    if (requirePaid) {
      const exists = await pool.query(`SELECT status FROM orders WHERE id = $1 AND tenant_id = $2`, [orderId, tenantId]);
      if (exists.rows.length && exists.rows[0].status !== "paid") {
        throw new ApiError(400, "Order must be paid before generating a receipt");
      }
    }
    throw new ApiError(404, requirePaid ? "Paid order not found" : "Order not found");
  }

  const tenantResult = await pool.query(`SELECT * FROM tenants WHERE id = $1`, [tenantId]);
  const itemsResult = await pool.query(
    `SELECT oi.*, p.name AS product_name FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1 AND oi.tenant_id = $2`,
    [orderId, tenantId]
  );
  const discountsResult = await pool.query(
    `SELECT od.*, c.code AS coupon_code, p.name AS promotion_name
     FROM order_discounts od
     LEFT JOIN coupons c ON c.id = od.source_id AND od.source_type = 'coupon'
     LEFT JOIN promotions p ON p.id = od.source_id AND od.source_type = 'promotion'
     WHERE od.order_id = $1 AND od.tenant_id = $2`,
    [orderId, tenantId]
  );
  const paymentResult = await pool.query(
    `SELECT * FROM payments WHERE order_id = $1 AND tenant_id = $2 AND status = 'completed' ORDER BY created_at DESC LIMIT 1`,
    [orderId, tenantId]
  );

  return {
    order: {
      ...orderResult.rows[0],
      items: itemsResult.rows,
      discounts: discountsResult.rows,
      payment: paymentResult.rows[0] || null,
    },
    tenant: tenantResult.rows[0],
    discounts: discountsResult.rows,
    payment: paymentResult.rows[0] || null,
  };
}

export async function getReceiptData(tenantId, orderId) {
  return loadOrderBundle(tenantId, orderId, { requirePaid: true });
}

export async function getBillData(tenantId, orderId) {
  return loadOrderBundle(tenantId, orderId, { requirePaid: false });
}

export async function generatePDF(tenantId, orderId) {
  const { order, tenant } = await getReceiptData(tenantId, orderId);
  return generateReceiptPDF(order, tenant, { type: "receipt" });
}

export async function generateBillPDF(tenantId, orderId) {
  const { order, tenant } = await getBillData(tenantId, orderId);
  if (order.status !== "draft") throw new ApiError(400, "Bill is only available for draft orders");
  return generateReceiptPDF(order, tenant, { type: "bill" });
}

export async function emailReceipt(tenantId, orderId, email) {
  const { order, tenant, discounts, payment } = await getReceiptData(tenantId, orderId);
  const pdfBuffer = await generateReceiptPDF(order, tenant, { type: "receipt" });
  const { html, text } = renderReceiptEmail({ tenant, order, payment, discounts });
  await sendReceiptEmail(email, `Receipt - Order #${order.order_number}`, { html, text }, pdfBuffer);
  return { sent: true, email };
}
