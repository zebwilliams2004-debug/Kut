# Kut — setup & deploy guide

Kut is a food tracker that runs as a Progressive Web App (PWA). It works **today with zero setup**, and unlocks premium cloud features (AI photo, USDA micronutrients, real push notifications, Whoop & Apple Watch sync) once you deploy the small backend in this folder.

---

## 1. Use it right now (no deploy)

Open `index.html` in a browser. Everything below already works, fully on-device:

- TDEE onboarding (calories + macros from your height/weight/activity/cut timeframe)
- Logging by search (built-in database **+ live Open Food Facts**, millions of foods), barcode lookup, voice, photo capture, and custom entries
- Correct serving-size scaling (change grams → calories, macros, and micros all update)
- Vitamins, minerals, and health flags (sodium / sugar / saturated fat / fiber)
- Saved Meals tab, weight & water tracking, streaks
- In-app reminders (fire while the app is open)

Your data is stored only on your device.

---

## 2. Put it on your iPhone

A web app **can't** run as an installed app straight from a OneDrive/iCloud file — Safari needs it served over **HTTPS**. The deploy in Step 3 gives you that URL. Once deployed:

1. Open the URL in **Safari** on your iPhone.
2. Tap the **Share** button → **Add to Home Screen**.
3. Launch Kut from the home-screen icon (it runs full-screen, like a native app).

> Want to try it on your phone *before* deploying? Drag this folder onto **https://app.netlify.com/drop** for an instant free HTTPS URL, then Add to Home Screen. (Netlify Drop hosts the static app; for push/AI/Whoop use the Vercel deploy below, which also runs the backend.)

---

## 3. Deploy the full app to Vercel (free, ~10 min)

The backend (`/api`) needs a host that runs serverless functions. Vercel's free Hobby plan covers personal use.

1. Create a free account at **https://vercel.com** and install the CLI: `npm i -g vercel`
2. In this folder run: `vercel` (follow prompts) then `vercel --prod`
   - Or: push this folder to a GitHub repo and **Import Project** in the Vercel dashboard.
3. Vercel gives you a URL like `https://kut-xxxx.vercel.app`. That serves both the app **and** the API.
4. In the app: **Profile → Cloud features**, paste that URL, **Save & test**.

### Add storage (needed for push & Whoop)
In the Vercel dashboard → your project → **Storage** → create a **KV / Upstash Redis** database and "Connect" it to the project. This auto-adds the `KV_*` environment variables. (Free tier is plenty for one user.)

---

## 4. Get the API keys

Set these as **Environment Variables** in the Vercel dashboard (Project → Settings → Environment Variables), then redeploy.

| Variable | What it's for | Where to get it | Cost |
|---|---|---|---|
| `OPENAI_API_KEY` | AI meal-photo recognition | platform.openai.com → API keys | ~$0.002–0.01 per photo |
| `OPENAI_VISION_MODEL` | (optional) defaults to `gpt-4o-mini` | — | — |
| `USDA_API_KEY` | USDA FoodData Central micros | fdc.nal.usda.gov/api-key-signup | Free |
| `VAPID_PUBLIC` / `VAPID_PRIVATE` | Web push keys | run `npx web-push generate-vapid-keys` | Free |
| `VAPID_SUBJECT` | `mailto:youremail@example.com` | your email | Free |
| `WHOOP_CLIENT_ID` / `WHOOP_SECRET` | Whoop sync | developer.whoop.com (create an app) | Free |

To generate VAPID keys locally: `npm i -g web-push` then `web-push generate-vapid-keys`.

For Whoop: at developer.whoop.com create an app and set the **Redirect URI** to `https://YOUR-URL.vercel.app/api/whoop/callback`.

---

## 5. Turn on push notifications (iPhone)

iOS supports web push **only for installed PWAs on iOS 16.4+**:

1. Make sure you did **Add to Home Screen** (Step 2) and opened Kut from that icon.
2. **Profile → Meal notifications** → toggle on → **Allow** when prompted.
3. Set your meal times in **Reminder times**.

The hourly Vercel Cron (`/api/push/cron`) then delivers reminders even when the app is closed. Without the backend, reminders still fire while the app is open.

---

## 6. Apple Watch / Apple Health auto-sync

Apple doesn't let web apps read Health directly, so we bridge it with a free **Shortcuts automation** that sends your daily Active Energy to Kut. In **Profile → Apple Watch / Health** the app shows your personal endpoint and token. Setup (~2 min):

1. iPhone **Shortcuts** app → **Automation** → **+** → **Time of Day** → 11:30 PM, daily, Run Immediately (turn off "Ask Before Running").
2. Add action **Find Health Samples** → Active Energy, Today, **Statistic: Sum**.
3. Add **Get Contents of URL**:
   - URL: the endpoint shown in the app (`https://YOUR-URL.vercel.app/api/health-sync`)
   - Method: **POST**, Request Body: **JSON**
   - Add field `kcal` = the Health result (a variable), and `token` = the token shown in the app.

Kut pulls that number on launch and adds it to your daily calorie budget (when **Auto-adjust calories from activity** is on).

## 7. Whoop auto-sync

**Profile → Whoop → Connect Whoop**, approve access, and Kut pulls each day's calories burned automatically (and via **Sync today now**).

---

## 8. Cost recap (personal use)

- Hosting (Vercel), USDA, Open Food Facts, web push, Whoop, Apple Health bridge: **$0**
- AI meal photos: pay-as-you-go to OpenAI, typically **well under $5/month** for a few photos a day.
- Optional custom domain: ~$12/year.

---

## File map

```
index.html / styles.css / app.js   the PWA (frontend)
sw.js / manifest.json / icon-*.png  installability, offline, push
api/                                serverless backend (Vercel)
  food-search.js                    USDA proxy
  ai-photo.js                       OpenAI vision
  push/{key,subscribe,cron}.js      web push
  whoop/{auth,callback,sync}.js     Whoop OAuth + daily burn
  health-sync.js                    Apple Health (Shortcuts) ingest
vercel.json / package.json          deploy config + cron
```

*Kut estimates nutrients from your inputs and public nutrition data; values may be incomplete and are not medical advice.*
