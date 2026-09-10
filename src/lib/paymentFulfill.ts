import "server-only";
import { prisma } from "./db";
import { sendOrderNotification } from "./notify";

/**
 * Idempotently mark an order paid by its reference (= order id). Called from
 * both the Paystack callback and the webhook — whichever arrives first wins;
 * the second is a no-op. Returns true if this call transitioned the order.
 *
 * `paidAmountGhs` is what Paystack actually confirms was charged — it must
 * match the order's stored total (within a pesewas-rounding tolerance)
 * before we'll mark it paid. Without this check, anyone who can drive a
 * real (even tiny) Paystack charge against an order's reference could get
 * that order marked fully paid regardless of what was actually collected.
 */
export async function markOrderPaidByReference(reference: string, paidAmountGhs: number): Promise<boolean> {
  const order = await prisma.order.findUnique({ where: { id: reference } }).catch(() => null);
  if (!order || order.paymentStatus === "paid") return false;

  if (Math.abs(paidAmountGhs - order.total) > 0.01) {
    console.error(
      `Paystack amount mismatch for order ${reference}: paid ${paidAmountGhs}, expected ${order.total} — not marking paid`
    );
    return false;
  }

  const updated = await prisma.order.update({
    where: { id: reference },
    data: {
      paymentStatus: "paid",
      status: order.status === "pending" ? "confirmed" : order.status,
      paymentReference: reference,
    },
  });

  const addr = (() => {
    try { return JSON.parse(updated.address) as { fullName?: string; email?: string }; } catch { return {}; }
  })();
  const email = updated.customerEmail ?? addr.email;
  if (email) {
    void sendOrderNotification({
      email,
      customerName: addr.fullName ?? "Customer",
      title: "Payment received ✅",
      body: `We've received your payment for order ${updated.number}. It's now confirmed and being prepared.`,
      orderId: updated.id,
      orderNumber: updated.number,
      status: "confirmed",
    }).catch(() => {});
  }
  return true;
}

/** Mark an order's payment failed (only if not already paid). */
export async function markOrderFailedByReference(reference: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: reference } }).catch(() => null);
  if (!order || order.paymentStatus === "paid") return;
  await prisma.order.update({ where: { id: reference }, data: { paymentStatus: "failed" } }).catch(() => {});
}
