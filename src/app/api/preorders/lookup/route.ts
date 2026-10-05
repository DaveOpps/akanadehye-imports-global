import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const schema = z.object({
  number: z.string().min(1).max(40),
  email: z.string().email().max(200),
});

/**
 * POST /api/preorders/lookup — public pre-order tracking.
 *
 * Pre-order numbers are sequential (PRE-00001, PRE-00002, ...), so the number
 * alone is guessable. The customer's email is required as well, and the
 * response carries only what they need to see — never the stored name, phone
 * or note — so a correct guess still leaks nothing about anyone else.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "anon";
  const rl = hit(`preorder-lookup:${ip}`, { limit: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many lookups. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Enter your order number and the email you used." }, { status: 400 });
  }

  const number = parsed.data.number.trim().toUpperCase();
  const email = parsed.data.email.trim().toLowerCase();

  const order = await prisma.preOrder.findFirst({
    where: { number, customerEmail: { equals: email, mode: "insensitive" } },
    select: {
      number: true,
      createdAt: true,
      itemName: true,
      itemSku: true,
      quantity: true,
      unitPrice: true,
      expectedArrival: true,
      shippingMethod: true,
      status: true,
      paymentStatus: true,
    },
  });

  // Same response whether the number is wrong or the email doesn't match, so
  // this can't be used to confirm that an order number exists.
  if (!order) {
    return NextResponse.json(
      { ok: false, error: "We couldn't find a pre-order with that number and email." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, order });
}
