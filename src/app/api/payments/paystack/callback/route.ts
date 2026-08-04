import { NextRequest, NextResponse } from "next/server";
import { verifyTransaction } from "@/lib/paystack";
import { markOrderPaidByReference, markOrderFailedByReference } from "@/lib/paymentFulfill";

export const dynamic = "force-dynamic";

// GET /api/payments/paystack/callback — Paystack redirects the customer here
// after payment. We verify server-side, mark the order, then bounce to the
// confirmation page. (The webhook is the authoritative backstop.)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const reference = url.searchParams.get("reference") || url.searchParams.get("trxref");
  const origin = url.origin;

  if (!reference) {
    return NextResponse.redirect(`${origin}/checkout/payment?error=no-reference`);
  }

  const result = await verifyTransaction(reference);
  if (result.ok && result.paid) {
    await markOrderPaidByReference(reference);
    return NextResponse.redirect(`${origin}/checkout/confirmation/${reference}?paid=1`);
  }

  await markOrderFailedByReference(reference);
  return NextResponse.redirect(`${origin}/checkout/confirmation/${reference}?paid=0`);
}
