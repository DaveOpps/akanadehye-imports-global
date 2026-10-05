"use client";

import { useState } from "react";
import PreOrderCountdown from "./PreOrderCountdown";
import { formatGHS } from "@/lib/store";
import type { SupportChannel } from "@/lib/support";

type Found = {
  number: string;
  createdAt: string;
  itemName: string;
  itemSku: string | null;
  quantity: number;
  unitPrice: number;
  expectedArrival: string | null;
  shippingMethod: string;
  status: string;
  paymentStatus: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Awaiting confirmation",
  confirmed: "Confirmed — in the shipment",
  arrived: "Arrived in Ghana",
  fulfilled: "Collected",
  cancelled: "Cancelled",
};

export default function PreOrderTracker({ supportChannels }: { supportChannels: SupportChannel[] }) {
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Found | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const res = await fetch("/api/preorders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number, email }),
      });
      const data = await res.json();
      if (data.ok) setOrder(data.order);
      else setError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="po-number" className="block text-xs font-semibold text-[color:var(--brand-navy)] mb-1">
            Order number
          </label>
          <input
            id="po-number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="PRE-00042"
            required
            className="input"
          />
        </div>
        <div>
          <label htmlFor="po-email" className="block text-xs font-semibold text-[color:var(--brand-navy)] mb-1">
            Email used on the order
          </label>
          <input
            id="po-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="input"
          />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" disabled={loading} className="btn-gold disabled:opacity-60">
            {loading ? "Looking…" : "Track my pre-order"}
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="mt-4 text-sm text-[color:var(--brand-clay)] font-medium">
          {error}
        </p>
      )}

      {order && (
        <div className="mt-6 space-y-4">
          <PreOrderCountdown
            expectedArrival={order.expectedArrival}
            shippingMethod={order.shippingMethod}
            placedAt={order.createdAt}
            supportChannels={supportChannels}
          />

          <div className="rounded-xl border border-[color:var(--border)] bg-white p-4 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-[color:var(--muted)]">Order</span>
              <span className="font-mono font-semibold text-[color:var(--brand-navy)]">{order.number}</span>
            </div>
            <div className="flex justify-between gap-4 mt-2">
              <span className="text-[color:var(--muted)]">Item</span>
              <span className="font-medium text-right text-[color:var(--brand-navy)]">
                {order.quantity} × {order.itemName}
              </span>
            </div>
            <div className="flex justify-between gap-4 mt-2">
              <span className="text-[color:var(--muted)]">Total</span>
              <span className="font-semibold text-[color:var(--brand-navy)]">
                {formatGHS(order.unitPrice * order.quantity)}
              </span>
            </div>
            <div className="flex justify-between gap-4 mt-2">
              <span className="text-[color:var(--muted)]">Status</span>
              <span className="font-medium text-[color:var(--brand-navy)]">
                {STATUS_LABELS[order.status] ?? order.status}
              </span>
            </div>
            {order.paymentStatus !== "paid" && (
              <p className="mt-3 pt-3 border-t border-[color:var(--border)] text-xs text-[color:var(--brand-clay)]">
                Payment is still outstanding — your place in the shipment is secured once
                full payment is received, and the countdown runs from that point.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
