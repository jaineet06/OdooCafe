import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export async function sendReceiptEmail(to, subject, { html, text }, pdfBuffer) {
  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      html,
      text,
      attachments: [
        {
          filename: "receipt.pdf",
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });
    logger.info("Receipt email sent", { to });
  } catch (err) {
    logger.error("Failed to send receipt email", { error: err.message, to });
    throw err;
  }
}
