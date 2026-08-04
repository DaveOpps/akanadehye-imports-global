import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/paystack";
import { markOrderPaidByReference } from "@/lib/paymentFulfill";

export const dynamic = "force-dynamic";

// POST /api/payments/paystack/webhook — the authoritative payment confirmation.
// Fires even if the customer closes the browser before the callback runs.
// Configure this URL in the Paystack dashboard (Settings → API Keys & Webhooks).
export async function POST(req: NextRequest) {
  const raw = await req.text(); // raw body required for signature verification
  const signature = req.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  if (event.event === "charge.success" && event.data?.reference) {
    await markOrderPaidByReference(event.data.reference);
  }

  // Always 200 so Paystack stops retrying (we've recorded what we can).
  return NextResponse.json({ ok: true });
}
