import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

export async function sendReceiptEmail(to, subject, html, pdfBuffer) {
  const mailOptions = {
    from: env.SMTP_FROM,
    to,
    subject,
    html,
    attachments: [
      {
        filename: "receipt.pdf",
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  };

  try {
    await getTransporter().sendMail(mailOptions);
    logger.info("Receipt email sent", { to });
  } catch (err) {
    logger.error("Failed to send receipt email", { error: err.message, to });
    throw err;
  }
}
