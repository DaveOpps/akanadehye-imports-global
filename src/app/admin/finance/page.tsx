"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  usePayments,
  useInvoices,
  useSourcing,
  formatGHS,
  invoiceTotal,
  methodLabel,
  type PaymentMethod,
} from "@/lib/store";
import { useOrders } from "@/lib/orders";
import PageHeader from "@/components/PageHeader";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Tab = "summary" | "daily" | "audit";

type AuditEvent = {
  id: string;
  when: string;
  type: "payment" | "invoice" | "order";
  customer: string;
  description: string;
  amount: number;
  status: string;
  method?: string;
};

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function isoDate(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

function friendlyDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GH", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function friendlyTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit" });
}

function reltime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STATUS_STYLE: Record<string, string> = {
  succeeded: "bg-emerald-100 text-emerald-800",
  paid: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  sent: "bg-blue-100 text-blue-800",
  draft: "bg-gray-100 text-gray-600",
  overdue: "bg-red-100 text-red-700",
  failed: "bg-red-100 text-red-700",
  delivered: "bg-emerald-100 text-emerald-800",
  confirmed: "bg-blue-100 text-blue-800",
};

// ─── component ───────────────────────────────────────────────────────────────

export default function FinanceHub() {
  const payments = usePayments();
  const invoices = useInvoices();
  const sourcing = useSourcing();
  const orders = useOrders();

  const [tab, setTab] = useState<Tab>("summary");
  const [range, setRange] = useState<"7" | "30" | "90" | "all">("30");

  // ── Revenue: only succeeded payments ──
  const succeededPayments = useMemo(
    () => payments.items.filter((p) => p.status === "succeeded"),
    [payments.items]
  );
  const paidInvoices = useMemo(
    () => invoices.items.filter((i) => i.status === "paid"),
    [invoices.items]
  );

  const totalRevenue = useMemo(
    () => succeededPayments.reduce((n, p) => n + p.amount, 0),
    [succeededPayments]
  );

  const invoiceRevenue = useMemo(
    () => paidInvoices.reduce((n, i) => n + invoiceTotal(i), 0),
    [paidInvoices]
  );

  // Sourcing costs converted to GHS (best proxy for cost of goods)
  const sourcingCostGHS = useMemo(
    () =>
      sourcing.items
        .filter((s) => s.status !== "requested")
        .reduce((n, s) => n + s.estCostUsd * s.fxRate, 0),
    [sourcing.items]
  );

  const combinedRevenue = totalRevenue + invoiceRevenue;
  const estimatedProfit = combinedRevenue - sourcingCostGHS;
  const profitMargin = combinedRevenue > 0 ? (estimatedProfit / combinedRevenue) * 100 : 0;

  // Outstanding: sent + overdue invoices
  const outstandingAmount = useMemo(
    () =>
      invoices.items
        .filter((i) => i.status === "sent" || i.status === "overdue")
        .reduce((n, i) => n + invoiceTotal(i), 0),
    [invoices.items]
  );

  // ── Daily sales bucketing ──
  const dailySales = useMemo(() => {
    const cutoffDays = range === "all" ? Infinity : Number(range);
    const cutoff = range === "all" ? 0 : Date.now() - cutoffDays * 86400000;

    const map = new Map<string, { count: number; revenue: number }>();
    for (const p of succeededPayments) {
      if (new Date(p.createdAt).getTime() < cutoff) continue;
      const d = isoDate(p.createdAt);
      const cur = map.get(d) ?? { count: 0, revenue: 0 };
      map.set(d, { count: cur.count + 1, revenue: cur.revenue + p.amount });
    }
    for (const inv of paidInvoices) {
      if (new Date(inv.createdAt).getTime() < cutoff) continue;
      const d = isoDate(inv.createdAt);
      const cur = map.get(d) ?? { count: 0, revenue: 0 };
      map.set(d, { count: cur.count + 1, revenue: cur.revenue + invoiceTotal(inv) });
    }

    const rows = Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));

    // Add running cumulative (from newest back — reverse for cumsum then re-reverse)
    let cum = 0;
    const reversed = [...rows].reverse();
    const withCum = reversed.map(([date, data]) => {
      cum += data.revenue;
      return { date, ...data, cumulative: cum };
    });
    return withCum.reverse();
  }, [succeededPayments, paidInvoices, range]);

  const todayKey = isoDate(new Date().toISOString());
  const todayRow = dailySales.find((r) => r.date === todayKey);
  const bestRow = dailySales.reduce(
    (best, r) => (r.revenue > (best?.revenue ?? 0) ? r : best),
    null as (typeof dailySales)[0] | null
  );

  // Chart data — reversed so oldest is left
  const chartData = useMemo(
    () =>
      [...dailySales].reverse().map((r) => ({
        date: r.date.slice(5), // "MM-DD"
        revenue: r.revenue,
        cumulative: r.cumulative,
        count: r.count,
      })),
    [dailySales]
  );

  // ── Financial audit trail ──
  const auditEvents = useMemo<AuditEvent[]>(() => {
    const events: AuditEvent[] = [];

    for (const p of payments.items) {
      events.push({
        id: p.id,
        when: p.createdAt,
        type: "payment",
        customer: p.customer,
        description: `${methodLabel(p.method as PaymentMethod)} payment`,
        amount: p.amount,
        status: p.status,
        method: p.method,
      });
    }
    for (const inv of invoices.items) {
      events.push({
        id: inv.id,
        when: inv.createdAt,
        type: "invoice",
        customer: inv.customerName,
        description: `Invoice ${inv.number}`,
        amount: invoiceTotal(inv),
        status: inv.status,
      });
    }
    for (const o of orders.items) {
      events.push({
        id: o.id,
        when: o.createdAt,
        type: "order",
        customer: o.customerEmail ?? "Guest",
        description: `Order ${o.number}`,
        amount: o.total,
        status: o.status,
      });
    }

    return events.sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());
  }, [payments.items, invoices.items, orders.items]);

  // Running balance (succeeded payments + paid invoices only, chronological)
  const auditWithBalance = useMemo(() => {
    let balance = 0;
    const settled = [...auditEvents]
      .filter((e) => e.status === "succeeded" || e.status === "paid" || e.status === "delivered")
      .reverse();
    const balanceMap = new Map<string, number>();
    for (const e of settled) {
      balance += e.amount;
      balanceMap.set(e.id, balance);
    }
    return auditEvents.map((e) => ({ ...e, balance: balanceMap.get(e.id) }));
  }, [auditEvents]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "summary", label: "Summary" },
    { key: "daily", label: "Daily Sales" },
    { key: "audit", label: "Audit Trail" },
  ];

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Finance Hub" }]}
        title="Finance Hub"
        subtitle="Revenue, daily sales, profit estimates, and a full financial audit trail."
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <KpiCard
          label="Total revenue"
          value={`GH₵ ${fmt(combinedRevenue)}`}
          sub="Payments + paid invoices"
          accent="teal"
        />
        <KpiCard
          label="Est. gross profit"
          value={`GH₵ ${fmt(Math.max(0, estimatedProfit))}`}
          sub={`${profitMargin.toFixed(1)}% margin · based on sourcing costs`}
          accent={estimatedProfit >= 0 ? "green" : "red"}
        />
        <KpiCard
          label="Today's sales"
          value={todayRow ? `GH₵ ${fmt(todayRow.revenue)}` : "GH₵ 0.00"}
          sub={todayRow ? `${todayRow.count} transaction${todayRow.count !== 1 ? "s" : ""}` : "No sales yet today"}
        />
        <KpiCard
          label="Outstanding"
          value={`GH₵ ${fmt(outstandingAmount)}`}
          sub="Sent + overdue invoices"
          accent={outstandingAmount > 0 ? "amber" : undefined}
        />
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 border-b border-[color:var(--border)]">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition ${
              tab === t.key
                ? "border-[color:var(--brand-navy)] text-[color:var(--brand-navy)]"
                : "border-transparent text-[color:var(--muted)] hover:text-[color:var(--brand-navy)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── SUMMARY TAB ─────────────────────────────────── */}
      {tab === "summary" && (
        <div className="space-y-6">
          {/* Revenue trend chart */}
          {chartData.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[color:var(--brand-navy)]">Revenue trend</h3>
                <span className="text-xs text-[color:var(--muted)]">Last {chartData.length} active day{chartData.length !== 1 ? "s" : ""}</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1a3a5c" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#1a3a5c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₵${(v / 1000).toFixed(0)}k`} width={45} />
                  <Tooltip
                    formatter={(value) => [`GH₵ ${fmt(Number(value ?? 0))}`, "Revenue"]}
                    labelStyle={{ fontWeight: 700, color: "#1a3a5c" }}
                    contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#1a3a5c" strokeWidth={2.5} fill="url(#revenueGrad)" dot={chartData.length < 15} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Revenue breakdown */}
          <div className="card space-y-4">
            <h3 className="font-bold text-[color:var(--brand-navy)]">Revenue breakdown</h3>
            <div className="divide-y divide-[color:var(--border)]">
              <BreakdownRow label="Direct payments" amount={totalRevenue} count={succeededPayments.length} note="Succeeded payments" />
              <BreakdownRow label="Invoice revenue" amount={invoiceRevenue} count={paidInvoices.length} note="Paid invoices" />
              <BreakdownRow label="Sourcing costs" amount={-sourcingCostGHS} count={sourcing.items.filter(s => s.status !== "requested").length} note="Purchases in GHS equivalent" negative />
              <div className="pt-3 flex items-center justify-between">
                <span className="font-bold text-[color:var(--brand-navy)]">Estimated gross profit</span>
                <span className={`text-xl font-bold ${estimatedProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                  GH₵ {fmt(estimatedProfit)}
                </span>
              </div>
            </div>
          </div>

          {/* Best day + payment methods */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="font-bold mb-3 text-[color:var(--brand-navy)]">Best sales day</h3>
              {bestRow ? (
                <>
                  <div className="text-2xl font-bold text-[color:var(--brand-teal)]">GH₵ {fmt(bestRow.revenue)}</div>
                  <div className="text-sm text-[color:var(--muted)] mt-1">{friendlyDate(bestRow.date + "T00:00:00")} · {bestRow.count} transaction{bestRow.count !== 1 ? "s" : ""}</div>
                </>
              ) : (
                <p className="text-sm text-[color:var(--muted)]">No sales recorded yet.</p>
              )}
            </div>
            <div className="card">
              <h3 className="font-bold mb-3 text-[color:var(--brand-navy)]">Payment methods</h3>
              <PaymentMethodBreakdown payments={succeededPayments} />
            </div>
          </div>

          <p className="text-xs text-[color:var(--muted)] px-1">
            Profit estimate uses sourcing order costs converted at the logged FX rate. Add actual cost prices to inventory items for accurate margin tracking.
          </p>
        </div>
      )}

      {/* ── DAILY SALES TAB ─────────────────────────────── */}
      {tab === "daily" && (
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="text-sm text-[color:var(--muted)]">Show last</span>
            {(["7", "30", "90", "all"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                  range === r
                    ? "bg-[color:var(--brand-navy)] text-white"
                    : "bg-[color:var(--brand-cream)] text-[color:var(--brand-navy)] hover:bg-[color:var(--border)]"
                }`}
              >
                {r === "all" ? "All time" : `${r} days`}
              </button>
            ))}
            <span className="ml-auto text-xs text-[color:var(--muted)]">
              {dailySales.length} day{dailySales.length !== 1 ? "s" : ""} with activity
            </span>
          </div>

          {dailySales.length === 0 ? (
            <div className="card py-12 text-center text-sm text-[color:var(--muted)]">
              No sales recorded in this period.
            </div>
          ) : (
            <>
            {/* Bar chart */}
            <div className="card mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[color:var(--brand-navy)]">Daily revenue</h3>
                <span className="text-xs text-[color:var(--muted)]">{chartData.length} day{chartData.length !== 1 ? "s" : ""}</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} interval={chartData.length > 14 ? Math.floor(chartData.length / 7) : 0} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₵${(v / 1000).toFixed(0)}k`} width={45} />
                  <Tooltip
                    formatter={(value, name) => [
                      `GH₵ ${fmt(Number(value ?? 0))}`,
                      name === "revenue" ? "Revenue" : String(name),
                    ]}
                    labelStyle={{ fontWeight: 700, color: "#1a3a5c" }}
                    contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }}
                    cursor={{ fill: "#f5f0e8" }}
                  />
                  <Bar dataKey="revenue" fill="#c9a84c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-hidden rounded-xl border border-[color:var(--border)] bg-white">
              <table className="w-full text-sm">
                <thead className="bg-[color:var(--brand-cream)] text-xs uppercase tracking-wider text-[color:var(--muted)]">
                  <tr>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-right px-4 py-3">Transactions</th>
                    <th className="text-right px-4 py-3">Daily revenue</th>
                    <th className="text-right px-4 py-3">Cumulative</th>
                  </tr>
                </thead>
                <tbody>
                  {dailySales.map((row) => {
                    const isToday = row.date === todayKey;
                    const isBest = row === bestRow;
                    return (
                      <tr
                        key={row.date}
                        className={`border-t border-[color:var(--border)] ${
                          isToday ? "bg-[color:var(--brand-cream)]/60" : "hover:bg-[color:var(--brand-cream)]/30"
                        } transition`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{friendlyDate(row.date + "T00:00:00")}</span>
                            {isToday && <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-[color:var(--brand-navy)] text-white">Today</span>}
                            {isBest && !isToday && <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">Best</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{row.count}</td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums">GH₵ {fmt(row.revenue)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-[color:var(--muted)]">GH₵ {fmt(row.cumulative)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t-2 border-[color:var(--border)] bg-[color:var(--brand-cream)]/40">
                  <tr>
                    <td className="px-4 py-3 font-bold text-[color:var(--brand-navy)]">Total</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums">
                      {dailySales.reduce((n, r) => n + r.count, 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-[color:var(--brand-teal)]">
                      GH₵ {fmt(dailySales.reduce((n, r) => n + r.revenue, 0))}
                    </td>
                    <td className="px-4 py-3" />
                  </tr>
                </tfoot>
              </table>
            </div>
            </>
          )}
        </div>
      )}

      {/* ── AUDIT TRAIL TAB ─────────────────────────────── */}
      {tab === "audit" && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-[color:var(--muted)]">
              All payments, invoices, and orders — chronological financial record.
            </p>
            <span className="text-xs text-[color:var(--muted)]">{auditEvents.length} events</span>
          </div>

          {auditEvents.length === 0 ? (
            <div className="card py-12 text-center text-sm text-[color:var(--muted)]">
              No financial events recorded yet.{" "}
              <Link href="/admin/pos" className="font-semibold underline">Start a sale →</Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[color:var(--border)] bg-white">
              <table className="w-full text-sm">
                <thead className="bg-[color:var(--brand-cream)] text-xs uppercase tracking-wider text-[color:var(--muted)]">
                  <tr>
                    <th className="text-left px-4 py-3 w-36">When</th>
                    <th className="text-left px-4 py-3 w-24">Type</th>
                    <th className="text-left px-4 py-3">Customer / Reference</th>
                    <th className="text-left px-4 py-3 w-28">Status</th>
                    <th className="text-right px-4 py-3">Amount</th>
                    <th className="text-right px-4 py-3 hidden lg:table-cell">Running bal.</th>
                  </tr>
                </thead>
                <tbody>
                  {auditWithBalance.map((e) => (
                    <tr key={e.id} className="border-t border-[color:var(--border)] hover:bg-[color:var(--brand-cream)]/30 transition">
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium" title={new Date(e.when).toLocaleString()}>{reltime(e.when)}</div>
                        <div className="text-[10px] text-[color:var(--muted)]">{friendlyDate(e.when)}</div>
                        <div className="text-[10px] text-[color:var(--muted)]">{friendlyTime(e.when)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <TypeBadge type={e.type} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium truncate max-w-[180px]">{e.customer}</div>
                        <div className="text-xs text-[color:var(--muted)]">{e.description}{e.method ? ` · ${methodLabel(e.method as PaymentMethod)}` : ""}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLE[e.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {e.status}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-bold tabular-nums ${e.status === "failed" ? "text-red-400 line-through" : "text-[color:var(--brand-navy)]"}`}>
                        GH₵ {fmt(e.amount)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-[color:var(--muted)] text-xs hidden lg:table-cell">
                        {e.balance != null ? `GH₵ ${fmt(e.balance)}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: "teal" | "green" | "amber" | "red" }) {
  const colorMap: Record<string, string> = {
    teal: "text-[color:var(--brand-teal)]",
    green: "text-emerald-700",
    amber: "text-amber-600",
    red: "text-red-600",
  };
  const valueColor = accent ? (colorMap[accent] ?? "") : "";

  return (
    <div className="card !p-5">
      <div className="text-xs uppercase tracking-wider text-[color:var(--muted)] mb-1">{label}</div>
      <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
      <div className="text-xs text-[color:var(--muted)] mt-1">{sub}</div>
    </div>
  );
}

function BreakdownRow({
  label, amount, count, note, negative,
}: {
  label: string; amount: number; count: number; note: string; negative?: boolean;
}) {
  return (
    <div className="py-3 flex items-center justify-between">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-[color:var(--muted)]">{count} item{count !== 1 ? "s" : ""} · {note}</div>
      </div>
      <div className={`font-bold tabular-nums ${negative ? "text-red-500" : "text-[color:var(--brand-navy)]"}`}>
        {negative ? "−" : ""}GH₵ {Math.abs(amount).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  );
}

function PaymentMethodBreakdown({ payments }: { payments: { method: string; amount: number }[] }) {
  const methods = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    for (const p of payments) {
      const cur = map.get(p.method) ?? { count: 0, total: 0 };
      map.set(p.method, { count: cur.count + 1, total: cur.total + p.amount });
    }
    return Array.from(map.entries())
      .map(([method, data]) => ({ method, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [payments]);

  if (methods.length === 0) return <p className="text-sm text-[color:var(--muted)]">No payments yet.</p>;

  return (
    <div className="space-y-2">
      {methods.map((m) => (
        <div key={m.method} className="flex items-center justify-between text-sm">
          <span className="text-[color:var(--muted)]">{methodLabel(m.method as PaymentMethod)}</span>
          <div className="text-right">
            <div className="font-bold">GH₵ {m.total.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="text-[10px] text-[color:var(--muted)]">{m.count} tx</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TypeBadge({ type }: { type: "payment" | "invoice" | "order" }) {
  const styles = {
    payment: "bg-[color:var(--brand-navy)] text-white",
    invoice: "bg-purple-100 text-purple-800",
    order: "bg-blue-100 text-blue-800",
  };
  const labels = { payment: "Payment", invoice: "Invoice", order: "Order" };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${styles[type]}`}>
      {labels[type]}
    </span>
  );
}
