import * as service from "../services/reports.service.js";
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

    // Title Row
    sheet.mergeCells("A1:G1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "OdooCafe Sales Report";
    titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FFFFFF" } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "3E2723" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    sheet.getRow(1).height = 40;

    // Subtitle Row
    sheet.mergeCells("A2:G2");
    const subCell = sheet.getCell("A2");
    subCell.value = `Generated: ${new Date().toLocaleString()}`;
    subCell.font = { name: "Arial", size: 10, italic: true, color: { argb: "555555" } };
    subCell.alignment = { horizontal: "center", vertical: "middle" };
    sheet.getRow(2).height = 20;

    sheet.addRow([]);

    // KPI Summary
    const totalOrders = data.length;
    const revenue = data.reduce((s, r) => s + Number(r.total), 0);
    const avgOrder = totalOrders > 0 ? (revenue / totalOrders) : 0;

    sheet.addRow(["KPI Summary", "", "", "", "", "", ""]);
    sheet.mergeCells("A4:C4");
    sheet.getCell("A4").font = { name: "Arial", size: 12, bold: true, color: { argb: "3E2723" } };

    const kpiRow1 = sheet.addRow(["Total Revenue", "Total Orders", "Average Order Value", "", "", "", ""]);
    kpiRow1.eachCell((cell, colNum) => {
      if (colNum <= 3) {
        cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "777777" } };
        cell.alignment = { horizontal: "center" };
      }
    });

    const kpiRow2 = sheet.addRow([revenue, totalOrders, avgOrder, "", "", "", ""]);
    kpiRow2.getCell(1).numFormat = "$#,##0.00";
    kpiRow2.getCell(3).numFormat = "$#,##0.00";
    kpiRow2.eachCell((cell, colNum) => {
      if (colNum <= 3) {
        cell.font = { name: "Arial", size: 14, bold: true, color: { argb: "D84315" } };
        cell.alignment = { horizontal: "center" };
        cell.border = {
          top: { style: "thin", color: { argb: "CCCCCC" } },
          left: { style: "thin", color: { argb: "CCCCCC" } },
          bottom: { style: "thin", color: { argb: "CCCCCC" } },
          right: { style: "thin", color: { argb: "CCCCCC" } }
        };
      }
    });

    sheet.addRow([]);

    // Table Headers
    const headerRow = sheet.addRow(["Order #", "Subtotal", "Tax", "Discount", "Total", "Date", "Employee"]);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "8C6A5C" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        bottom: { style: "medium", color: { argb: "3E2723" } }
      };
    });

    // Add Rows
    data.forEach((row, index) => {
      const addedRow = sheet.addRow([
        `#${row.order_number}`,
        Number(row.subtotal),
        Number(row.tax_total),
        Number(row.discount_total),
        Number(row.total),
        new Date(row.created_at),
        row.employee || "System"
      ]);
      
      addedRow.getCell(1).alignment = { horizontal: "center" };
      addedRow.getCell(2).numFormat = "$#,##0.00";
      addedRow.getCell(3).numFormat = "$#,##0.00";
      addedRow.getCell(4).numFormat = "$#,##0.00";
      addedRow.getCell(5).numFormat = "$#,##0.00";
      addedRow.getCell(5).font = { bold: true };
      addedRow.getCell(6).numFormat = "yyyy-mm-dd hh:mm";
      addedRow.getCell(6).alignment = { horizontal: "center" };
      
      if (index % 2 === 1) {
        addedRow.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F9FAF8" } };
        });
      }

      addedRow.eachCell((cell) => {
        cell.border = {
          bottom: { style: "thin", color: { argb: "E5E7EB" } }
        };
      });
    });

    sheet.columns.forEach((column, index) => {
      let maxLen = 10;
      sheet.eachRow({ includeRow: [8, sheet.rowCount] }, (row) => {
        const val = row.getCell(index + 1).value;
        if (val) {
          const len = val.toString().length;
          if (len > maxLen) maxLen = len;
        }
      });
      column.width = maxLen + 4;
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=sales-report.xlsx");
    await workbook.xlsx.write(res);
    return;
  }

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=sales-report.pdf");
  doc.pipe(res);

  // Top header bar
  doc.rect(50, 45, 512, 12).fill("#3E2723");

  // Title
  doc.fillColor("#3E2723").fontSize(22).text("OdooCafe Sales Report", 50, 70, { align: "left" });
  doc.fillColor("#6B7280").fontSize(9).text(`Generated: ${new Date().toLocaleString()}`, 50, 95);
  doc.moveDown(1.5);

  // Stats calculation
  const totalOrders = data.length;
  const revenue = data.reduce((s, r) => s + Number(r.total), 0);
  const avgOrder = totalOrders > 0 ? (revenue / totalOrders) : 0;

  // KPI Block
  doc.fillColor("#374151").fontSize(11).text("Summary KPIs", 50, 120);
  doc.rect(50, 135, 512, 50).stroke("#E5E7EB");
  doc.lineCap("butt").moveTo(220, 135).lineTo(220, 185).stroke("#E5E7EB");
  doc.moveTo(390, 135).lineTo(390, 185).stroke("#E5E7EB");

  doc.fillColor("#6B7280").fontSize(8).text("TOTAL REVENUE", 65, 145);
  doc.fillColor("#D84315").fontSize(13).text(`$${revenue.toFixed(2)}`, 65, 158);

  doc.fillColor("#6B7280").fontSize(8).text("TOTAL ORDERS", 235, 145);
  doc.fillColor("#3E2723").fontSize(13).text(`${totalOrders}`, 235, 158);

  doc.fillColor("#6B7280").fontSize(8).text("AVERAGE ORDER VALUE", 405, 145);
  doc.fillColor("#2E7D32").fontSize(13).text(`$${avgOrder.toFixed(2)}`, 405, 158);

  // Table header
  doc.fillColor("#374151").fontSize(11).text("Order Details List", 50, 205);

  let y = 220;
  doc.rect(50, y, 512, 18).fill("#8C6A5C");
  doc.fillColor("#FFFFFF").fontSize(8);
  doc.text("Order #", 60, y + 5);
  doc.text("Date/Time", 140, y + 5);
  doc.text("Server / Employee", 260, y + 5);
  doc.text("Subtotal", 380, y + 5, { width: 80, align: "right" });
  doc.text("Total", 470, y + 5, { width: 80, align: "right" });

  y += 18;
  doc.fillColor("#374151");
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
    if (y > 700) {
      doc.addPage();
      y = 50;
      doc.rect(50, y, 512, 18).fill("#8C6A5C");
      doc.fillColor("#FFFFFF").fontSize(8);
      doc.text("Order #", 60, y + 5);
      doc.text("Date/Time", 140, y + 5);
      doc.text("Server / Employee", 260, y + 5);
      doc.text("Subtotal", 380, y + 5, { width: 80, align: "right" });
      doc.text("Total", 470, y + 5, { width: 80, align: "right" });
      y += 18;
      doc.fillColor("#374151");
    }

    if (i % 2 === 1) {
      doc.rect(50, y, 512, 16).fill("#F9FAF8");
      doc.fillColor("#374151");
    }

    doc.text(`#${row.order_number}`, 60, y + 4);
    doc.text(new Date(row.created_at).toLocaleString(), 140, y + 4);
    doc.text(row.employee || "System", 260, y + 4);
    doc.text(`$${Number(row.subtotal).toFixed(2)}`, 380, y + 4, { width: 80, align: "right" });
    doc.text(`$${Number(row.total).toFixed(2)}`, 470, y + 4, { width: 80, align: "right" });

    y += 16;
  }

  doc.end();
}
