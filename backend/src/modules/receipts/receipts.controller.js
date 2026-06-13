import * as service from "./receipts.service.js";

export async function downloadPDF(req, res) {
  const pdfBuffer = await service.generatePDF(req.tenantId, req.params.orderId);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=receipt-${req.params.orderId}.pdf`);
  return res.send(pdfBuffer);
}

export async function emailReceipt(req, res) {
  const data = await service.emailReceipt(req.tenantId, req.params.orderId, req.body.email);
  return res.json({ success: true, message: "Receipt sent", data });
}
