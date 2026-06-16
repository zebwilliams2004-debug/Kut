// GET /api/whoop/auth -> redirect user to Whoop OAuth consent.
const { preflight } = require("../_lib");
module.exports = (req, res) => {
  if (preflight(req, res)) return;
  const base = `https://${req.headers.host}`;
  const url = "https://api.prod.whoop.com/oauth/oauth2/auth?response_type=code"
    + "&client_id=" + encodeURIComponent(process.env.WHOOP_CLIENT_ID || "")
    + "&redirect_uri=" + encodeURIComponent(base + "/api/whoop/callback")
    + "&scope=" + encodeURIComponent("read:cycles read:recovery offline")
    + "&state=kut";
  res.writeHead(302, { Location: url });
  res.end();
};
