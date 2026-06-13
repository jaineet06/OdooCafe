import { pool } from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";
import { generateReceiptPDF } from "../../utils/pdfGenerator.js";
import { sendReceiptEmail } from "../../utils/emailSender.js";

export async function getReceiptData(tenantId, orderId) {
  const orderResult = await pool.query(
    `SELECT o.* FROM orders o WHERE o.id = $1 AND o.tenant_id = $2 AND o.status = 'paid'`,
    [orderId, tenantId]
  );
  if (orderResult.rows.length === 0) throw new ApiError(404, "Paid order not found");

  const tenantResult = await pool.query(`SELECT * FROM tenants WHERE id = $1`, [tenantId]);
  const itemsResult = await pool.query(
    `SELECT oi.*, p.name AS product_name FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1 AND oi.tenant_id = $2`,
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
      payment: paymentResult.rows[0] || null,
    },
    tenant: tenantResult.rows[0],
  };
}

export async function generatePDF(tenantId, orderId) {
  const { order, tenant } = await getReceiptData(tenantId, orderId);
  return generateReceiptPDF(order, tenant);
}

export async function emailReceipt(tenantId, orderId, email) {
  const { order, tenant } = await getReceiptData(tenantId, orderId);
  const pdfBuffer = await generateReceiptPDF(order, tenant);
  const html = `<p>Thank you for dining at <strong>${tenant.name}</strong>!</p><p>Please find your receipt attached.</p>`;
  await sendReceiptEmail(email, `Receipt - Order #${order.order_number}`, html, pdfBuffer);
  return { sent: true, email };
}
