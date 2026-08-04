import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { initializeTransaction, paystackConfigured } from "@/lib/paystack";
import { hit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const schema = z.object({
  reference: z.string().min(1).max(120),
  email: z.string().email(),
  amountGhs: z.number().positive().max(100_000_000),
  origin: z.string().url(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// POST /api/payments/paystack/initialize — start a hosted Paystack checkout.
export async function POST(req: NextRequest) {
  if (!paystackConfigured()) {
    return NextResponse.json({ ok: false, error: "Online payment is not configured." }, { status: 503 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "anon";
  if (!hit(`paystack-init:${ip}`, { limit: 20, windowMs: 60_000 }).allowed) {
    return NextResponse.json({ ok: false, error: "Too many attempts — wait a moment." }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { reference, email, amountGhs, origin, metadata } = parsed.data;

  const result = await initializeTransaction({
    email,
    amountGhs,
    reference,
    callbackUrl: `${origin}/api/payments/paystack/callback`,
    metadata,
  });
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 502 });

  return NextResponse.json({ ok: true, authorizationUrl: result.authorizationUrl, reference: result.reference });
}
