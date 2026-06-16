// POST /api/ai-photo  { image: dataURL }  -> { items:[{name,grams,k,p,c,f}] }
// Uses an OpenAI vision model to identify foods + estimate nutrition. Costs ~pennies per image.
const { preflight, body } = require("./_lib");

const PROMPT = `You are a nutrition assistant. Identify the distinct foods in this meal photo and estimate each one's portion.
Respond with ONLY valid JSON, no prose, in this exact shape:
{"items":[{"name":"grilled chicken breast","grams":150,"k":248,"p":47,"c":0,"f":5}]}
Rules: k=calories, p/c/f = grams of protein/carbs/fat for that portion. Estimate realistic portion grams. Max 6 items. If you cannot identify food, return {"items":[]}.`;

module.exports = async (req, res) => {
  if (preflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(200).json({ items: [], note: "OPENAI_API_KEY not set" });
  try {
    const { image } = await body(req);
    if (!image) return res.status(400).json({ items: [], error: "no image" });
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
        max_tokens: 600,
        messages: [{
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            { type: "image_url", image_url: { url: image } }
          ]
        }]
      })
    });
    const d = await r.json();
    let txt = (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || "{}";
    txt = txt.replace(/```json|```/g, "").trim();
    let parsed = { items: [] };
    try { parsed = JSON.parse(txt); } catch { const m = txt.match(/\{[\s\S]*\}/); if (m) try { parsed = JSON.parse(m[0]); } catch {} }
    res.status(200).json({ items: Array.isArray(parsed.items) ? parsed.items.slice(0, 6) : [] });
  } catch (e) {
    res.status(200).json({ items: [], error: String(e) });
  }
};
