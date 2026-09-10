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
    await markOrderPaidByReference(reference, result.amountGhs);
    return NextResponse.redirect(`${origin}/checkout/confirmation/${reference}?paid=1`);
  }

  if (result.ok && !result.paid) {
    // Paystack confirms the transaction did not succeed (failed/abandoned).
    await markOrderFailedByReference(reference);
    return NextResponse.redirect(`${origin}/checkout/confirmation/${reference}?paid=0`);
  }

  // Verification itself errored (network/API issue) — we don't know whether
  // the payment actually went through, so don't mark the order failed. The
  // webhook is the authoritative backstop and will catch up when it arrives.
  return NextResponse.redirect(`${origin}/checkout/confirmation/${reference}?paid=unknown`);
}
