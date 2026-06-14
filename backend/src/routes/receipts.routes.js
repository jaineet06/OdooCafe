import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { tenantMiddleware } from "../middleware/tenant.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateReceiptPdf, generateBillPdf, emailReceipt } from "../services/receipts.service.js";

export const receiptsRouter = Router();
receiptsRouter.use(authMiddleware, tenantMiddleware);

// GET /api/receipts/:orderId/pdf  — download receipt PDF
receiptsRouter.get("/:orderId/pdf", asyncHandler(async (req, res) => {
  const pdf = await generateReceiptPdf(req.tenantId, req.params.orderId);
  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename="receipt-${req.params.orderId}.pdf"`,
    "Content-Length": pdf.length,
  });
  res.end(pdf);
}));

// GET /api/receipts/:orderId/bill/pdf  — download bill PDF (unpaid)
receiptsRouter.get("/:orderId/bill/pdf", asyncHandler(async (req, res) => {
  const pdf = await generateBillPdf(req.tenantId, req.params.orderId);
  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename="bill-${req.params.orderId}.pdf"`,
    "Content-Length": pdf.length,
  });
  res.end(pdf);
}));

// POST /api/receipts/:orderId/email  — email receipt
receiptsRouter.post("/:orderId/email", asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: "Email address is required" });
  }
  const result = await emailReceipt(req.tenantId, req.params.orderId, email);
  res.json({ success: true, data: result });
}));
