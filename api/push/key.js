// GET /api/push/key -> { key: <VAPID public key> }
const { preflight } = require("../_lib");
module.exports = (req, res) => {
  if (preflight(req, res)) return;
  res.status(200).json({ key: process.env.VAPID_PUBLIC || "" });
};
