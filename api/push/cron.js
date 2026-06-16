// GET /api/push/cron  — invoked hourly by Vercel Cron. Sends meal reminders that match the current local time.
const webpush = require("web-push");
const { preflight, kv } = require("../_lib");

const MESSAGES = {
  breakfast: { title: "Time for breakfast", body: "Log your first meal to start the day on track." },
  lunch: { title: "Lunch time", body: "Don't forget to log your lunch in Kut." },
  dinner: { title: "Dinner check-in", body: "Log dinner and see your calories left." }
};

module.exports = async (req, res) => {
  if (preflight(req, res)) return;
  const store = kv();
  if (!store) return res.status(200).json({ sent: 0, note: "KV not configured" });
  if (!process.env.VAPID_PUBLIC || !process.env.VAPID_PRIVATE)
    return res.status(200).json({ sent: 0, note: "VAPID keys not set" });
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:you@example.com", process.env.VAPID_PUBLIC, process.env.VAPID_PRIVATE);

  const ids = (await store.smembers("kut:subs")) || [];
  let sent = 0;
  const nowUTCmin = new Date().getUTCHours() * 60 + new Date().getUTCMinutes();
  for (const id of ids) {
    const rec = await store.get("kut:sub:" + id);
    if (!rec) continue;
    const localMin = (nowUTCmin - (rec.tzOffset || 0) + 1440) % 1440; // tzOffset = Date.getTimezoneOffset()
    for (const meal of ["breakfast", "lunch", "dinner"]) {
      const t = (rec.reminders || {})[meal]; if (!t) continue;
      const [h, m] = t.split(":").map(Number);
      if (Math.abs(localMin - (h * 60 + m)) < 30) { // within this cron hour window
        try { await webpush.sendNotification(rec.subscription, JSON.stringify({ ...MESSAGES[meal], tag: meal })); sent++; }
        catch (e) { if (e.statusCode === 410 || e.statusCode === 404) { await store.del("kut:sub:" + id); await store.srem("kut:subs", id); } }
      }
    }
  }
  res.status(200).json({ sent });
};
