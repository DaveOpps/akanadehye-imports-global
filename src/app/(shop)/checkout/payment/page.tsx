"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/CartContext";
import { formatPrice } from "@/lib/products";
import {
  useCheckoutDraft,
  shippingCost,
  shippingLabel,
  paymentLabel,
  type ShippingMethod,
  type CheckoutPaymentMethod,
} from "@/lib/orders";

const SHIPPING_OPTIONS: ShippingMethod[] = ["standard", "express", "pickup"];
const PAYMENT_OPTIONS: CheckoutPaymentMethod[] = ["mobile-money", "card", "bank-transfer", "cash-on-delivery"];

export default function PaymentStep() {
  const router = useRouter();
  const { items, subtotal } = useCart();
  const { draft, setDraft, hydrated } = useCheckoutDraft();

  const [shipping, setShipping] = useState<ShippingMethod>("standard");
  const [payment, setPayment] = useState<CheckoutPaymentMethod>("mobile-money");

  useEffect(() => {
    if (!hydrated) return;
    if (!draft.address?.fullName) {
      router.replace("/checkout/address");
      return;
    }
    if (items.length === 0) {
      router.replace("/cart");
      return;
    }
    if (draft.shippingMethod) setShipping(draft.shippingMethod);
    if (draft.paymentMethod) setPayment(draft.paymentMethod);
  }, [hydrated, draft, items.length, router]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setDraft({ shippingMethod: shipping, paymentMethod: payment });
    router.push("/checkout/review");
  }

  return (
    <form onSubmit={submit} className="grid lg:grid-cols-[1fr_320px] gap-8">
      <div className="space-y-6">
        {/* Shipping */}
        <section className="card space-y-4">
          <h2 className="font-bold text-lg">Shipping method</h2>
          <div className="space-y-2">
            {SHIPPING_OPTIONS.map((m) => {
              const cost = shippingCost(m, subtotal);
              const active = shipping === m;
              return (
                <button
                  type="button"
                  key={m}
                  onClick={() => setShipping(m)}
                  className={`w-full text-left flex items-center justify-between gap-4 px-4 py-3 rounded-lg border-2 transition ${
                    active
                      ? "border-[color:var(--brand-navy)] bg-[color:var(--brand-cream)]"
                      : "border-[color:var(--border)] hover:border-[color:var(--brand-navy)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-5 w-5 rounded-full border-2 inline-flex items-center justify-center ${
                        active ? "border-[color:var(--brand-navy)]" : "border-[color:var(--border)]"
                      }`}
                    >
                      {active && <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--brand-navy)]" />}
                    </span>
                    <div>
                      <div className="font-semibold text-sm">{shippingLabel(m)}</div>
                      {m === "standard" && subtotal < 50 && (
                        <div className="text-xs text-[color:var(--muted)]">Free over $50</div>
                      )}
                      {m === "pickup" && (
                        <div className="text-xs text-[color:var(--muted)]">Pick up from our Tema warehouse</div>
                      )}
                    </div>
                  </div>
                  <div className="font-bold">{cost === 0 ? "Free" : formatPrice(cost)}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Payment */}
        <section className="card space-y-4">
          <h2 className="font-bold text-lg">Payment method</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {PAYMENT_OPTIONS.map((m) => {
              const active = payment === m;
              return (
                <button
                  type="button"
                  key={m}
                  onClick={() => setPayment(m)}
                  className={`text-left flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition ${
                    active
                      ? "border-[color:var(--brand-navy)] bg-[color:var(--brand-cream)]"
                      : "border-[color:var(--border)] hover:border-[color:var(--brand-navy)]"
                  }`}
                >
                  <span
                    className={`h-5 w-5 rounded-full border-2 inline-flex items-center justify-center shrink-0 ${
                      active ? "border-[color:var(--brand-navy)]" : "border-[color:var(--border)]"
                    }`}
                  >
                    {active && <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--brand-navy)]" />}
                  </span>
                  <span className="font-semibold text-sm">{paymentLabel(m)}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-[color:var(--muted)]">
            For this demo, no real payment is taken. Wire Paystack / Hubtel in a later sprint to charge for real.
          </p>
        </section>
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="card">
          <h3 className="font-bold mb-3">Summary</h3>
          <dl className="space-y-1.5 text-sm">
            <Row label="Subtotal" value={formatPrice(subtotal)} />
            <Row label="Shipping" value={shippingCost(shipping, subtotal) === 0 ? "Free" : formatPrice(shippingCost(shipping, subtotal))} />
            <div className="flex justify-between text-base pt-2 border-t border-[color:var(--border)]">
              <dt className="font-bold">Total</dt>
              <dd className="font-bold">
                {formatPrice(subtotal + shippingCost(shipping, subtotal))}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-4 flex gap-2">
          <Link href="/checkout/address" className="btn-outline text-sm flex-1 justify-center">
            ← Back
          </Link>
          <button className="btn-gold text-sm flex-1 justify-center">
            Review →
          </button>
        </div>
      </aside>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-[color:var(--muted)]">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
