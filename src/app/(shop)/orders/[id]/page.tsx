"use client";

import Link from "next/link";
import Image from "next/image";
import { use, useEffect, useState } from "react";
import { useOrders, shippingLabel, paymentLabel, statusLabel, type Order } from "@/lib/orders";
import { formatPrice } from "@/lib/products";

type Params = Promise<{ id: string }>;

const STATUS_FLOW: Order["status"][] = ["pending", "confirmed", "shipped", "delivered"];

export default function OrderDetailPage({ params }: { params: Params }) {
  const { id } = use(params);
  const { items, hydrated, update } = useOrders();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (hydrated) {
      setOrder(items.find((o) => o.id === id) ?? null);
    }
  }, [hydrated, items, id]);

  if (!hydrated) {
    return (
      <div className="max-w-4xl mx-auto px-5 lg:px-8 py-16 text-center text-sm text-[color:var(--muted)]">
        Loading order…
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-5 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold">Order not found</h1>
        <Link href="/orders" className="mt-4 inline-block text-sm font-semibold text-[color:var(--brand-navy)] hover:underline">
          ← Back to orders
        </Link>
      </div>
    );
  }

  const currentIdx = STATUS_FLOW.indexOf(order.status);

  function cancel() {
    if (confirm(`Cancel order ${order!.number}?`)) {
      update(order!.id, { status: "cancelled" });
    }
  }

  function advance() {
    if (currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1) {
      update(order!.id, { status: STATUS_FLOW[currentIdx + 1] });
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-5 lg:px-8 py-10 lg:py-14">
      <nav className="text-xs text-[color:var(--muted)] mb-3 flex items-center gap-1.5">
        <Link href="/" className="hover:text-[color:var(--brand-navy)]">Home</Link>
        <span className="text-[color:var(--border)]">/</span>
        <Link href="/orders" className="hover:text-[color:var(--brand-navy)]">Orders</Link>
        <span className="text-[color:var(--border)]">/</span>
        <span className="text-[color:var(--brand-navy)] font-medium font-mono">{order.number}</span>
      </nav>

      <header className="mb-6 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight font-mono">{order.number}</h1>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Placed on {new Date(order.createdAt).toLocaleString("en-GH")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {order.status !== "cancelled" && order.status !== "delivered" && (
            <>
              <button onClick={advance} className="btn-outline text-sm">
                Advance status
              </button>
              <button onClick={cancel} className="text-sm font-semibold text-[color:var(--brand-clay)] hover:underline">
                Cancel order
              </button>
            </>
          )}
        </div>
      </header>

      {/* Progress timeline */}
      {order.status !== "cancelled" ? (
        <div className="mb-8 grid grid-cols-4 gap-1.5">
          {STATUS_FLOW.map((s, i) => {
            const reached = currentIdx >= i;
            const active = currentIdx === i;
            return (
              <div key={s} className="flex flex-col items-center gap-1">
                <div
                  className={`h-1.5 w-full rounded-full ${
                    reached ? (active ? "bg-[color:var(--brand-gold)]" : "bg-[color:var(--brand-teal)]") : "bg-[color:var(--border)]"
                  }`}
                />
                <span
                  className={`text-[10px] uppercase tracking-wider ${
                    reached ? "text-[color:var(--brand-navy)] font-semibold" : "text-[color:var(--muted)]"
                  }`}
                >
                  {statusLabel(s)}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mb-8 rounded-xl border border-[color:var(--brand-clay)]/30 bg-[color:var(--brand-clay)]/5 p-4 text-sm text-[color:var(--brand-clay)] font-semibold">
          This order has been cancelled.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Items */}
        <section className="card">
          <h2 className="font-bold text-lg mb-4">Items</h2>
          <ul className="space-y-3 divide-y divide-[color:var(--border)]">
            {order.items.map((i) => (
              <li key={i.id} className="pt-3 first:pt-0 flex gap-3 items-center">
                <Link href={`/products/${i.id}`} className="relative h-16 w-16 shrink-0 bg-[color:var(--brand-cream)] rounded-lg overflow-hidden">
                  <Image src={i.thumbnail} alt={i.title} fill sizes="64px" className="object-contain p-1" unoptimized />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${i.id}`} className="text-sm font-medium hover:text-[color:var(--brand-clay)] line-clamp-2">
                    {i.title}
                  </Link>
                  <div className="text-xs text-[color:var(--muted)]">{i.quantity} × {formatPrice(i.price)}</div>
                </div>
                <div className="text-sm font-bold">{formatPrice(i.quantity * i.price)}</div>
              </li>
            ))}
          </ul>
        </section>

        <aside className="space-y-4">
          <div className="card">
            <h3 className="text-xs uppercase tracking-wider text-[color:var(--muted)] font-semibold mb-3">Totals</h3>
            <dl className="space-y-1.5 text-sm">
              <Row label="Subtotal" value={formatPrice(order.subtotal)} />
              {order.discount > 0 && (
                <Row label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`} value={`−${formatPrice(order.discount)}`} accent="clay" />
              )}
              <Row label="Shipping" value={order.shipping === 0 ? "Free" : formatPrice(order.shipping)} />
              <div className="flex justify-between text-base pt-2 border-t border-[color:var(--border)]">
                <dt className="font-bold">Total</dt>
                <dd className="font-bold">{formatPrice(order.total)}</dd>
              </div>
            </dl>
            <div className="mt-3 text-xs text-[color:var(--muted)]">
              {paymentLabel(order.paymentMethod)} · {shippingLabel(order.shippingMethod)}
            </div>
            {order.paymentReference && (
              <div className="mt-1 text-xs text-[color:var(--muted)] font-mono">Ref {order.paymentReference}</div>
            )}
          </div>

          <div className="card">
            <h3 className="text-xs uppercase tracking-wider text-[color:var(--muted)] font-semibold mb-3">Ship to</h3>
            <div className="text-sm space-y-0.5">
              <div className="font-semibold">{order.address.fullName}</div>
              <div>{order.address.address}</div>
              <div>{order.address.city}, {order.address.region}</div>
              <div>{order.address.country}</div>
              <div className="text-[color:var(--muted)] mt-2">{order.address.phone}</div>
              <div className="text-[color:var(--muted)]">{order.address.email}</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
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
