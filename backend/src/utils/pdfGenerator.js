import PDFDocument from "pdfkit";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fontRegularPath = path.resolve(__dirname, "../assets/fonts/RobotoMono-Regular.ttf");
const fontBoldPath = path.resolve(__dirname, "../assets/fonts/RobotoMono-Bold.ttf");

function formatDateTime(date) {
  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).replace(/,/, "").toUpperCase();
}

export function generateReceiptPDF(order, tenant, { type = "receipt" } = {}) {
  const isBill = type === "bill";
  const title = isBill ? "BILL" : "RECEIPT";

  return new Promise((resolve, reject) => {
    // 1. Determine font availability
    let useRoboto = true;
    if (!fs.existsSync(fontRegularPath) || !fs.existsSync(fontBoldPath)) {
      useRoboto = false;
    }

    const regularFont = useRoboto ? "RobotoMono" : "Courier";
    const boldFont = useRoboto ? "RobotoMono-Bold" : "Courier-Bold";

    const formatCurrency = (amount) => {
      const val = Number(amount).toFixed(2);
      return useRoboto ? `\u20B9${val}` : `Rs.${val}`;
    };

    // 2. Setup document dimensions (80mm width = 226.77 pt)
    const width = 226.77;
    const margin = 12;
    const contentWidth = width - margin * 2; // 202.77

    // 3. Dynamic height calculation
    let height = margin * 2;
    
    // Header
    height += 20; // Tenant name
    if (tenant.address) {
      const addrLines = Math.max(1, Math.ceil((tenant.address || "").length / 24));
      height += addrLines * 10 + 4;
    }
    height += 6; // spacing
    height += 22; // TAX INVOICE box
    height += 15; // ORDER #num
    if (isBill) {
      height += 20; // PAYMENT PENDING warning
    }
    height += 10; // dashed line spacing

    // Meta Info
    height += 11; // DATE/TIME
    if (order.table_number) height += 11;
    if (order.employee_name) height += 11;
    height += 10; // dashed line spacing

    // Customer Block
    if (order.customer_name) {
      let boxHeight = 12; // padding
      boxHeight += 10; // "CUSTOMER INFO" header
      const nameLines = Math.max(1, Math.ceil(order.customer_name.length / 18));
      boxHeight += nameLines * 11;
      if (order.customer_phone) boxHeight += 11;
      if (order.customer_email) {
        const emailLines = Math.max(1, Math.ceil(order.customer_email.length / 18));
        boxHeight += emailLines * 11;
      }
      height += boxHeight + 12; // Box height + bottom space
    }

    // Items table header
    height += 12; // header row
    height += 6; // solid line spacing

    // Items list
    for (const item of order.items || []) {
      const name = item.product_name || item.name || "";
      const nameLines = Math.max(1, Math.ceil(name.length / 16));
      let rowHeight = nameLines * 10;
      if (item.note) {
        const noteLines = Math.max(1, Math.ceil(item.note.length / 16));
        rowHeight += noteLines * 9;
      }
      rowHeight = Math.max(rowHeight, 11);
      height += rowHeight + 6; // row height + spacing/divider
    }
    height += 6; // bottom spacing after table

    // General Order Notes
    if (order.note) {
      const noteLines = Math.max(1, Math.ceil(order.note.length / 22));
      height += 12 + noteLines * 10 + 10; // header + note lines + spacing
    }

    // Discounts
    if (order.discounts?.length) {
      height += 12; // header
      height += order.discounts.length * 11;
      height += 10; // spacing
    }

    // Totals
    height += 11; // Subtotal
    height += 11; // Tax
    if (Number(order.discount_total) > 0) height += 11;
    if (Number(order.tip_amount) > 0) height += 11;
    height += 6; // double line spacing
    height += 24; // Grand total text + margins
    height += 10; // dashed line spacing

    // Payment Info
    if (order.payment && !isBill) {
      let payHeight = 12; // box padding
      payHeight += 11; // Paid via ...
      if (order.payment.amount_tendered != null) payHeight += 16;
      if (order.payment.upi_ref || order.payment.card_ref) payHeight += 11;
      height += payHeight + 12; // box + spacing
    }

    // Footer
    height += 14; // thank you message
    height += 11; // powered by
    height += 20; // extra padding at bottom

    const finalHeight = Math.ceil(height);

    const doc = new PDFDocument({
      margin: 0,
      size: [width, finalHeight]
    });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Register fonts if available
    if (useRoboto) {
      doc.registerFont("RobotoMono", fontRegularPath);
      doc.registerFont("RobotoMono-Bold", fontBoldPath);
    }

    // Helper functions for line drawing
    const drawDashedLine = (y) => {
      doc.moveTo(margin, y)
         .lineTo(width - margin, y)
         .dash(2, { space: 2 })
         .strokeColor("#111111")
         .lineWidth(0.5)
         .stroke()
         .undash();
    };

    const drawSolidLine = (y, w = 0.5) => {
      doc.moveTo(margin, y)
         .lineTo(width - margin, y)
         .strokeColor("#111111")
         .lineWidth(w)
         .stroke();
    };

    const drawDoubleLine = (y) => {
      doc.moveTo(margin, y)
         .lineTo(width - margin, y)
         .strokeColor("#111111")
         .lineWidth(0.8)
         .stroke();
      doc.moveTo(margin, y + 2)
         .lineTo(width - margin, y + 2)
         .strokeColor("#111111")
         .lineWidth(0.8)
         .stroke();
    };

    let y = margin;

    // --- 1. HEADER ---
    doc.font(boldFont).fontSize(13);
    doc.text(tenant.name.toUpperCase(), margin, y, { align: "center", width: contentWidth });
    y += doc.heightOfString(tenant.name.toUpperCase(), { width: contentWidth }) + 2;

    if (tenant.address) {
      doc.font(regularFont).fontSize(8);
      doc.text(tenant.address.toUpperCase(), margin, y, { align: "center", width: contentWidth });
      y += doc.heightOfString(tenant.address.toUpperCase(), { width: contentWidth }) + 4;
    }
    y += 4;

    // Badges / Labels
    const badgeText = isBill ? "BILL / ESTIMATE" : "TAX INVOICE";
    const badgeWidth = 110;
    const badgeX = margin + (contentWidth - badgeWidth) / 2;
    doc.rect(badgeX, y, badgeWidth, 15).lineWidth(0.8).strokeColor("#111111").stroke();
    doc.font(boldFont).fontSize(9).text(badgeText, badgeX, y + 3, { align: "center", width: badgeWidth });
    y += 20;

    doc.font(boldFont).fontSize(9.5).text(`ORDER #${order.order_number}`, margin, y, { align: "center", width: contentWidth });
    y += 13;

    if (isBill) {
      const warningText = "PAYMENT PENDING - NOT AN INVOICE";
      const warningWidth = 170;
      const warningX = margin + (contentWidth - warningWidth) / 2;
      doc.rect(warningX, y, warningWidth, 14).dash(1.5, { space: 1.5 }).lineWidth(0.8).strokeColor("#111111").stroke().undash();
      doc.font(boldFont).fontSize(7.5).text(warningText, warningX, y + 3, { align: "center", width: warningWidth });
      y += 18;
    }

    y += 2;
    drawDashedLine(y);
    y += 6;

    // --- 2. META INFO ---
    doc.font(regularFont).fontSize(8.5);
    doc.text("DATE/TIME:", margin, y);
    doc.text(formatDateTime(order.created_at), margin, y, { align: "right", width: contentWidth });
    y += 11;

    if (order.table_number) {
      doc.text("TABLE:", margin, y);
      doc.font(boldFont).text(`#${order.table_number}`, margin, y, { align: "right", width: contentWidth });
      doc.font(regularFont);
      y += 11;
    }

    if (order.employee_name) {
      doc.text("SERVER:", margin, y);
      doc.text(order.employee_name.toUpperCase(), margin, y, { align: "right", width: contentWidth });
      y += 11;
    }

    y += 2;
    drawDashedLine(y);
    y += 6;

    // --- 3. CUSTOMER BLOCK ---
    if (order.customer_name) {
      let boxHeight = 12; // padding
      boxHeight += 10; // header
      const nameLines = Math.max(1, Math.ceil(order.customer_name.length / 18));
      boxHeight += nameLines * 11;
      
      let emailLines = 1;
      if (order.customer_phone) boxHeight += 11;
      if (order.customer_email) {
        emailLines = Math.max(1, Math.ceil(order.customer_email.length / 18));
        boxHeight += emailLines * 11;
      }

      // Draw box
      doc.rect(margin, y, contentWidth, boxHeight).lineWidth(0.8).strokeColor("#111111").stroke();
      
      let cy = y + 4;
      doc.font(boldFont).fontSize(7.5).text("CUSTOMER INFO", margin + 6, cy);
      cy += 10;

      doc.font(regularFont).fontSize(8.5);
      doc.text("NAME:", margin + 6, cy);
      doc.font(boldFont).text(order.customer_name.toUpperCase(), margin + 6, cy, { align: "right", width: contentWidth - 12 });
      cy += nameLines * 11;

      if (order.customer_phone) {
        doc.font(regularFont).text("PHONE:", margin + 6, cy);
        doc.text(order.customer_phone, margin + 6, cy, { align: "right", width: contentWidth - 12 });
        cy += 11;
      }

      if (order.customer_email) {
        doc.font(regularFont).text("EMAIL:", margin + 6, cy);
        doc.text(order.customer_email.toUpperCase(), margin + 6, cy, { align: "right", width: contentWidth - 12 });
        cy += emailLines * 11;
      }

      y += boxHeight + 6;
      drawDashedLine(y);
      y += 6;
    }

    // --- 4. ITEMS TABLE HEADER ---
    doc.font(boldFont).fontSize(8.5);
    doc.text("ITEM", margin, y);
    doc.text("QTY", margin + 103, y, { width: 20, align: "center" });
    doc.text("PRICE", margin + 123, y, { width: 35, align: "right" });
    doc.text("TOTAL", margin + 158, y, { width: 44.77, align: "right" });
    y += 11;
    drawSolidLine(y, 0.8);
    y += 5;

    // --- 5. ITEMS LIST ---
    doc.fontSize(8.5);
    for (const item of order.items || []) {
      const name = item.product_name || item.name || "";
      const nameLines = Math.max(1, Math.ceil(name.length / 16));
      let rowHeight = nameLines * 10;
      if (item.note) {
        const noteLines = Math.max(1, Math.ceil(item.note.length / 16));
        rowHeight += noteLines * 9;
      }
      rowHeight = Math.max(rowHeight, 11);

      // Print left column text
      doc.font(boldFont).text(name.toUpperCase(), margin, y, { width: 100 });
      if (item.note) {
        doc.font(regularFont).fontSize(7.5).text(`* ${item.note.toUpperCase()}`, margin, y + nameLines * 10, { width: 100 });
      }

      // Print other columns
      doc.font(regularFont).fontSize(8.5);
      doc.text(String(item.quantity), margin + 103, y, { width: 20, align: "center" });
      doc.text(formatCurrency(item.unit_price), margin + 123, y, { width: 35, align: "right" });
      doc.font(boldFont).text(formatCurrency(item.line_total), margin + 158, y, { width: 44.77, align: "right" });

      y += rowHeight + 4;

      // Draw light dashed separator
      doc.moveTo(margin, y)
         .lineTo(width - margin, y)
         .dash(1, { space: 1.5 })
         .strokeColor("#cccccc")
         .lineWidth(0.4)
         .stroke()
         .undash();
      
      y += 2;
    }
    y += 2;
    drawDashedLine(y);
    y += 6;

    // --- 6. GENERAL ORDER NOTES ---
    if (order.note) {
      const noteText = `"${order.note.toUpperCase()}"`;
      const noteLines = Math.max(1, Math.ceil(order.note.length / 22));
      const boxHeight = 12 + noteLines * 10;

      doc.rect(margin, y, contentWidth, boxHeight).dash(1.5, { space: 1.5 }).lineWidth(0.8).strokeColor("#111111").stroke().undash();
      doc.font(boldFont).fontSize(7.5).text("ORDER NOTES:", margin + 6, y + 4);
      doc.font(regularFont).fontSize(8).text(noteText, margin + 6, y + 13, { width: contentWidth - 12 });
      y += boxHeight + 6;
      drawDashedLine(y);
      y += 6;
    }

    // --- 7. DISCOUNTS SECTION ---
    if (order.discounts?.length) {
      doc.font(boldFont).fontSize(7.5).text("DISCOUNTS APPLIED:", margin, y);
      y += 10;
      doc.font(regularFont).fontSize(8.5);
      for (const d of order.discounts) {
        const label = String(d.coupon_code || d.promotion_name || d.source_type).toUpperCase();
        doc.text(label, margin, y);
        doc.text(`-${formatCurrency(d.discount_amount)}`, margin, y, { align: "right", width: contentWidth });
        y += 11;
      }
      y += 2;
      drawDashedLine(y);
      y += 6;
    }

    // --- 8. TOTALS ---
    doc.font(regularFont).fontSize(8.5);
    doc.text("SUBTOTAL", margin, y);
    doc.text(formatCurrency(order.subtotal), margin, y, { align: "right", width: contentWidth });
    y += 11;

    doc.text("TAX (GST)", margin, y);
    doc.text(formatCurrency(order.tax_total), margin, y, { align: "right", width: contentWidth });
    y += 11;

    if (Number(order.discount_total) > 0) {
      doc.text("TOTAL DISCOUNT", margin, y);
      doc.text(`-${formatCurrency(order.discount_total)}`, margin, y, { align: "right", width: contentWidth });
      y += 11;
    }

    if (Number(order.tip_amount) > 0) {
      doc.text("TIP", margin, y);
      doc.text(formatCurrency(order.tip_amount), margin, y, { align: "right", width: contentWidth });
      y += 11;
    }

    y += 2;
    drawDoubleLine(y);
    y += 6;

    doc.font(boldFont).fontSize(10.5);
    doc.text("GRAND TOTAL", margin, y);
    doc.fontSize(11).text(formatCurrency(order.total), margin - 1, y - 0.5, { align: "right", width: contentWidth });
    y += 15;

    drawDashedLine(y);
    y += 6;

    // --- 9. PAYMENT INFO ---
    if (order.payment && !isBill) {
      let payHeight = 12; // box padding
      payHeight += 11; // Paid via ...
      if (order.payment.amount_tendered != null) payHeight += 16;
      if (order.payment.upi_ref || order.payment.card_ref) payHeight += 11;

      // Draw box
      doc.rect(margin, y, contentWidth, payHeight).lineWidth(0.8).strokeColor("#111111").stroke();
      
      let py = y + 5;
      const methodText = `PAID VIA ${String(order.payment.method_type).toUpperCase()}`;
      doc.font(boldFont).fontSize(8).text(methodText, margin, py, { align: "center", width: contentWidth });
      py += 11;

      doc.font(regularFont).fontSize(8);
      if (order.payment.amount_tendered != null) {
        const tenderedText = `TENDERED: ${formatCurrency(order.payment.amount_tendered)}   CHANGE: ${formatCurrency(order.payment.change_due || 0)}`;
        doc.text(tenderedText, margin, py, { align: "center", width: contentWidth });
        py += 16;
      }

      const ref = order.payment.upi_ref || order.payment.card_ref;
      if (ref) {
        const label = order.payment.upi_ref ? "UPI REF" : "CARD REF";
        doc.text(`${label}: ${ref}`, margin, py, { align: "center", width: contentWidth });
        py += 11;
      }

      y += payHeight + 6;
      drawDashedLine(y);
      y += 6;
    }

    // --- 10. FOOTER ---
    doc.font(boldFont).fontSize(8);
    const footerMsg = isBill ? "PLEASE SETTLE AT COUNTER" : "THANK YOU FOR DINING WITH US!";
    doc.text(footerMsg, margin, y, { align: "center", width: contentWidth });
    y += 12;

    doc.font(regularFont).fontSize(7);
    doc.text("POWERED BY ODOOCAFE", margin, y, { align: "center", width: contentWidth });

    // End PDF generation
    doc.end();
  });
}
