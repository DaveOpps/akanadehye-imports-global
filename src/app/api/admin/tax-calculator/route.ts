import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hit } from "@/lib/rateLimit";
import { computeTaxBreakdown, taxChat, type TaxCalcInput, type ChatMsg, type TaxBreakdown } from "@/lib/taxBrain";
import { getUsageStats } from "@/lib/usageMeter";

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
  // Base64 product photos (data URLs). Capped so the request body stays sane.
  images: z.array(z.string().max(1_500_000)).max(6).optional(),
});

const chatSchema = z.object({
  mode: z.literal("chat"),
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) })).min(1).max(30),
  context: z.any().optional(),
});

const lineItemSchema = z.object({
  label: z.string(),
  ratePercent: z.number().nullable().optional(),
  amountGhs: z.number(),
  note: z.string().optional(),
});

const saveSchema = z.object({
  mode: z.literal("save"),
  input: calcSchema.omit({ mode: true }),
  result: z.object({
    hsCodeGuess: z.string(),
    customsValueGhs: z.number(),
    totalTaxesGhs: z.number(),
    totalLandedCostGhs: z.number(),
    effectiveTaxRatePercent: z.number(),
    lineItems: z.array(lineItemSchema),
    assumptions: z.string().optional(),
  }),
});

const bodySchema = z.union([calcSchema, chatSchema, saveSchema]);

async function requireSuperAdmin() {
  const session = await auth();
  return session?.user as { role?: string; id?: string; email?: string } | undefined;
}

// GET /api/admin/tax-calculator — super_admin. Default: list saved estimates.
// ?view=usage returns the live session usage/cost meter for the tax assistant.
export async function GET(req: NextRequest) {
  const user = await requireSuperAdmin();
  if (user?.role !== "super_admin") {
    return NextResponse.json({ ok: false, error: "Restricted to the super admin." }, { status: 403 });
  }

  if (new URL(req.url).searchParams.get("view") === "usage") {
    return NextResponse.json({ ok: true, usage: getUsageStats() });
  }

  const estimates = await prisma.taxEstimate.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({
    ok: true,
    estimates: estimates.map((e) => ({ ...e, lineItems: JSON.parse(e.lineItems) })),
  });
}

// POST /api/admin/tax-calculator — super_admin only.
// modes: "calculate" | "chat" | "save"
export async function POST(req: NextRequest) {
  const user = await requireSuperAdmin();
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

  if (parsed.data.mode === "save") {
    const { input, result } = parsed.data;
    const saved = await prisma.taxEstimate.create({
      data: {
        createdBy: user.email ?? null,
        productDescription: input.productDescription,
        category: input.category ?? null,
        originCountry: input.originCountry,
        inputValue: input.value,
        inputCurrency: input.currency,
        exchangeRate: input.exchangeRate ?? null,
        freight: input.freight ?? null,
        insurance: input.insurance ?? null,
        quantity: input.quantity ?? null,
        hsCodeGuess: result.hsCodeGuess,
        customsValueGhs: result.customsValueGhs,
        totalTaxesGhs: result.totalTaxesGhs,
        totalLandedCostGhs: result.totalLandedCostGhs,
        effectiveTaxRatePercent: result.effectiveTaxRatePercent,
        lineItems: JSON.stringify(result.lineItems),
        assumptions: result.assumptions ?? null,
        imageUrl: input.images?.[0] ?? null,
      },
    });
    return NextResponse.json({ ok: true, id: saved.id });
  }

  // chat
  const reply = await taxChat(parsed.data.messages as ChatMsg[], (parsed.data.context ?? null) as TaxBreakdown | null);
  return NextResponse.json({ ok: true, reply });
}
