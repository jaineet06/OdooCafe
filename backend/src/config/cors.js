/** Comma-separated extra origins, e.g. http://localhost:5174 */
function parseExtraOrigins() {
  const raw = process.env.CORS_ORIGINS || "";
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

const DEV_LOCALHOST = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

export function getCorsOrigin() {
  const primary = process.env.FRONTEND_URL || "http://localhost:5173";
  const allowed = new Set([primary, ...parseExtraOrigins()]);

  if (process.env.NODE_ENV !== "production") {
    for (const o of DEV_LOCALHOST) allowed.add(o);
  }

  const list = [...allowed];

  return (origin, callback) => {
    // Same-origin / server-to-server (no Origin header)
    if (!origin) return callback(null, true);
    if (list.includes(origin)) return callback(null, true);
    callback(null, false);
  };
}
