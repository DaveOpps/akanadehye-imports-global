// Telegram bot — local polling mode.
//
// Why polling: lets you test the bot without exposing a public webhook.
// Why standalone: this script runs outside Next.js so you can use it
// without deploying. It POSTs each message to your dev server's /api/bots/test
// endpoint (so the brain stays in one place) and forwards the reply.
//
// Usage:
//   1. cd into akanadehye/
//   2. Make sure your dev server is running: npm run dev
//   3. Create akanadehye/.env.local with:  TELEGRAM_BOT_TOKEN=123:abc...
//   4. node scripts/telegram-bot.mjs
//
// Stop with Ctrl+C.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Tiny .env.local loader (no dotenv dependency)
try {
  const env = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+)\s*$/i);
    if (m && !process.env[m[1]]) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      process.env[m[1]] = v;
    }
  }
} catch {
  /* no .env.local — that's fine if env vars are set another way */
}

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BRAIN_URL = process.env.BOT_BRAIN_URL || "http://localhost:3000/api/bots/test";

if (!TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN is not set.");
  console.error("   Create akanadehye/.env.local with: TELEGRAM_BOT_TOKEN=your_token_from_botfather");
  process.exit(1);
}

const API = `https://api.telegram.org/bot${TOKEN}`;

async function tg(method, body) {
  const res = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram ${method} failed: ${data.description}`);
  return data.result;
}

async function getReply(text) {
  try {
    const res = await fetch(BRAIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    if (!res.ok) throw new Error(`Brain returned ${res.status}`);
    const data = await res.json();
    return data.reply?.text ?? "Sorry, I'm not sure how to answer that.";
  } catch (err) {
    console.error("  ⚠ brain error:", err.message);
    return "Sorry, the assistant is offline. Please try again shortly.";
  }
}

async function handleUpdate(update) {
  const msg = update.message ?? update.edited_message;
  if (!msg || !msg.text) return;
  console.log(`📨 ${msg.chat.username ?? msg.chat.id}: ${msg.text}`);
  const reply = await getReply(msg.text);
  console.log(`📤 bot → ${msg.chat.id}: ${reply.split("\n")[0].slice(0, 60)}…`);
  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: reply,
    disable_web_page_preview: true,
  });
}

async function main() {
  // Drop any existing webhook so we can use polling
  try {
    await tg("deleteWebhook", { drop_pending_updates: false });
  } catch {}

  const me = await tg("getMe", {});
  console.log(`✅ Logged in as @${me.username} (${me.first_name})`);
  console.log(`   Brain endpoint: ${BRAIN_URL}`);
  console.log(`   Open Telegram, message your bot, watch this terminal.\n`);

  let offset = 0;
  for (;;) {
    try {
      const updates = await tg("getUpdates", { offset, timeout: 30, allowed_updates: ["message"] });
      for (const u of updates) {
        offset = u.update_id + 1;
        await handleUpdate(u);
      }
    } catch (err) {
      console.error("⚠ poll error:", err.message);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
