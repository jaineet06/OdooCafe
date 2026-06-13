import PDFDocument from "pdfkit";

export function generateReceiptPDF(order, tenant) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).font("Helvetica-Bold").text(tenant.name, { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(12).font("Helvetica").text(`Order #${order.order_number}`, { align: "center" });
    doc.text(new Date(order.created_at).toLocaleString(), { align: "center" });
    doc.moveDown();

    doc.font("Helvetica-Bold");
    doc.text("Item", 50, doc.y, { continued: true, width: 200 });
    doc.text("Qty", 250, doc.y, { continued: true, width: 50 });
    doc.text("Price", 300, doc.y, { continued: true, width: 80 });
    doc.text("Total", 380, doc.y, { width: 80 });
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.3);

    doc.font("Helvetica");
    for (const item of order.items || []) {
      const y = doc.y;
      doc.text(item.product_name || item.name, 50, y, { width: 200 });
      doc.text(String(item.quantity), 250, y, { width: 50 });
      doc.text(`₹${Number(item.unit_price).toFixed(2)}`, 300, y, { width: 80 });
      doc.text(`₹${Number(item.line_total).toFixed(2)}`, 380, y, { width: 80 });
      doc.moveDown();
    }

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    const summaryX = 350;
    doc.text(`Subtotal:`, summaryX, doc.y, { continued: true });
    doc.text(`₹${Number(order.subtotal).toFixed(2)}`, { align: "right" });
    doc.text(`Tax:`, summaryX, doc.y, { continued: true });
    doc.text(`₹${Number(order.tax_total).toFixed(2)}`, { align: "right" });
    doc.text(`Discount:`, summaryX, doc.y, { continued: true });
    doc.text(`-₹${Number(order.discount_total).toFixed(2)}`, { align: "right" });
    doc.font("Helvetica-Bold");
    doc.text(`Total:`, summaryX, doc.y, { continued: true });
    doc.text(`₹${Number(order.total).toFixed(2)}`, { align: "right" });
    doc.font("Helvetica");

    if (order.payment) {
      doc.moveDown();
      doc.text(`Payment: ${order.payment.method_type.toUpperCase()}`, { align: "center" });
      if (order.payment.amount_tendered) {
        doc.text(`Tendered: ₹${Number(order.payment.amount_tendered).toFixed(2)}`, { align: "center" });
        doc.text(`Change: ₹${Number(order.payment.change_due || 0).toFixed(2)}`, { align: "center" });
      }
    }

    doc.moveDown(2);
    doc.fontSize(10).text("Thank you for dining with us!", { align: "center" });

    doc.end();
  });
}
