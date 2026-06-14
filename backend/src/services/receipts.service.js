import PDFDocument from "pdfkit";
import { findOrderForReceipt } from "../models/receipts.model.js";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const fmt = (n) => `Rs.${Number(n ?? 0).toFixed(2)}`;
const fmtDate = (d) => {
  const dt = new Date(d);
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
    " " + dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
};

function buildPdf(order, isBill = false) {
  return new Promise((resolve, reject) => {
    const buffers = [];
    const doc = new PDFDocument({ size: [226, 800], margin: 12, autoFirstPage: false });

    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    doc.addPage();

    const W = doc.page.width - 24; // usable width
    const CX = doc.page.width / 2;

    // ── Header ─────────────────────────────────────────────────────
    doc.fontSize(11).font("Helvetica-Bold").text(order.tenant_name || "Odoo Cafe", { align: "center" });

    doc.moveDown(0.3);
    const docTypeLabel = isBill ? "BILL / ESTIMATE" : "TAX INVOICE";
    doc.fontSize(7).font("Helvetica-Bold").text(docTypeLabel, { align: "center" });
    doc.moveDown(0.2);
    doc.fontSize(8).font("Helvetica-Bold").text(`ORDER #${order.order_number}`, { align: "center" });
    if (isBill) {
      doc.fontSize(6.5).font("Helvetica").text("PAYMENT PENDING - NOT AN INVOICE", { align: "center" });
    }

    // ── Divider ────────────────────────────────────────────────────
    const divider = () => {
      doc.moveDown(0.3);
      doc.moveTo(12, doc.y).lineTo(doc.page.width - 12, doc.y).dash(2, { space: 2 }).stroke().undash();
      doc.moveDown(0.3);
    };

    divider();

    // ── Meta ───────────────────────────────────────────────────────
    const meta = (label, value) => {
      const y = doc.y;
      doc.fontSize(7).font("Helvetica").text(label, 12, y, { width: W / 2 });
      doc.fontSize(7).font("Helvetica").text(value, 12 + W / 2, y, { width: W / 2, align: "right" });
      doc.moveDown(0.15);
    };

    meta("DATE/TIME:", fmtDate(order.created_at).toUpperCase());
    if (order.table_number) meta("TABLE:", `#${order.table_number}`);
    if (order.created_by_name) meta("SERVER:", order.created_by_name.toUpperCase());

    // ── Customer ───────────────────────────────────────────────────
    if (order.customer_name) {
      divider();
      doc.fontSize(6.5).font("Helvetica-Bold").text("CUSTOMER INFO", { align: "left" });
      doc.moveDown(0.15);
      meta("NAME:", order.customer_name.toUpperCase());
      if (order.customer_phone) meta("PHONE:", order.customer_phone);
      if (order.customer_email) meta("EMAIL:", order.customer_email.toUpperCase());
    }

    divider();

    // ── Items Table ────────────────────────────────────────────────
    const COL = { item: 12, qty: 12 + W * 0.5, price: 12 + W * 0.68, total: 12 + W * 0.82 };

    doc.fontSize(7).font("Helvetica-Bold");
    doc.text("ITEM", COL.item, doc.y, { width: W * 0.48 });
    const headerY = doc.y - doc.currentLineHeight();
    doc.text("QTY", COL.qty, headerY, { width: W * 0.16, align: "center" });
    doc.text("PRICE", COL.price, headerY, { width: W * 0.14, align: "right" });
    doc.text("TOTAL", COL.total, headerY, { width: W * 0.18, align: "right" });
    doc.moveDown(0.3);

    doc.moveTo(12, doc.y).lineTo(doc.page.width - 12, doc.y).stroke();
    doc.moveDown(0.2);

    for (const item of order.items || []) {
      doc.fontSize(7).font("Helvetica-Bold");
      const rowY = doc.y;
      doc.text(item.product_name.toUpperCase(), COL.item, rowY, { width: W * 0.48 });
      const nextY = doc.y;
      doc.fontSize(7).font("Helvetica");
      doc.text(String(item.quantity), COL.qty, rowY, { width: W * 0.16, align: "center" });
      doc.text(fmt(item.unit_price), COL.price, rowY, { width: W * 0.14, align: "right" });
      doc.text(fmt(item.line_total), COL.total, rowY, { width: W * 0.18, align: "right" });
      if (item.note) {
        doc.fontSize(6).font("Helvetica-Oblique").text(`* ${item.note.toUpperCase()}`, COL.item, nextY, { width: W * 0.48 });
      }
      doc.moveDown(0.15);
    }

    divider();

    // ── Discounts ──────────────────────────────────────────────────
    if (order.discounts?.length > 0) {
      doc.fontSize(6.5).font("Helvetica-Bold").text("DISCOUNTS APPLIED:");
      doc.moveDown(0.1);
      for (const d of order.discounts) {
        const label = (d.coupon_code || d.promotion_name || d.source_type || "DISCOUNT").toUpperCase();
        meta(label, `-${fmt(d.discount_amount)}`);
      }
      divider();
    }

    // ── Totals ─────────────────────────────────────────────────────
    meta("SUBTOTAL", fmt(order.subtotal));
    meta("TAX (GST)", fmt(order.tax_total));
    if (Number(order.discount_total) > 0) meta("DISCOUNT", `-${fmt(order.discount_total)}`);
    if (Number(order.tip_amount) > 0) meta("TIP", fmt(order.tip_amount));

    doc.moveDown(0.2);
    doc.moveTo(12, doc.y).lineTo(doc.page.width - 12, doc.y).lineWidth(1.5).stroke().lineWidth(1);
    doc.moveDown(0.2);

    const grandY = doc.y;
    doc.fontSize(9).font("Helvetica-Bold").text("GRAND TOTAL", 12, grandY, { width: W / 2 });
    doc.fontSize(9).font("Helvetica-Bold").text(fmt(order.total), 12 + W / 2, grandY, { width: W / 2, align: "right" });
    doc.moveDown(0.3);

    // ── Payment ────────────────────────────────────────────────────
    if (order.payment && !isBill) {
      divider();
      doc.fontSize(7).font("Helvetica-Bold").text(`PAID VIA ${String(order.payment.method_type).toUpperCase()}`, { align: "center" });
      if (order.payment.amount_tendered != null) {
        doc.fontSize(7).font("Helvetica")
          .text(`TENDERED: ${fmt(order.payment.amount_tendered)}`, { align: "center" })
          .text(`CHANGE: ${fmt(order.payment.change_due || 0)}`, { align: "center" });
      }
      if (order.payment.upi_ref) {
        doc.fontSize(7).font("Helvetica-Bold").text(`UPI REF: ${order.payment.upi_ref}`, { align: "center" });
      }
    }

    divider();

    // ── Footer ─────────────────────────────────────────────────────
    doc.fontSize(7).font("Helvetica-Bold")
      .text(isBill ? "PLEASE SETTLE AT COUNTER" : "THANK YOU FOR DINING WITH US!", { align: "center" });
    doc.fontSize(6).font("Helvetica").text("POWERED BY ODOOCAFE", { align: "center" });

    doc.end();
  });
}

// ── Service functions ─────────────────────────────────────────────────────────

export async function generateReceiptPdf(tenantId, orderId) {
  const order = await findOrderForReceipt(tenantId, orderId);
  if (!order) throw new ApiError(404, "Order not found");
  logger.info("Generating receipt PDF", { tenantId, orderId });
  return buildPdf(order, false);
}

export async function generateBillPdf(tenantId, orderId) {
  const order = await findOrderForReceipt(tenantId, orderId);
  if (!order) throw new ApiError(404, "Order not found");
  logger.info("Generating bill PDF", { tenantId, orderId });
  return buildPdf(order, true);
}

export async function emailReceipt(tenantId, orderId, toEmail) {
  const order = await findOrderForReceipt(tenantId, orderId);
  if (!order) throw new ApiError(404, "Order not found");
  if (order.status !== "paid") throw new ApiError(400, "Can only email receipts for paid orders");

  const pdfBuffer = await buildPdf(order, false);

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT),
    secure: false,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: toEmail,
    subject: `Your receipt from ${order.tenant_name || "Odoo Cafe"} — Order #${order.order_number}`,
    text: `Thank you for dining with us! Please find your receipt attached.`,
    attachments: [{ filename: `receipt-${order.order_number}.pdf`, content: pdfBuffer, contentType: "application/pdf" }],
  });

  logger.info("Receipt emailed", { tenantId, orderId, toEmail });
  return { sent: true };
}
