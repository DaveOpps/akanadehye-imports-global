"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useOrders, shippingLabel, paymentLabel, statusLabel, type Order } from "@/lib/orders";
import { formatPrice } from "@/lib/products";

type Params = Promise<{ id: string }>;

const STATUSES: Order["status"][] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
const STATUS_FLOW: Order["status"][] = ["pending", "confirmed", "shipped", "delivered"];

const STATUS_COLORS: Record<Order["status"], string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminOrderDetailPage({ params }: { params: Params }) {
  const { id } = use(params);
  const { items, hydrated, update } = useOrders();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (hydrated) setOrder(items.find((o) => o.id === id) ?? null);
  }, [hydrated, items, id]);

  if (!hydrated) {
    return <div className="text-sm text-[color:var(--muted)] py-10">Loading order…</div>;
  }

  if (!order) {
    return (
      <div className="py-16 text-center">
        <div className="text-4xl mb-3">🔍</div>
        <h2 className="text-xl font-bold text-[color:var(--brand-navy)]">Order not found</h2>
        <Link href="/admin/orders" className="mt-4 inline-block text-sm font-semibold text-[color:var(--brand-navy)] hover:underline">
          ← Back to orders
        </Link>
      </div>
    );
  }

  const currentIdx = STATUS_FLOW.indexOf(order.status);

  return (
    <div className="space-y-6">
      {/* Breadcrumb + header */}
      <div>
        <nav className="text-xs text-[color:var(--muted)] mb-3 flex items-center gap-1.5">
          <Link href="/admin" className="hover:text-[color:var(--brand-navy)]">Dashboard</Link>
          <span>/</span>
          <Link href="/admin/orders" className="hover:text-[color:var(--brand-navy)]">Orders</Link>
          <span>/</span>
          <span className="text-[color:var(--brand-navy)] font-mono font-medium">{order.number}</span>
        </nav>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold font-mono text-[color:var(--brand-navy)]">{order.number}</h1>
              <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
                {statusLabel(order.status)}
              </span>
              {order.customerEmail && (
                <span className="text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                  ✓ Registered customer
                </span>
              )}
            </div>
            <p className="text-sm text-[color:var(--muted)] mt-1">
              Placed on {new Date(order.createdAt).toLocaleString("en-GH")}
            </p>
          </div>

          {/* Status changer */}
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-xs font-semibold text-[color:var(--muted)]">Update status:</label>
            <select
              value={order.status}
              onChange={(e) => update(order.id, { status: e.target.value as Order["status"] })}
              className="input !w-auto text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{statusLabel(s)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {order.status !== "cancelled" && (
        <div className="grid grid-cols-4 gap-1.5">
          {STATUS_FLOW.map((s, i) => {
            const reached = currentIdx >= i;
            const active = currentIdx === i;
            return (
              <div key={s} className="flex flex-col items-center gap-1">
                <div className={`h-1.5 w-full rounded-full ${reached ? (active ? "bg-[color:var(--brand-gold)]" : "bg-[color:var(--brand-teal,#0d9488)]") : "bg-[color:var(--border)]"}`} />
                <span className={`text-[10px] uppercase tracking-wider ${reached ? "text-[color:var(--brand-navy)] font-semibold" : "text-[color:var(--muted)]"}`}>
                  {statusLabel(s)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Items */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[color:var(--border)] p-5 shadow-sm">
            <h2 className="font-bold text-[color:var(--brand-navy)] mb-4">
              Items ({order.items.reduce((n, i) => n + i.quantity, 0)})
            </h2>
            <ul className="space-y-3 divide-y divide-[color:var(--border)]">
              {order.items.map((item) => (
                <li key={item.id} className="pt-3 first:pt-0 flex gap-3 items-center">
                  <div className="relative h-16 w-16 shrink-0 bg-[color:var(--brand-cream)] rounded-lg overflow-hidden border border-[color:var(--border)]">
                    <Image src={item.thumbnail} alt={item.title} fill sizes="64px" className="object-contain p-1" unoptimized />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[color:var(--brand-navy)] line-clamp-2">{item.title}</div>
                    <div className="text-xs text-[color:var(--muted)] mt-0.5">{item.quantity} × {formatPrice(item.price)}</div>
                  </div>
                  <div className="text-sm font-bold text-[color:var(--brand-navy)]">{formatPrice(item.quantity * item.price)}</div>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer info (if registered) */}
          {order.customerEmail && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-green-600">
                  <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Registered account</span>
              </div>
              <div className="text-sm text-green-800 font-medium">{order.customerEmail}</div>
              <Link href="/admin/customers" className="text-xs text-green-700 hover:underline mt-1 inline-block">
                View in Customers →
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Totals */}
          <div className="bg-white rounded-xl border border-[color:var(--border)] p-5 shadow-sm">
            <h3 className="text-xs uppercase tracking-wider text-[color:var(--muted)] font-semibold mb-3">Order totals</h3>
            <dl className="space-y-1.5 text-sm">
              <Row label="Subtotal" value={formatPrice(order.subtotal)} />
              {order.discount > 0 && (
                <Row label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`} value={`−${formatPrice(order.discount)}`} accent />
              )}
              <Row label="Shipping" value={order.shipping === 0 ? "Free" : formatPrice(order.shipping)} />
              <div className="flex justify-between text-base pt-2 border-t border-[color:var(--border)] font-bold">
                <dt>Total</dt>
                <dd>{formatPrice(order.total)}</dd>
              </div>
            </dl>
            <div className="mt-3 pt-3 border-t border-[color:var(--border)] text-xs text-[color:var(--muted)] space-y-1">
              <div>{paymentLabel(order.paymentMethod)} · {shippingLabel(order.shippingMethod)}</div>
              {order.paymentReference && <div className="font-mono">Ref: {order.paymentReference}</div>}
            </div>
          </div>

          {/* Shipping address */}
          <div className="bg-white rounded-xl border border-[color:var(--border)] p-5 shadow-sm">
            <h3 className="text-xs uppercase tracking-wider text-[color:var(--muted)] font-semibold mb-3">Ship to</h3>
            <div className="text-sm space-y-0.5 text-[color:var(--brand-navy)]">
              <div className="font-semibold">{order.address.fullName}</div>
              <div>{order.address.address}</div>
              <div>{order.address.city}, {order.address.region}</div>
              <div>{order.address.country}</div>
              <div className="text-[color:var(--muted)] mt-2">{order.address.phone}</div>
              <div className="text-[color:var(--muted)]">{order.address.email}</div>
              {order.address.notes && (
                <div className="mt-2 text-xs italic text-[color:var(--muted)]">"{order.address.notes}"</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-[color:var(--muted)]">{label}</dt>
      <dd className={`font-semibold ${accent ? "text-[color:var(--brand-clay)]" : ""}`}>{value}</dd>
    </div>
  );
}
