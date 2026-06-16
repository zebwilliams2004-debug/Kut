// GET /api/food-search?q=...  -> { foods: [{n,cat,defG,k,p,c,f,m}] }  (USDA FoodData Central, normalized per 100 g)
const { preflight } = require("./_lib");

const NUT = { // USDA nutrientNumber -> our key (values already per 100 g for Foundation/SR/Survey)
  "203": "p", "205": "c", "204": "f", "208": "k",
  "291": "fiber", "269": "sugar", "606": "satfat", "601": "cholesterol", "307": "sodium",
  "301": "calcium", "303": "iron", "304": "magnesium", "305": "phosphorus", "306": "potassium",
  "309": "zinc", "312": "copper", "315": "manganese", "317": "selenium",
  "401": "vitC", "404": "b1", "405": "b2", "406": "b3", "410": "b5", "415": "b6",
  "417": "folate", "418": "b12", "421": "choline", "320": "vitA", "323": "vitE", "430": "vitK", "324": "vitD"
};
const MACRO = { p: 1, c: 1, f: 1, k: 1 };

module.exports = async (req, res) => {
  if (preflight(req, res)) return;
  const q = (req.query && req.query.q) || "";
  const key = process.env.USDA_API_KEY;
  if (!q) return res.status(200).json({ foods: [] });
  if (!key) return res.status(200).json({ foods: [], note: "USDA_API_KEY not set" });
  try {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${key}&query=${encodeURIComponent(q)}&pageSize=12&dataType=Foundation,SR%20Legacy,Survey%20(FNDDS),Branded`;
    const r = await fetch(url);
    const d = await r.json();
    const foods = (d.foods || []).map((f) => {
      const out = { n: (f.description || "").slice(0, 48), cat: "ot", defG: 100, k: 0, p: 0, c: 0, f: 0, m: {} };
      (f.foodNutrients || []).forEach((n) => {
        const id = String(n.nutrientNumber || (n.nutrient && n.nutrient.number));
        const val = n.value != null ? n.value : (n.amount != null ? n.amount : null);
        if (val == null) return;
        const k = NUT[id]; if (!k) return;
        if (MACRO[k]) out[k] = val; else out.m[k] = val;
      });
      return out.k ? out : null;
    }).filter(Boolean);
    res.status(200).json({ foods });
  } catch (e) {
    res.status(200).json({ foods: [], error: String(e) });
  }
};
