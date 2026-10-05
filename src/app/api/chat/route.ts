import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { replyWithClaude, type ConversationMsg } from "@/lib/claudeBot";
import { DEFAULT_PERSONA } from "@/lib/botPersona";
import { hit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const schema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(4000),
      })
    )
    .max(20)
    .default([]),
});

/**
 * POST /api/chat — storefront assistant.
 *
 * Shares the brain the Telegram and WhatsApp bots use, so the shop, the bots
 * and the site all answer the same way about lead times and the pre-order
 * model. Falls back to the keyword brain when ANTHROPIC_API_KEY is absent,
 * so the widget still answers rather than erroring.
 */
export async function POST(req: NextRequest) {
  // This endpoint costs money per call, so it is rate limited harder than the
  // read-only routes.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "anon";
  const rl = hit(`chat:${ip}`, { limit: 20, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "You're sending messages very quickly — give it a moment." },
      { status: 429 }
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid message" }, { status: 400 });
  }

  const history: ConversationMsg[] = parsed.data.history;

  try {
    const result = await replyWithClaude(parsed.data.message, DEFAULT_PERSONA, history);
    return NextResponse.json({ ok: true, reply: result.text });
  } catch (err) {
    console.error("[chat] reply failed:", err);
    return NextResponse.json(
      { ok: false, error: "Sorry — I couldn't answer just then. Please try again." },
      { status: 500 }
    );
  }
}
