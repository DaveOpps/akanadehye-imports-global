"use client";

import Link from "next/link";
import Image from "next/image";
import { useOrders, statusLabel, type Order } from "@/lib/orders";
import { formatPrice } from "@/lib/products";

export default function OrdersPage() {
  const { items, hydrated } = useOrders();

  return (
    <div className="max-w-5xl mx-auto px-5 lg:px-8 py-10 lg:py-14">
      <header className="mb-8">
        <nav className="text-xs text-[color:var(--muted)] mb-3 flex items-center gap-1.5">
          <Link href="/" className="hover:text-[color:var(--brand-navy)]">Home</Link>
          <span className="text-[color:var(--border)]">/</span>
          <span className="text-[color:var(--brand-navy)] font-medium">Orders</span>
        </nav>
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Your orders</h1>
        <p className="mt-1 text-sm text-[color:var(--muted)]">
          Past purchases are stored locally in this browser.
        </p>
      </header>

      {!hydrated ? (
        <div className="text-sm text-[color:var(--muted)]">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[color:var(--border)] rounded-2xl bg-[color:var(--brand-cream)]/40">
          <div className="text-5xl mb-3">📦</div>
          <h2 className="text-xl font-semibold">No orders yet</h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">When you place an order it&apos;ll appear here.</p>
          <Link href="/products" className="mt-6 btn-gold inline-flex">
            Start shopping →
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </ul>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const statusClass: Record<Order["status"], string> = {
    pending: "badge-amber",
    confirmed: "badge-blue",
    shipped: "badge-blue",
    delivered: "badge-green",
    cancelled: "badge-red",
  };

  return (
    <Link
      href={`/orders/${order.id}`}
      className="block bg-white border border-[color:var(--border)] rounded-xl p-5 hover:shadow-lg transition"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-mono font-bold text-sm">{order.number}</div>
            <span className={`badge ${statusClass[order.status]}`}>{statusLabel(order.status)}</span>
          </div>
          <div className="text-xs text-[color:var(--muted)] mt-1">
            {new Date(order.createdAt).toLocaleDateString("en-GH", { day: "2-digit", month: "short", year: "numeric" })} ·{" "}
            {order.items.length} item{order.items.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">{formatPrice(order.total)}</div>
          <div className="text-xs text-[color:var(--muted)]">View details →</div>
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {order.items.slice(0, 6).map((i) => (
          <div
            key={i.id}
            className="relative h-14 w-14 shrink-0 bg-[color:var(--brand-cream)] rounded-lg overflow-hidden border border-[color:var(--border)]"
          >
            <Image src={i.thumbnail} alt={i.title} fill sizes="56px" className="object-contain p-1" unoptimized />
          </div>
        ))}
        {order.items.length > 6 && (
          <div className="h-14 w-14 shrink-0 rounded-lg bg-[color:var(--brand-cream)] inline-flex items-center justify-center text-xs font-semibold text-[color:var(--muted)] border border-[color:var(--border)]">
            +{order.items.length - 6}
          </div>
        )}
      </div>
    </Link>
  );
}
