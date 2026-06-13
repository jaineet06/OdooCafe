import { STORAGE_KEYS } from "./constants";

async function fetchPdf(path, filename) {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const base = import.meta.env.VITE_API_BASE_URL || "/api";
  const res = await fetch(`${base}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Could not load document");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function openReceiptPdf(orderId) {
  return fetchPdf(`/receipts/${orderId}/pdf`, `receipt-${orderId}.pdf`);
}

export async function openBillPdf(orderId) {
  return fetchPdf(`/receipts/${orderId}/bill/pdf`, `bill-${orderId}.pdf`);
}

export function printReceiptElement() {
  window.print();
}
