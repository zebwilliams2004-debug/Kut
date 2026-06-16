// Shared helpers for Kut API routes.
function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
function preflight(req, res) {
  cors(res);
  if (req.method === "OPTIONS") { res.status(200).end(); return true; }
  return false;
}
async function body(req) {
  if (req.body) return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  return await new Promise((resolve) => {
    let d = ""; req.on("data", (c) => (d += c)); req.on("end", () => { try { resolve(JSON.parse(d || "{}")); } catch { resolve({}); } });
  });
}
// KV wrapper — uses @vercel/kv if configured, else throws (storage required for push/whoop).
let _kv = null;
function kv() {
  if (_kv) return _kv;
  try { _kv = require("@vercel/kv").kv; } catch { _kv = null; }
  return _kv;
}
module.exports = { cors, preflight, body, kv };
