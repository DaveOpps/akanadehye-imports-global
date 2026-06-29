import { NextRequest, NextResponse } from "next/server";
import { reply } from "@/lib/botBrain";
import { replyWithClaude } from "@/lib/claudeBot";
import { checkBotRateLimit, RATE_LIMIT_MESSAGES } from "@/lib/rateLimit";

const DEFAULT_PERSONA = {
  shopName: "Akanadehye",
  greeting: "👋 Welcome to Akanadehye! I can help you find products.",
  hours: "Mon–Sat 8am–8pm GMT",
  contactPhone: "+233 50 000 0000",
  contactEmail: "hello@akanadehye.com",
  tone: "friendly" as const,
};

async function smartReply(text: string) {
  return process.env.ANTHROPIC_API_KEY
    ? replyWithClaude(text, DEFAULT_PERSONA, [])
    : reply(text);
}

// Twilio WhatsApp webhook handler.
// Twilio sends form-encoded data and expects a TwiML <Response><Message> back.
// Docs: https://www.twilio.com/docs/whatsapp/quickstart
//
// Setup:
// 1. Create a Twilio account, join the WhatsApp Sandbox
// 2. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN env vars (optional, for outbound)
// 3. In Twilio Sandbox config, set "When a message comes in" to:
//    https://YOUR_HOST/api/bots/whatsapp  (POST)
//
// For Meta WhatsApp Cloud API users, see the GET handler below for webhook verification.

function twiml(text: string): string {
  // Escape XML special chars
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`;
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

  // Twilio: application/x-www-form-urlencoded
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData();
    const body = String(form.get("Body") ?? "");
    if (!body) {
      return new NextResponse(twiml("I didn't catch that. Try \"help\" to see options."), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Throttle before any Claude call. `From` is the sender's WhatsApp number.
    const from = String(form.get("From") ?? "twilio-unknown");
    const limit = checkBotRateLimit(`wa:${from}`);
    if (!limit.ok) {
      return new NextResponse(twiml(RATE_LIMIT_MESSAGES[limit.scope]), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    const botReply = await smartReply(body);
    return new NextResponse(twiml(botReply.text), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  // Meta WhatsApp Cloud API: application/json
  if (contentType.includes("application/json")) {
    type MetaEntry = {
      changes?: Array<{
        value?: {
          messages?: Array<{ from: string; text?: { body: string } }>;
          metadata?: { phone_number_id: string };
        };
      }>;
    };
    const data = (await req.json()) as { entry?: MetaEntry[] };
    const entry = data.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const message = change?.messages?.[0];

    if (!message?.text?.body || !change?.metadata?.phone_number_id) {
      return NextResponse.json({ ok: true });
    }

    const token = process.env.META_WHATSAPP_TOKEN;
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "META_WHATSAPP_TOKEN not configured" },
        { status: 500 }
      );
    }

    const sendMeta = (text: string) =>
      fetch(
        `https://graph.facebook.com/v18.0/${change.metadata!.phone_number_id}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: message.from,
            type: "text",
            text: { body: text },
          }),
        }
      ).catch(() => {});

    // Throttle before any Claude call.
    const limit = checkBotRateLimit(`wa:${message.from}`);
    if (!limit.ok) {
      await sendMeta(RATE_LIMIT_MESSAGES[limit.scope]);
      return NextResponse.json({ ok: true, rateLimited: limit.scope });
    }

    const botReply = await smartReply(message.text.body);
    await sendMeta(botReply.text);

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "Unsupported content-type" }, { status: 415 });
}

// Meta Cloud API webhook verification (GET with hub.challenge)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expected = process.env.META_WHATSAPP_VERIFY_TOKEN ?? "akanadehye-verify";
  if (mode === "subscribe" && token === expected && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({
    ok: true,
    info: "WhatsApp webhook. Configured: " +
      JSON.stringify({
        twilio: !!process.env.TWILIO_ACCOUNT_SID,
        meta: !!process.env.META_WHATSAPP_TOKEN,
      }),
  });
}
