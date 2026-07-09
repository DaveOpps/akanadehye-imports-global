import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { hit } from "@/lib/rateLimit";
import { computeTaxBreakdown, taxChat, type TaxCalcInput, type ChatMsg, type TaxBreakdown } from "@/lib/taxBrain";

export const dynamic = "force-dynamic";

const calcSchema = z.object({
  mode: z.literal("calculate"),
  productDescription: z.string().min(2).max(500),
  category: z.string().max(120).optional(),
  originCountry: z.string().min(2).max(120),
  value: z.number().positive().max(1_000_000_000),
  currency: z.enum(["USD", "GHS"]),
  exchangeRate: z.number().positive().max(1000).optional(),
  freight: z.number().min(0).max(1_000_000_000).optional(),
  insurance: z.number().min(0).max(1_000_000_000).optional(),
  quantity: z.number().int().min(1).max(1_000_000).optional(),
});

const chatSchema = z.object({
  mode: z.literal("chat"),
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) })).min(1).max(30),
  context: z.any().optional(),
});

const bodySchema = z.union([calcSchema, chatSchema]);

// POST /api/admin/tax-calculator — super_admin only. Estimates Ghana import
// taxes (mode: "calculate") or answers follow-up questions (mode: "chat").
export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role?: string; id?: string } | undefined;
  if (user?.role !== "super_admin") {
    return NextResponse.json({ ok: false, error: "This calculator is restricted to the super admin." }, { status: 403 });
  }

  // Guard the Anthropic spend: cap calls per super-admin.
  const rl = hit(`tax-calc:${user.id ?? "sa"}`, { limit: 30, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: "Too many requests — give it a moment." }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  if (parsed.data.mode === "calculate") {
    const { mode: _mode, ...input } = parsed.data;
    void _mode;
    if (input.currency === "USD" && !input.exchangeRate) {
      return NextResponse.json({ ok: false, error: "Provide an exchange rate (GHS per USD) when the value is in USD." }, { status: 400 });
    }
    const result = await computeTaxBreakdown(input as TaxCalcInput);
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  }

  // chat
  const reply = await taxChat(parsed.data.messages as ChatMsg[], (parsed.data.context ?? null) as TaxBreakdown | null);
  return NextResponse.json({ ok: true, reply });
}
