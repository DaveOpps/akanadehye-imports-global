import { NextRequest, NextResponse } from "next/server";
import { reply } from "@/lib/botBrain";
import { replyWithClaude } from "@/lib/claudeBot";
import { checkBotRateLimit, RATE_LIMIT_MESSAGES } from "@/lib/rateLimit";

async function sendTelegram(token: string, chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  }).catch(() => {
    /* swallow — Telegram retries on non-200, but we don't want to break the webhook */
  });
}

// Default persona used by server webhooks. Once Auth/DB lands (Sprint 1),
// load the merchant's saved persona instead.
const DEFAULT_PERSONA = {
  shopName: "Akanadehye",
  greeting: "👋 Welcome to Akanadehye! I can help you find products.",
  hours: "Mon–Sat 8am–8pm GMT",
  contactPhone: "+233 50 000 0000",
  contactEmail: "hello@akanadehye.com",
  tone: "friendly" as const,
};

// Telegram sends a Update object. We extract the message and reply via sendMessage.
// Docs: https://core.telegram.org/bots/api#update
//
// Setup:
// 1. Get a bot token from @BotFather
// 2. Set TELEGRAM_BOT_TOKEN env var
// 3. Tell Telegram where your webhook lives:
//    curl -F "url=https://YOUR_HOST/api/bots/telegram" \
//         https://api.telegram.org/bot<TOKEN>/setWebhook

type TelegramMessage = {
  message_id: number;
  chat: { id: number };
  text?: string;
};

type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
};

export async function POST(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "TELEGRAM_BOT_TOKEN not configured" },
      { status: 500 }
    );
  }

  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const msg = update.message ?? update.edited_message;
  if (!msg || !msg.text) {
    return NextResponse.json({ ok: true });
  }

  // Throttle before any Claude call so spam can't drain the Anthropic quota.
  const limit = checkBotRateLimit(`tg:${msg.chat.id}`);
  if (!limit.ok) {
    await sendTelegram(token, msg.chat.id, RATE_LIMIT_MESSAGES[limit.scope]);
    return NextResponse.json({ ok: true, rateLimited: limit.scope });
  }

  const botReply = process.env.ANTHROPIC_API_KEY
    ? await replyWithClaude(msg.text, DEFAULT_PERSONA, [])
    : await reply(msg.text);

  await sendTelegram(token, msg.chat.id, botReply.text);

  return NextResponse.json({ ok: true });
}

export async function GET() {
  // Health check / setup helper
  return NextResponse.json({
    ok: true,
    configured: !!process.env.TELEGRAM_BOT_TOKEN,
    info: "POST endpoint expects Telegram Update payload.",
  });
}
