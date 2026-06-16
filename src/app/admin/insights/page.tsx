"use client";

import { useMemo } from "react";
import { useInventory, useInvoices, usePayments, formatGHS, methodLabel } from "@/lib/store";
import PageHeader from "@/components/PageHeader";

export default function InsightsPage() {
  const payments = usePayments();
  const inventory = useInventory();
  const invoices = useInvoices();

  const stats = useMemo(() => {
    const succeeded = payments.items.filter((p) => p.status === "succeeded");
    const total = succeeded.reduce((n, p) => n + p.amount, 0);

    // Last 14 days
    const days: { date: string; revenue: number; label: string }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      const dayTotal = succeeded
        .filter((p) => p.createdAt.slice(0, 10) === key)
        .reduce((n, p) => n + p.amount, 0);
      days.push({
        date: key,
        revenue: dayTotal,
        label: d.toLocaleDateString("en-GH", { month: "short", day: "numeric" }),
      });
    }

    const maxRevenue = Math.max(1, ...days.map((d) => d.revenue));

    // By method
    const byMethod = succeeded.reduce(
      (acc, p) => {
        acc[p.method] = (acc[p.method] || 0) + p.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    // Top customers
    const byCustomer = succeeded.reduce(
      (acc, p) => {
        acc[p.customer] = (acc[p.customer] || 0) + p.amount;
        return acc;
      },
      {} as Record<string, number>
    );
    const topCustomers = Object.entries(byCustomer)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // 7-day vs prior 7-day trend
    const last7 = days.slice(-7).reduce((n, d) => n + d.revenue, 0);
    const prior7 = days.slice(0, 7).reduce((n, d) => n + d.revenue, 0);
    const trendPct = prior7 === 0 ? (last7 > 0 ? 100 : 0) : ((last7 - prior7) / prior7) * 100;

    return { total, days, maxRevenue, byMethod, topCustomers, last7, prior7, trendPct };
  }, [payments.items]);

  const ai = useMemo(() => {
    const insights: string[] = [];
    if (stats.last7 > stats.prior7 && stats.prior7 > 0) {
      insights.push(`Revenue is up ${stats.trendPct.toFixed(0)}% week-over-week. Keep doing what's working.`);
    } else if (stats.last7 < stats.prior7) {
      insights.push(`Revenue dipped ${Math.abs(stats.trendPct).toFixed(0)}% this week. Worth checking which channel slowed down.`);
    }
    const lowStock = inventory.items.filter((i) => i.stock <= i.reorderAt);
    if (lowStock.length > 0) {
      insights.push(`${lowStock.length} product${lowStock.length > 1 ? "s are" : " is"} low on stock — reorder before you run out.`);
    }
    const overdue = invoices.items.filter((i) => i.status === "overdue" || (i.status === "sent" && new Date(i.dueDate) < new Date()));
    if (overdue.length > 0) {
      insights.push(`${overdue.length} invoice${overdue.length > 1 ? "s are" : " is"} past due. A friendly reminder usually does the trick.`);
    }
    if (stats.topCustomers[0]) {
      insights.push(`${stats.topCustomers[0][0]} is your top customer at ${formatGHS(stats.topCustomers[0][1])}. Consider a thank-you discount.`);
    }
    if (insights.length === 0) {
      insights.push("Record some payments and invoices to start seeing AI insights here.");
    }
    return insights;
  }, [stats, inventory.items, invoices.items]);

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Grow" },
          { label: "Insights" },
        ]}
        title="Insights"
        subtitle="See how your business is performing. Best sellers, revenue trends, and AI-spotted opportunities."
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <Mini label="Lifetime revenue" value={formatGHS(stats.total)} />
        <Mini label="Last 7 days" value={formatGHS(stats.last7)} />
        <Mini label="Prior 7 days" value={formatGHS(stats.prior7)} />
        <Mini
          label="WoW trend"
          value={`${stats.trendPct >= 0 ? "+" : ""}${stats.trendPct.toFixed(0)}%`}
          accent={stats.trendPct >= 0 ? "teal" : "clay"}
        />
      </div>

      {/* AI tips */}
      <div className="card mb-6 bg-gradient-to-br from-[color:var(--brand-cream)] to-white">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--brand-navy)] text-[color:var(--brand-gold)] text-xs font-bold">
            AI
          </span>
          <h2 className="font-bold text-lg">What we noticed this week</h2>
        </div>
        <ul className="space-y-2">
          {ai.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[color:var(--brand-gold)] shrink-0" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Chart */}
      <div className="card mb-6">
        <h2 className="font-bold text-lg mb-1">Revenue · last 14 days</h2>
        <p className="text-sm text-[color:var(--muted)] mb-4">Hover a bar to see the day&apos;s total.</p>
        <div className="flex items-end gap-1 h-48">
          {stats.days.map((d) => {
            const h = (d.revenue / stats.maxRevenue) * 100;
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center justify-end group">
                <div className="text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition mb-1">
                  {formatGHS(d.revenue)}
                </div>
                <div
                  className="w-full bg-[color:var(--brand-navy)] hover:bg-[color:var(--brand-gold)] rounded-t transition min-h-1"
                  style={{ height: `${Math.max(2, h)}%` }}
                  title={`${d.label}: ${formatGHS(d.revenue)}`}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-[color:var(--muted)]">
          {stats.days.filter((_, i) => i % 2 === 0).map((d) => (
            <span key={d.date}>{d.label}</span>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* By method */}
        <div className="card">
          <h2 className="font-bold text-lg mb-4">Revenue by method</h2>
          {Object.keys(stats.byMethod).length === 0 ? (
            <div className="text-sm text-[color:var(--muted)]">No data yet.</div>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.byMethod)
                .sort((a, b) => b[1] - a[1])
                .map(([m, amt]) => {
                  const pct = (amt / stats.total) * 100;
                  return (
                    <div key={m}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{methodLabel(m as never)}</span>
                        <span className="font-bold">{formatGHS(amt)} · {pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-[color:var(--brand-cream)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[color:var(--brand-teal)]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Top customers */}
        <div className="card">
          <h2 className="font-bold text-lg mb-4">Top customers</h2>
          {stats.topCustomers.length === 0 ? (
            <div className="text-sm text-[color:var(--muted)]">No data yet.</div>
          ) : (
            <ol className="space-y-2">
              {stats.topCustomers.map(([name, amt], i) => (
                <li key={name} className="flex items-center justify-between gap-3 py-2 border-b last:border-b-0 border-[color:var(--border)]">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--brand-navy)] text-[color:var(--brand-gold)] text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="font-medium">{name}</span>
                  </div>
                  <span className="font-bold">{formatGHS(amt)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value, accent }: { label: string; value: string; accent?: "clay" | "teal" }) {
  const color = accent === "clay" ? "text-[color:var(--brand-clay)]" : accent === "teal" ? "text-[color:var(--brand-teal)]" : "";
  return (
    <div className="card !p-4">
      <div className="text-xs uppercase tracking-wider text-[color:var(--muted)]">{label}</div>
      <div className={`mt-1 text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
