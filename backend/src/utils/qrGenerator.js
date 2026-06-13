import QRCode from "qrcode";

export async function generateUPIQR(upiId, amount, tenantName) {
  const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(tenantName)}&am=${amount}&cu=INR`;
  return QRCode.toDataURL(upiString);
}
