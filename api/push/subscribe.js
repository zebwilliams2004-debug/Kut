// POST /api/push/subscribe { subscription, reminders, tzOffset }
// Stores the push subscription + reminder times so the cron can deliver them.
const { preflight, body, kv } = require("../_lib");

module.exports = async (req, res) => {
  if (preflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const store = kv();
  if (!store) return res.status(200).json({ ok: false, note: "KV not configured" });
  try {
    const { subscription, reminders, tzOffset } = await body(req);
    const id = Buffer.from(subscription.endpoint).toString("base64").slice(-24);
    await store.set("kut:sub:" + id, { subscription, reminders: reminders || {}, tzOffset: tzOffset || 0 });
    await store.sadd("kut:subs", id);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(200).json({ ok: false, error: String(e) });
  }
};
