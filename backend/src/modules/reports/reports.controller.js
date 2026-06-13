import * as service from "./reports.service.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

export async function dashboard(req, res) {
  const data = await service.getDashboard(req.tenantId, req.query);
  return res.json({ success: true, message: "Success", data });
}

export async function salesTrend(req, res) {
  const data = await service.getSalesTrend(req.tenantId, req.query);
  return res.json({ success: true, message: "Success", data });
}

export async function topProducts(req, res) {
  const data = await service.getTopProducts(req.tenantId, req.query);
  return res.json({ success: true, message: "Success", data });
}

export async function topCategories(req, res) {
  const data = await service.getTopCategories(req.tenantId, req.query);
  return res.json({ success: true, message: "Success", data });
}

export async function topOrders(req, res) {
  const data = await service.getTopOrders(req.tenantId, req.query);
  return res.json({ success: true, message: "Success", data });
}

export async function orderStatus(req, res) {
  const data = await service.getOrderStatusAnalytics(req.tenantId);
  return res.json({ success: true, message: "Success", data });
}

export async function exportReport(req, res) {
  const data = await service.getExportData(req.tenantId, req.query);
  const format = req.query.format || "pdf";

  if (format === "xls") {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sales Report");
    sheet.columns = [
      { header: "Order #", key: "order_number", width: 12 },
      { header: "Total", key: "total", width: 12 },
      { header: "Subtotal", key: "subtotal", width: 12 },
      { header: "Tax", key: "tax_total", width: 12 },
      { header: "Discount", key: "discount_total", width: 12 },
      { header: "Date", key: "created_at", width: 20 },
      { header: "Employee", key: "employee", width: 20 },
    ];
    data.forEach((row) => sheet.addRow(row));

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=sales-report.xlsx");
    await workbook.xlsx.write(res);
    return;
  }

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=sales-report.pdf");
  doc.pipe(res);

  doc.fontSize(18).text("Sales Report", { align: "center" });
  doc.moveDown();

  for (const row of data) {
    doc.fontSize(10).text(
      `Order #${row.order_number} | ₹${Number(row.total).toFixed(2)} | ${new Date(row.created_at).toLocaleDateString()} | ${row.employee}`
    );
  }

  doc.end();
}
