import { NextRequest, NextResponse } from "next/server";
import { reply, type Persona } from "@/lib/botBrain";
import { replyWithClaude, type ConversationMsg } from "@/lib/claudeBot";

const DEFAULTS = {
  shopName: "Akanadehye",
  greeting: "👋 Welcome to Akanadehye! I can help you find products.",
  hours: "Mon–Sat 8am–8pm GMT",
  contactPhone: "+233 50 000 0000",
  contactEmail: "hello@akanadehye.com",
  tone: "friendly" as const,
};

export async function POST(req: NextRequest) {
  const { message, persona, history } = (await req.json()) as {
    message?: string;
    persona?: Persona;
    history?: ConversationMsg[];
  };
  if (!message) return NextResponse.json({ ok: false, error: "message required" }, { status: 400 });

  const merged = { ...DEFAULTS, ...(persona ?? {}) };

  // If Claude is configured, use it. Otherwise fall back to pattern matching.
  if (process.env.ANTHROPIC_API_KEY) {
    const r = await replyWithClaude(message, merged, history ?? []);
    return NextResponse.json({ ok: true, reply: r, brain: "claude" });
  }

  const r = await reply(message, persona);
  return NextResponse.json({ ok: true, reply: r, brain: "pattern" });
}
