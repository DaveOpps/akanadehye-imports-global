import "server-only";
import crypto from "crypto";

/**
 * Minimal Paystack client (server-side). Uses the secret key only — the
 * customer completes payment on Paystack's hosted checkout, so no card/MoMo
 * data ever touches our servers (PCI-safe). Supports Mobile Money, cards,
 * bank and USSD, settling in GHS.
 */

const BASE = "https://api.paystack.co";

export function paystackConfigured(): boolean {
  return (process.env.PAYSTACK_SECRET_KEY ?? "").startsWith("sk_");
}

function secretKey(): string {
  const k = process.env.PAYSTACK_SECRET_KEY;
  if (!k) throw new Error("PAYSTACK_SECRET_KEY not configured");
  return k;
}

export type InitInput = {
  email: string;
  amountGhs: number;
  reference: string; // we use the order id
  callbackUrl: string;
  metadata?: Record<string, unknown>;
};
export type InitResult =
  | { ok: true; authorizationUrl: string; reference: string }
  | { ok: false; error: string };

export async function initializeTransaction(input: InitInput): Promise<InitResult> {
  try {
    const res = await fetch(`${BASE}/transaction/initialize`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secretKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: input.email,
        amount: Math.round(input.amountGhs * 100), // GHS → pesewas
        currency: "GHS",
        reference: input.reference,
        callback_url: input.callbackUrl,
        channels: ["card", "mobile_money", "bank", "ussd", "bank_transfer", "qr"],
        metadata: input.metadata ?? {},
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.status) return { ok: false, error: data.message ?? "Failed to initialize payment" };
    return { ok: true, authorizationUrl: data.data.authorization_url, reference: data.data.reference };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export type VerifyResult =
  | { ok: true; paid: boolean; status: string; amountGhs: number; currency: string; reference: string; channel?: string }
  | { ok: false; error: string };

export async function verifyTransaction(reference: string): Promise<VerifyResult> {
  try {
    const res = await fetch(`${BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secretKey()}` },
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok || !data.status) return { ok: false, error: data.message ?? "Verification failed" };
    const d = data.data;
    return {
      ok: true,
      paid: d.status === "success",
      status: d.status,
      amountGhs: (d.amount ?? 0) / 100,
      currency: d.currency,
      reference: d.reference,
      channel: d.channel,
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Verify the `x-paystack-signature` header (HMAC-SHA512 of the raw body with the secret key). */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key || !signature) return false;
  const hash = crypto.createHmac("sha512", key).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  } catch {
    return false;
  }
}
