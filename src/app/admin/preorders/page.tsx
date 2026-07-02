"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { formatPrice } from "@/lib/products";

type PreOrder = {
  id: string;
  createdAt: string;
  number: string;
  itemId: string | null;
  itemName: string;
  itemSku: string | null;
  quantity: number;
  unitPrice: number;
  expectedArrival: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  note: string | null;
  status: string;
};

const STATUSES = ["pending", "confirmed", "arrived", "fulfilled", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  arrived: "bg-indigo-100 text-indigo-800",
  fulfilled: "bg-green-100 text-green-800",
  cancelled: "bg-gray-200 text-gray-600",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function PreOrdersPage() {
  const [preorders, setPreorders] = useState<PreOrder[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/preorders", { cache: "no-store" });
      if (res.status === 401) { setError("You need admin access to view pre-orders."); return; }
      const data = await res.json();
      setPreorders(data.preorders ?? []);
      setError("");
    } catch {
      setError("Couldn't load pre-orders.");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function setStatus(id: string, status: Status) {
    setBusy(id);
    // optimistic
    setPreorders((prev) => prev?.map((p) => (p.id === id ? { ...p, status } : p)) ?? prev);
    try {
      await fetch(`/api/preorders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch {
      load(); // revert to server truth on failure
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this pre-order? This can't be undone.")) return;
    setBusy(id);
    setPreorders((prev) => prev?.filter((p) => p.id !== id) ?? prev);
    try {
      await fetch(`/api/preorders/${id}`, { method: "DELETE" });
    } catch {
      load();
    } finally {
      setBusy(null);
    }
  }

  const stats = useMemo(() => {
    const list = preorders ?? [];
    return {
      total: list.length,
      pending: list.filter((p) => p.status === "pending").length,
      active: list.filter((p) => p.status === "confirmed" || p.status === "arrived").length,
      value: list
        .filter((p) => p.status !== "cancelled")
        .reduce((n, p) => n + p.unitPrice * p.quantity, 0),
    };
  }, [preorders]);

  const visible = useMemo(
    () => (preorders ?? []).filter((p) => filter === "all" || p.status === filter),
    [preorders, filter]
  );

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Run shop" },
          { label: "Pre-orders" },
        ]}
        title="Pre-orders"
        subtitle="Reservations customers placed for pre-order items — reserve now, pay on arrival."
      />

      {error && <div className="card border-red-200 bg-red-50 text-red-800 text-sm mb-6">{error}</div>}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Total pre-orders" value={String(stats.total)} />
        <Kpi label="Awaiting action" value={String(stats.pending)} tone={stats.pending > 0 ? "clay" : "muted"} />
        <Kpi label="Confirmed / arrived" value={String(stats.active)} />
        <Kpi label="Reserved value" value={formatPrice(stats.value)} tone="navy" />
      </div>

      {/* Filter */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {(["all", ...STATUSES] as const).map((s) => {
          const count = s === "all" ? (preorders?.length ?? 0) : (preorders ?? []).filter((p) => p.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition ${
                filter === s
                  ? "bg-[color:var(--brand-navy)] text-white"
                  : "bg-white border border-[color:var(--border)] text-[color:var(--brand-navy)] hover:bg-[color:var(--brand-cream)]"
              }`}
            >
              {s} <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        {preorders === null ? (
          <div className="p-8 text-center text-sm text-[color:var(--muted)]">Loading…</div>
        ) : visible.length === 0 ? (
          <div className="p-10 text-center text-sm text-[color:var(--muted)]">
            {filter === "all" ? "No pre-orders yet. They'll appear here when customers reserve pre-order items." : `No ${filter} pre-orders.`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-[color:var(--muted)] bg-[color:var(--brand-cream)]/50 border-b border-[color:var(--border)]">
                  <th className="px-4 py-2.5 font-semibold">Ref / Date</th>
                  <th className="px-4 py-2.5 font-semibold">Item</th>
                  <th className="px-4 py-2.5 font-semibold">Customer</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Qty · Est. total</th>
                  <th className="px-4 py-2.5 font-semibold">Arrival</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id} className="border-b border-[color:var(--border)]/60 last:border-0 align-top">
                    <td className="px-4 py-3">
                      <div className="font-mono font-semibold text-[color:var(--brand-navy)]">{p.number}</div>
                      <div className="text-[11px] text-[color:var(--muted)]">{fmtDate(p.createdAt)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[color:var(--brand-navy)] max-w-[200px] truncate" title={p.itemName}>{p.itemName}</div>
                      {p.itemSku && <div className="text-[11px] font-mono text-[color:var(--muted)]">{p.itemSku}</div>}
                      {p.note && <div className="text-[11px] text-[color:var(--muted)] italic mt-0.5 max-w-[200px] truncate" title={p.note}>“{p.note}”</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.customerName}</div>
                      <a href={`mailto:${p.customerEmail}`} className="text-[11px] text-[color:var(--brand-navy)] underline block truncate max-w-[160px]">{p.customerEmail}</a>
                      {p.customerPhone && <a href={`tel:${p.customerPhone}`} className="text-[11px] text-[color:var(--muted)]">{p.customerPhone}</a>}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="font-semibold">{formatPrice(p.unitPrice * p.quantity)}</div>
                      <div className="text-[11px] text-[color:var(--muted)]">{p.quantity} × {formatPrice(p.unitPrice)}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[color:var(--muted)] whitespace-nowrap">{fmtDate(p.expectedArrival)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={p.status}
                        disabled={busy === p.id}
                        onChange={(e) => setStatus(p.id, e.target.value as Status)}
                        className={`text-xs font-bold rounded-full px-2.5 py-1 border-0 cursor-pointer capitalize ${STATUS_STYLE[p.status] ?? "bg-gray-100 text-gray-700"}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => remove(p.id)}
                        disabled={busy === p.id}
                        className="text-[11px] font-semibold text-red-600 hover:text-red-800 disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, tone = "muted" }: { label: string; value: string; tone?: "navy" | "clay" | "muted" }) {
  const color = { navy: "text-[color:var(--brand-navy)]", clay: "text-[color:var(--brand-clay)]", muted: "text-[color:var(--brand-navy)]" }[tone];
  return (
    <div className="card !p-4">
      <div className="text-[10px] uppercase tracking-wider text-[color:var(--muted)] font-semibold">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
