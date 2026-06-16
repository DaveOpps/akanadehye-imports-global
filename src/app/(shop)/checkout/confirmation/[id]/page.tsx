"use client";

import Link from "next/link";
import Image from "next/image";
import { use, useEffect, useState } from "react";
import { useOrders, shippingLabel, paymentLabel, statusLabel, type Order } from "@/lib/orders";
import { formatPrice } from "@/lib/products";

type Params = Promise<{ id: string }>;

export default function ConfirmationPage({ params }: { params: Params }) {
  const { id } = use(params);
  const { items, hydrated } = useOrders();
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
        <p className="mt-2 text-[color:var(--muted)]">
          We couldn&apos;t find this order in your browser. It may have been on a different device.
        </p>
        <Link href="/products" className="mt-6 btn-gold inline-flex">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-5 lg:px-8 py-10 lg:py-14">
      {/* Success banner */}
      <div className="text-center mb-10">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--brand-teal)] text-white mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Order placed!</h1>
        <p className="mt-2 text-[color:var(--muted)]">
          Thank you, {order.address.fullName}. We&apos;ll send a confirmation to <strong>{order.address.email}</strong>.
        </p>
        <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-full bg-[color:var(--brand-cream)] text-sm">
          <span className="text-[color:var(--muted)]">Order number:</span>
          <span className="font-mono font-bold">{order.number}</span>
          <span className="text-[color:var(--border)]">·</span>
          <span className="badge badge-amber">{statusLabel(order.status)}</span>
        </div>
      </div>

      {/* Receipt */}
      <div className="card space-y-5">
        <header className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-bold text-lg">Receipt</h2>
            <p className="text-xs text-[color:var(--muted)]">
              {new Date(order.createdAt).toLocaleString("en-GH")} · Ref {order.paymentReference}
            </p>
          </div>
          <button onClick={() => window.print()} className="btn-outline text-sm">
            Print receipt
          </button>
        </header>

        <section>
          <h3 className="text-xs uppercase tracking-wider text-[color:var(--muted)] font-semibold mb-2">Items</h3>
          <ul className="space-y-3 divide-y divide-[color:var(--border)]">
            {order.items.map((i) => (
              <li key={i.id} className="pt-3 first:pt-0 flex gap-3 items-center">
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
        </section>

        <section className="border-t border-[color:var(--border)] pt-4">
          <dl className="space-y-1.5 text-sm">
            <Row label="Subtotal" value={formatPrice(order.subtotal)} />
            {order.discount > 0 && (
              <Row label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`} value={`−${formatPrice(order.discount)}`} accent="clay" />
            )}
            <Row label={`Shipping · ${shippingLabel(order.shippingMethod)}`} value={order.shipping === 0 ? "Free" : formatPrice(order.shipping)} />
            <div className="flex justify-between text-base pt-2 border-t border-[color:var(--border)]">
              <dt className="font-bold">Total paid</dt>
              <dd className="font-bold">{formatPrice(order.total)}</dd>
            </div>
            <div className="text-xs text-[color:var(--muted)] pt-1">via {paymentLabel(order.paymentMethod)}</div>
          </dl>
        </section>

        <section className="border-t border-[color:var(--border)] pt-4 grid sm:grid-cols-2 gap-4">
          <div>
            <h3 className="text-xs uppercase tracking-wider text-[color:var(--muted)] font-semibold mb-2">Shipping to</h3>
            <div className="text-sm space-y-0.5">
              <div className="font-semibold">{order.address.fullName}</div>
              <div>{order.address.address}</div>
              <div>{order.address.city}, {order.address.region}</div>
              <div>{order.address.country}</div>
            </div>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wider text-[color:var(--muted)] font-semibold mb-2">Contact</h3>
            <div className="text-sm space-y-0.5">
              <div>{order.address.phone}</div>
              <div>{order.address.email}</div>
            </div>
          </div>
        </section>
      </div>

      {/* CTA */}
      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <Link href="/orders" className="btn-outline">
          View all orders
        </Link>
        <Link href="/products" className="btn-gold">
          Continue shopping →
        </Link>
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
