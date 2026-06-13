import PDFDocument from "pdfkit";

export function generateReceiptPDF(order, tenant, { type = "receipt" } = {}) {
  const isBill = type === "bill";
  const title = isBill ? "BILL" : "RECEIPT";

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(22).font("Helvetica-Bold").text(tenant.name, { align: "center" });
    if (tenant.address) doc.fontSize(10).font("Helvetica").text(tenant.address, { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(14).font("Helvetica-Bold").text(title, { align: "center" });
    if (isBill) {
      doc.fontSize(9).font("Helvetica").fillColor("#b54040").text("NOT A TAX INVOICE — PAYMENT PENDING", { align: "center" });
      doc.fillColor("#000000");
    }
    doc.moveDown(0.5);
    doc.fontSize(11).font("Helvetica");
    doc.text(`Order #${order.order_number}`, { align: "center" });
    doc.text(new Date(order.created_at).toLocaleString(), { align: "center" });
    if (order.table_number) doc.text(`Table: ${order.table_number}`, { align: "center" });
    if (order.employee_name) doc.text(`Served by: ${order.employee_name}`, { align: "center" });
    if (order.customer_name) doc.text(`Customer: ${order.customer_name}`, { align: "center" });
    doc.moveDown();

    const col = { item: 50, qty: 280, price: 340, total: 420 };
    doc.font("Helvetica-Bold").fontSize(10);
    doc.text("Item", col.item, doc.y, { width: 220 });
    const headerY = doc.y - 12;
    doc.text("Qty", col.qty, headerY, { width: 40 });
    doc.text("Unit", col.price, headerY, { width: 70 });
    doc.text("Total", col.total, headerY, { width: 80 });
    doc.moveDown(0.4);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.3);

    doc.font("Helvetica").fontSize(10);
    for (const item of order.items || []) {
      const y = doc.y;
      doc.text(item.product_name || item.name, col.item, y, { width: 220 });
      doc.text(String(item.quantity), col.qty, y, { width: 40 });
      doc.text(`₹${Number(item.unit_price).toFixed(2)}`, col.price, y, { width: 70 });
      doc.text(`₹${Number(item.line_total).toFixed(2)}`, col.total, y, { width: 80 });
      doc.moveDown(0.8);
    }

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    if (order.discounts?.length) {
      doc.font("Helvetica-Bold").text("Discounts", 50);
      doc.font("Helvetica");
      for (const d of order.discounts) {
        const label = d.coupon_code || d.promotion_name || d.source_type;
        doc.text(`${label}: -₹${Number(d.discount_amount).toFixed(2)}`);
      }
      doc.moveDown(0.5);
    }

    const sx = 340;
    doc.text(`Subtotal:`, sx, doc.y, { continued: true });
    doc.text(`₹${Number(order.subtotal).toFixed(2)}`, { align: "right" });
    doc.text(`Tax:`, sx, doc.y, { continued: true });
    doc.text(`₹${Number(order.tax_total).toFixed(2)}`, { align: "right" });
    if (Number(order.discount_total) > 0) {
      doc.text(`Discount:`, sx, doc.y, { continued: true });
      doc.text(`-₹${Number(order.discount_total).toFixed(2)}`, { align: "right" });
    }
    doc.moveDown(0.3);
    doc.font("Helvetica-Bold").fontSize(13);
    doc.text(`TOTAL:`, sx, doc.y, { continued: true });
    doc.text(`₹${Number(order.total).toFixed(2)}`, { align: "right" });
    doc.font("Helvetica").fontSize(10);

    if (order.payment && !isBill) {
      doc.moveDown();
      doc.text(`Payment: ${order.payment.method_type.toUpperCase()}`, { align: "center" });
      if (order.payment.amount_tendered) {
        doc.text(`Tendered: ₹${Number(order.payment.amount_tendered).toFixed(2)}`, { align: "center" });
        doc.text(`Change: ₹${Number(order.payment.change_due || 0).toFixed(2)}`, { align: "center" });
      }
      if (order.payment.upi_ref) doc.text(`UPI Ref: ${order.payment.upi_ref}`, { align: "center" });
      if (order.payment.card_ref) doc.text(`Card Ref: ${order.payment.card_ref}`, { align: "center" });
    }

    doc.moveDown(2);
    doc.fontSize(10).text(isBill ? "Please settle payment at the counter. Thank you!" : "Thank you for dining with us!", { align: "center" });

    doc.end();
  });
}
