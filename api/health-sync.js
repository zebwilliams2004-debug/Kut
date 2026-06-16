// Apple Watch / Health bridge (via iOS Shortcuts automation).
//   POST /api/health-sync { kcal, token }      -> stores today's active energy
//   GET  /api/health-sync?token=...&date=YYYY-MM-DD -> { kcal }
const { preflight, body, kv } = require("./_lib");

function dayStr(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }

module.exports = async (req, res) => {
  if (preflight(req, res)) return;
  const store = kv();
  if (!store) return res.status(200).json({ ok: false, note: "KV not configured" });

  if (req.method === "POST") {
    const { kcal, token } = await body(req);
    if (!token) return res.status(400).json({ ok: false, error: "token required" });
    const date = dayStr(new Date());
    await store.set(`kut:burn:${token}:${date}`, Math.round(kcal || 0));
    return res.status(200).json({ ok: true, date, kcal: Math.round(kcal || 0) });
  }
  // GET
  const token = req.query && req.query.token;
  const date = (req.query && req.query.date) || dayStr(new Date());
  if (!token) return res.status(400).json({ kcal: 0, error: "token required" });
  const kcal = (await store.get(`kut:burn:${token}:${date}`)) || 0;
  res.status(200).json({ kcal });
};
