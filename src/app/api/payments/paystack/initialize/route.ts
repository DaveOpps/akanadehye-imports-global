import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { initializeTransaction, paystackConfigured } from "@/lib/paystack";
import { hit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const schema = z.object({
  reference: z.string().min(1).max(120),
  email: z.string().email(),
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
  const { reference, email, origin, metadata } = parsed.data;

  // The charge amount always comes from the order as stored server-side —
  // never from the request body. Otherwise a caller could initialize a real
  // order's reference with an arbitrary (lower) amount, pay that instead,
  // and have the order marked fully paid once Paystack confirms the charge.
  const order = await prisma.order.findUnique({ where: { id: reference } });
  if (!order) {
    return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  }
  if (order.paymentStatus === "paid") {
    return NextResponse.json({ ok: false, error: "Order is already paid" }, { status: 409 });
  }

  const result = await initializeTransaction({
    email,
    amountGhs: order.total,
    reference,
    callbackUrl: `${origin}/api/payments/paystack/callback`,
    metadata,
  });
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 502 });

  return NextResponse.json({ ok: true, authorizationUrl: result.authorizationUrl, reference: result.reference });
}
