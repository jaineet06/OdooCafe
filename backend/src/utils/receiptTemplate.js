import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatePath = path.join(__dirname, "../templates/receipt.html");

function formatMoney(amount) {
  return `₹${Number(amount).toFixed(2)}`;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderItemRows(items) {
  return items
    .map(
      (item) => `
    <tr style="border-bottom:1px solid #ebe4d8;">
      <td style="padding:10px 0;font-size:14px;">${escapeHtml(item.product_name || item.name)}</td>
      <td align="center" style="padding:10px 0;font-size:14px;">${item.quantity}</td>
      <td align="right" style="padding:10px 0;font-size:14px;">${formatMoney(item.unit_price)}</td>
      <td align="right" style="padding:10px 0;font-size:14px;">${formatMoney(item.line_total)}</td>
    </tr>`
    )
    .join("");
}

function renderDiscountsSection(discounts) {
  if (!discounts?.length) return "";

  const rows = discounts
    .map(
      (d) => `
    <tr>
      <td style="padding:2px 0;font-size:13px;color:#6b7f6b;">${escapeHtml(d.source_type)} discount</td>
      <td align="right" style="padding:2px 0;font-size:13px;color:#6b7f6b;">-${formatMoney(d.discount_amount)}</td>
    </tr>`
    )
    .join("");

  return `
          <tr>
            <td style="padding:0 32px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr><td colspan="2" style="padding-bottom:4px;font-size:12px;text-transform:uppercase;color:#4a4a4a;">Discounts applied</td></tr>
                ${rows}
              </table>
            </td>
          </tr>`;
}

function renderPlainText({ tenant, order, payment }) {
  const lines = [
    tenant.name,
    `Order #${order.order_number}`,
    new Date(order.created_at).toLocaleString(),
    "",
    "--- Items ---",
    ...order.items.map(
      (i) =>
        `${i.product_name} x${i.quantity}  ${formatMoney(i.unit_price)}  ${formatMoney(i.line_total)}`
    ),
    "",
    `Subtotal: ${formatMoney(order.subtotal)}`,
    `Discount: -${formatMoney(order.discount_total)}`,
    `Tax: ${formatMoney(order.tax_total)}`,
    `Total: ${formatMoney(order.total)}`,
    "",
    `Payment: ${payment?.method_type?.toUpperCase() || "N/A"}`,
    "",
    "Thank you for dining with us!",
  ];
  return lines.join("\n");
}

export function renderReceiptEmail({ tenant, order, payment, discounts = [] }) {
  let html = fs.readFileSync(templatePath, "utf8");

  const logoBlock = tenant.logo_url
    ? `<img src="${escapeHtml(tenant.logo_url)}" alt="${escapeHtml(tenant.name)}" width="80" style="display:block;margin:0 auto 12px;border-radius:4px;" />`
    : "";

  html = html
    .replace(/\{\{tenantName\}\}/g, escapeHtml(tenant.name))
    .replace(/\{\{#if logoUrl\}\}[\s\S]*?\{\{\/if\}\}/g, logoBlock)
    .replace(/\{\{orderNumber\}\}/g, order.order_number)
    .replace(
      /\{\{orderDate\}\}/g,
      new Date(order.created_at).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    )
    .replace(/\{\{itemsRows\}\}/g, renderItemRows(order.items))
    .replace(/\{\{discountsSection\}\}/g, renderDiscountsSection(discounts))
    .replace(/\{\{subtotal\}\}/g, formatMoney(order.subtotal))
    .replace(/\{\{discountTotal\}\}/g, formatMoney(order.discount_total))
    .replace(/\{\{taxTotal\}\}/g, formatMoney(order.tax_total))
    .replace(/\{\{total\}\}/g, formatMoney(order.total))
    .replace(/\{\{paymentMethod\}\}/g, escapeHtml(payment?.method_type?.toUpperCase() || "N/A"));

  const text = renderPlainText({ tenant, order, payment });

  return { html, text };
}
