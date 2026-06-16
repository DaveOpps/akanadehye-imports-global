?# Chatbot setup

The Akanadehye app has a built-in bot brain that answers product questions on **WhatsApp** and **Telegram**. The brain is the same in all places (the test panel in /admin/chatbots, the Telegram polling script, and the webhook routes) so any tweak to `src/lib/botBrain.ts` is picked up everywhere.

## Test the bot (no setup needed)

1. Run `npm run dev`
2. Open http://localhost:3000/admin/chatbots
3. Use the **Test the bot** tab — it talks to `/api/bots/test` which calls the brain directly. No tokens required.

## Telegram (free, ~5 minutes)

### 1. Get a token

- Open Telegram, search for **@BotFather**
- Send `/newbot`, follow prompts to name your bot
- BotFather replies with a token like `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`

### 2. Add it to `.env.local`

Create `akanadehye/.env.local`:

```
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...your token here
```

Restart `npm run dev`.

### 3a. Local polling (easiest)

In a second terminal:

```
cd akanadehye
node scripts/telegram-bot.mjs
```

You should see `✅ Logged in as @your_bot_username`. Open Telegram, find your bot, message it. The terminal shows each message and reply in real time.

### 3b. Production webhook

Deploy the Next.js app somewhere public (Vercel works out of the box). Then register the webhook **once**:

```bash
curl -F "url=https://YOUR_HOST/api/bots/telegram" \
  https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook
```

Telegram will POST every message to `/api/bots/telegram` and the route replies via the `sendMessage` API.

To stop the webhook:

```bash
curl https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/deleteWebhook
```

## WhatsApp

Two paths. Pick one.

### Path A — Twilio Sandbox (fastest test)

1. Sign up at https://www.twilio.com/try-twilio (free trial credit)
2. Console → **Messaging → Try it out → Send a WhatsApp message**
3. Twilio gives you a sandbox WhatsApp number and a join code like `join scared-lion`. Text that code from your phone to the sandbox number to register your phone.
4. In **Sandbox Configuration**, set *"When a message comes in"* to:
   ```
   https://YOUR_HOST/api/bots/whatsapp
   ```
   For local development, expose your dev server with ngrok:
   ```
   ngrok http 3000
   ```
   Use the `https://xxx.ngrok.io/api/bots/whatsapp` URL in Twilio.
5. Save. Now message the Twilio number from your phone — the bot replies.

**Costs**: sandbox is free. Production WhatsApp via Twilio is ~$0.005 per message (varies by country).

### Path B — Meta WhatsApp Cloud API (cheaper at scale)

1. Set up at https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
2. Get your **permanent access token** and **Phone Number ID**
3. Add to `.env.local`:
   ```
   META_WHATSAPP_TOKEN=your_long_lived_token
   META_WHATSAPP_VERIFY_TOKEN=any_string_you_choose
   ```
4. In Meta's webhook config:
   - Callback URL: `https://YOUR_HOST/api/bots/whatsapp`
   - Verify token: same value as `META_WHATSAPP_VERIFY_TOKEN`
   - Subscribe to `messages`

Meta gives you 1,000 free service conversations per month.

## How the brain works

`src/lib/botBrain.ts` is a pure async function:

```ts
import { reply } from "@/lib/botBrain";
const r = await reply("do you have iphones?");
console.log(r.text); // formatted answer
```

It detects intents (greet, list categories, search, ask price, contact human) and fetches product data from `dummyjson.com` (same source the /products page uses). To plug in your own catalog later, edit `src/lib/products.ts`.

## Files

- `src/lib/botBrain.ts` — the brain (intent detection + replies)
- `src/app/api/bots/test/route.ts` — POST endpoint used by the dashboard test panel
- `src/app/api/bots/telegram/route.ts` — Telegram webhook
- `src/app/api/bots/whatsapp/route.ts` — Twilio + Meta WhatsApp webhook
- `scripts/telegram-bot.mjs` — local polling runner
- `src/app/admin/chatbots/page.tsx` — config UI and test chat
