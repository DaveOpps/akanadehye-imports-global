"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/CartContext";
import { formatPrice } from "@/lib/products";
import {
  useCheckoutDraft,
  useOrders,
  shippingCost,
  shippingLabel,
  paymentLabel,
  nextOrderNumber,
  uid,
  type ShippingAddress,
  type Order,
} from "@/lib/orders";

export default function ReviewStep() {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const { draft, clearDraft, hydrated } = useCheckoutDraft();
  const { items: existingOrders, add: addOrder } = useOrders();
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!draft.address?.fullName) {
      router.replace("/checkout/address");
      return;
    }
    if (!draft.shippingMethod || !draft.paymentMethod) {
      router.replace("/checkout/payment");
      return;
    }
    if (items.length === 0) {
      router.replace("/cart");
    }
  }, [hydrated, draft, items.length, router]);

  if (!hydrated || !draft.address?.fullName || !draft.shippingMethod || !draft.paymentMethod) {
    return <div className="text-sm text-[color:var(--muted)]">Loading…</div>;
  }

  const ship = shippingCost(draft.shippingMethod, subtotal);
  const discount = draft.couponPct ? (subtotal * draft.couponPct) / 100 : 0;
  const total = Math.max(0, subtotal - discount + ship);

  async function placeOrder() {
    setPlacing(true);
    // Simulate processing
    await new Promise((r) => setTimeout(r, 600));

    const order: Order = {
      id: uid("ord"),
      number: nextOrderNumber(existingOrders),
      createdAt: new Date().toISOString(),
      status: "pending",
      items: [...items],
      subtotal,
      shipping: ship,
      tax: 0,
      discount,
      total,
      address: draft.address as ShippingAddress,
      shippingMethod: draft.shippingMethod!,
      paymentMethod: draft.paymentMethod!,
      paymentReference: `${draft.paymentMethod?.toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      couponCode: draft.couponCode,
    };

    addOrder(order);
    clear();
    clearDraft();

    router.push(`/checkout/confirmation/${order.id}`);
  }

  const addr = draft.address as ShippingAddress;

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-8">
      <div className="space-y-6">
        <ReviewBlock title="Shipping address" editHref="/checkout/address">
          <div className="text-sm space-y-0.5">
            <div className="font-semibold">{addr.fullName}</div>
            <div>{addr.address}</div>
            <div>{addr.city}, {addr.region}</div>
            <div>{addr.country}</div>
            <div className="text-[color:var(--muted)] mt-2">{addr.phone} · {addr.email}</div>
            {addr.notes && (
              <div className="mt-2 text-xs text-[color:var(--muted)] italic">&ldquo;{addr.notes}&rdquo;</div>
            )}
          </div>
        </ReviewBlock>

        <ReviewBlock title="Shipping method" editHref="/checkout/payment">
          <div className="flex justify-between text-sm">
            <span>{shippingLabel(draft.shippingMethod)}</span>
            <span className="font-semibold">{ship === 0 ? "Free" : formatPrice(ship)}</span>
          </div>
        </ReviewBlock>

        <ReviewBlock title="Payment method" editHref="/checkout/payment">
          <div className="text-sm">{paymentLabel(draft.paymentMethod)}</div>
        </ReviewBlock>

        <ReviewBlock title={`Items (${items.length})`} editHref="/cart">
          <ul className="space-y-3">
            {items.map((i) => (
              <li key={i.id} className="flex gap-3 items-center">
                <div className="relative h-14 w-14 shrink-0 bg-[color:var(--brand-cream)] rounded-lg overflow-hidden">
                  <Image src={i.thumbnail} alt={i.title} fill sizes="56px" className="object-contain p-1" unoptimized />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{i.title}</div>
                  <div className="text-xs text-[color:var(--muted)]">{i.quantity} × {formatPrice(i.price)}</div>
                </div>
                <div className="text-sm font-bold">{formatPrice(i.quantity * i.price)}</div>
              </li>
            ))}
          </ul>
        </ReviewBlock>
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start space-y-4">
        <div className="card">
          <h3 className="font-bold mb-3">Order total</h3>
          <dl className="space-y-1.5 text-sm">
            <Row label="Subtotal" value={formatPrice(subtotal)} />
            {discount > 0 && (
              <Row label={`Discount${draft.couponCode ? ` (${draft.couponCode})` : ""}`} value={`−${formatPrice(discount)}`} accent="clay" />
            )}
            <Row label="Shipping" value={ship === 0 ? "Free" : formatPrice(ship)} />
            <div className="flex justify-between text-base pt-2 border-t border-[color:var(--border)]">
              <dt className="font-bold">Total</dt>
              <dd className="font-bold">{formatPrice(total)}</dd>
            </div>
          </dl>
        </div>

        <button
          onClick={placeOrder}
          disabled={placing}
          className="w-full btn-gold justify-center disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {placing ? "Placing order…" : `Place order · ${formatPrice(total)}`}
        </button>

        <Link href="/checkout/payment" className="block text-center text-sm text-[color:var(--muted)] hover:text-[color:var(--brand-navy)]">
          ← Back to payment
        </Link>

        <p className="text-xs text-[color:var(--muted)] text-center">
          By placing this order you agree to our terms & conditions.
        </p>
      </aside>
    </div>
  );
}

function ReviewBlock({
  title,
  editHref,
  children,
}: {
  title: string;
  editHref: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold">{title}</h2>
        <Link href={editHref} className="text-xs font-semibold text-[color:var(--brand-navy)] hover:underline">
          Edit
        </Link>
      </div>
      {children}
    </section>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: "clay" }) {
  return (
    <div className="flex justify-between">
      <dt className="text-[color:var(--muted)]">{label}</dt>
      <dd className={`font-semibold ${accent === "clay" ? "text-[color:var(--brand-clay)]" : ""}`}>{value}</dd>
    </div>
  );
}
