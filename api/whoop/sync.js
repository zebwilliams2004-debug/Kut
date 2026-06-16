// GET /api/whoop/sync -> { kcal } today's calories burned from Whoop (kilojoules -> kcal).
const { preflight, kv } = require("../_lib");

async function token(store) {
  let tok = await store.get("kut:whoop");
  if (!tok) return null;
  // refresh if needed
  try {
    const r = await fetch("https://api.prod.whoop.com/oauth/oauth2/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: tok.refresh_token,
        client_id: process.env.WHOOP_CLIENT_ID || "", client_secret: process.env.WHOOP_SECRET || "", scope: "offline" })
    });
    const nt = await r.json(); if (nt.access_token) { tok = nt; await store.set("kut:whoop", tok); }
  } catch {}
  return tok;
}

module.exports = async (req, res) => {
  if (preflight(req, res)) return;
  const store = kv();
  if (!store) return res.status(200).json({ kcal: 0, note: "KV not configured" });
  const tok = await token(store);
  if (!tok) return res.status(200).json({ kcal: 0, note: "not connected" });
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const r = await fetch("https://api.prod.whoop.com/developer/v1/cycle?start=" + start.toISOString() + "&limit=1",
      { headers: { Authorization: "Bearer " + tok.access_token } });
    const d = await r.json();
    const cyc = (d.records || [])[0];
    const kj = cyc && cyc.score && cyc.score.kilojoule ? cyc.score.kilojoule : 0;
    res.status(200).json({ kcal: Math.round(kj / 4.184) });
  } catch (e) {
    res.status(200).json({ kcal: 0, error: String(e) });
  }
};
