// GET /api/whoop/callback?code=... -> exchange code for tokens, store, redirect home.
const { preflight, kv } = require("../_lib");
module.exports = async (req, res) => {
  if (preflight(req, res)) return;
  const code = req.query && req.query.code;
  const base = `https://${req.headers.host}`;
  if (!code) { res.writeHead(302, { Location: "/" }); return res.end(); }
  try {
    const r = await fetch("https://api.prod.whoop.com/oauth/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code", code,
        client_id: process.env.WHOOP_CLIENT_ID || "", client_secret: process.env.WHOOP_SECRET || "",
        redirect_uri: base + "/api/whoop/callback"
      })
    });
    const tok = await r.json();
    const store = kv();
    if (store && tok.access_token) await store.set("kut:whoop", tok);
    res.writeHead(302, { Location: "/?whoop=connected" });
    res.end();
  } catch (e) {
    res.writeHead(302, { Location: "/?whoop=error" });
    res.end();
  }
};
