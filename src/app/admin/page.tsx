"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  useInventory,
  useInvoices,
  usePayments,
  useSourcing,
  formatGHS,
  formatDate,
  invoiceTotal,
  methodLabel,
} from "@/lib/store";
import { useOrders } from "@/lib/orders";
import ChannelsWidget from "@/components/ChannelsWidget";

type Range = "today" | "week" | "month" | "all";

type AuditLog = {
  id: string;
  createdAt: string;
  action: string;
  entityName: string | null;
  entitySku: string | null;
  before: string | null;
  after: string | null;
};

function auditEventDetail(log: AuditLog): string {
  const name = log.entityName ?? log.entitySku ?? "Item";
  if (log.action === "CREATE") return `${name} (${log.entitySku ?? ""}) added to catalog.`;
  if (log.action === "DELETE") return `${name} (${log.entitySku ?? ""}) removed from catalog.`;
  if (log.action === "STOCK_ADJUST") {
    try {
      const b = log.before ? JSON.parse(log.before)?.stock : null;
      const a = log.after ? JSON.parse(log.after)?.stock : null;
      if (b != null && a != null) return `${name}: stock ${b} → ${a} units.`;
    } catch { /* ignore */ }
    return `${name} stock adjusted.`;
  }
  // UPDATE — list changed fields
  try {
    const b: Record<string, unknown> = log.before ? JSON.parse(log.before) : {};
    const a: Record<string, unknown> = log.after ? JSON.parse(log.after) : {};
    const keys = Object.keys(a).filter((k) => String(b[k]) !== String(a[k]));
    if (keys.length) return `${name}: ${keys.join(", ")} updated.`;
  } catch { /* ignore */ }
  return `${name} updated.`;
}

export default function DashboardOverview() {
  const { data: session } = useSession();
  const userName = session?.user?.name?.split(" ")[0] ?? "there";
  const payments = usePayments();
  const inventory = useInventory();
  const invoices = useInvoices();
  const sourcing = useSourcing();
  const orders = useOrders();
  const pendingOrders = orders.items.filter((o) => o.status === "pending").length;
  const [range, setRange] = useState<Range>("today");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    fetch("/api/audit?entity=InventoryItem&limit=30")
      .then((r) => r.json())
      .then((d) => setAuditLogs(d.logs ?? []))
      .catch(() => {});
  }, []);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, []);
  const greetIcon = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "☀️";
    if (h < 17) return "🌤️";
    return "🌙";
  }, []);

  const sales = useMemo(() => {
    const succeeded = payments.items.filter((p) => p.status === "succeeded");
    const now = Date.now();
    const cutoffs: Record<Range, number> = {
      today: now - 86400000,
      week: now - 7 * 86400000,
      month: now - 30 * 86400000,
      all: 0,
    };
    const cutoff = cutoffs[range];
    const filtered = succeeded.filter((p) => new Date(p.createdAt).getTime() >= cutoff);
    const total = filtered.reduce((n, p) => n + p.amount, 0);

    // For trend comparison: prior period same length
    const length = now - cutoff;
    const priorCutoff = cutoff - length;
    const prior = succeeded.filter((p) => {
      const t = new Date(p.createdAt).getTime();
      return t >= priorCutoff && t < cutoff;
    });
    const priorTotal = prior.reduce((n, p) => n + p.amount, 0);
    const deltaPct = priorTotal > 0 ? ((total - priorTotal) / priorTotal) * 100 : total > 0 ? 100 : 0;

    return { total, deltaPct, filtered };
  }, [payments.items, range]);

  const lowStock = inventory.items.filter((i) => i.stock <= i.reorderAt).length;

  // Recent activity (last 12 events) — group by Today / Yesterday / Earlier
  const activity = useMemo(() => {
    type Event = {
      id: string;
      when: string;
      title: string;
      detail: string;
      kind: "in" | "out" | "stock" | "inventory";
    };
    const events: Event[] = [];

    for (const p of payments.items) {
      events.push({
        id: p.id,
        when: p.createdAt,
        title: "Payment Received",
        detail: `${formatGHS(p.amount)} ${methodLabel(p.method)} payment from ${p.customer}.`,
        kind: "in",
      });
    }
    for (const inv of invoices.items) {
      if (inv.status === "paid") {
        events.push({
          id: inv.id,
          when: inv.createdAt,
          title: "Invoice paid",
          detail: `${inv.customerName} paid invoice ${inv.number} for ${formatGHS(invoiceTotal(inv))}.`,
          kind: "in",
        });
      }
    }
    for (const o of sourcing.items) {
      if (o.status === "arrived") {
        events.push({
          id: o.id,
          when: o.createdAt,
          title: "Sourcing arrived",
          detail: `${o.productName} (x${o.quantity}) landed and is ready for sale.`,
          kind: "stock",
        });
      }
    }
    for (const log of auditLogs) {
      const titles: Record<string, string> = {
        CREATE: "Product added",
        UPDATE: "Product edited",
        STOCK_ADJUST: "Stock adjusted",
        DELETE: "Product removed",
      };
      events.push({
        id: `audit-${log.id}`,
        when: log.createdAt,
        title: titles[log.action] ?? "Product changed",
        detail: auditEventDetail(log),
        kind: "inventory",
      });
    }

    events.sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const grouped: Record<string, Event[]> = { Today: [], Yesterday: [], Earlier: [] };
    for (const e of events.slice(0, 15)) {
      const d = new Date(e.when);
      d.setHours(0, 0, 0, 0);
      if (d.getTime() === today.getTime()) grouped.Today.push(e);
      else if (d.getTime() === yesterday.getTime()) grouped.Yesterday.push(e);
      else grouped.Earlier.push(e);
    }
    return grouped;
  }, [payments.items, invoices.items, sourcing.items, auditLogs]);

  return (
    <div className="max-w-3xl mx-auto">
      {/* GREETING */}
      <header className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[color:var(--brand-gold)] to-[color:var(--brand-clay)] inline-flex items-center justify-center text-white font-bold text-lg">
            {(session?.user?.name ?? "A").charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-lg font-bold flex items-center gap-1.5">
              {greeting}, {userName} <span>{greetIcon}</span>
            </div>
            <div className="text-sm text-[color:var(--muted)]">{session?.user?.name ?? "Admin"}</div>
          </div>
        </div>
        <button
          aria-label="Notifications"
          className="relative h-11 w-11 rounded-full border border-[color:var(--border)] hover:bg-[color:var(--brand-cream)] inline-flex items-center justify-center transition"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9zM13.7 21a2 2 0 01-3.4 0"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {lowStock > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[color:var(--brand-clay)]" />
          )}
        </button>
      </header>

      {/* HERO TOTAL SALES CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[color:var(--brand-teal)] to-[#0a4a45] text-white p-6 mb-6">
        {/* Decorative arabesque pattern */}
        <svg
          aria-hidden="true"
          className="absolute -right-10 -top-10 w-72 h-72 text-white/[0.06]"
          viewBox="0 0 200 200"
          fill="currentColor"
        >
          <circle cx="100" cy="100" r="80" />
          <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="100" cy="100" r="40" />
        </svg>

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-white/70">Total sales</div>
          </div>
          <RangePicker value={range} onChange={setRange} />
        </div>

        <div className="relative mt-3 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="text-3xl md:text-4xl font-bold tracking-tight">
              GH₵ {sales.total.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`mt-1 text-xs ${sales.deltaPct >= 0 ? "text-[color:var(--brand-gold)]" : "text-orange-300"}`}>
              {sales.deltaPct >= 0 ? "▲" : "▼"} {Math.abs(sales.deltaPct).toFixed(1)}% from previous period
            </div>
          </div>
          <button
            disabled={sales.total <= 0}
            onClick={() => alert(`Withdraw ${formatGHS(sales.total)} — connect your settlement account to enable transfers.`)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[color:var(--brand-gold)] text-[color:var(--brand-navy)] font-bold text-sm hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Withdraw
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 19V5h11l4 4v10H5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <path d="M9 9h4M9 13h7M9 17h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="relative mt-4 flex gap-1 justify-center">
          <span className="h-1 w-6 rounded-full bg-white/60" />
          <span className="h-1 w-1.5 rounded-full bg-white/30" />
          <span className="h-1 w-1.5 rounded-full bg-white/30" />
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <QuickAction href="/admin/pos" label="POS" icon="phone" />
        <QuickAction href="/admin/payments" label="Instant Pay" icon="card" />
        <QuickAction href="/admin/inventory" label="Products" icon="cart" />
        <QuickAction href="/admin/insights" label="Sales" icon="bag" />
      </div>

      {/* CHANNELS WIDGET — between quick actions and transactions */}
      <ChannelsWidget />

      {/* LOW STOCK ALERT */}
      {lowStock > 0 && (
        <div className="mb-6 rounded-2xl border border-[color:var(--brand-clay)]/30 bg-[color:var(--brand-clay)]/5 p-4 flex items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-[color:var(--brand-clay)] text-sm">⚠ Low stock alert</div>
            <div className="text-xs text-[color:var(--muted)] mt-0.5">
              {lowStock} item{lowStock > 1 ? "s are" : " is"} at or below reorder level.
            </div>
          </div>
          <Link href="/admin/inventory" className="text-xs font-semibold text-[color:var(--brand-clay)] hover:underline whitespace-nowrap">
            Review →
          </Link>
        </div>
      )}

      {/* RECENT ACTIVITY */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Recent activity</h2>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/inventory?tab=audit"
              className="text-xs font-semibold text-[color:var(--muted)] hover:text-[color:var(--brand-navy)] transition"
            >
              Audit trail →
            </Link>
            <Link
              href="/admin/payments"
              className="text-xs font-bold px-3 py-1.5 rounded-full bg-[color:var(--brand-gold)]/20 text-[color:var(--brand-navy)] hover:bg-[color:var(--brand-gold)]/40 transition"
            >
              See all
            </Link>
          </div>
        </div>

        {Object.values(activity).every((arr) => arr.length === 0) ? (
          <div className="rounded-2xl border border-dashed border-[color:var(--border)] py-10 text-center text-sm text-[color:var(--muted)]">
            No transactions yet. Start a sale in <Link href="/admin/pos" className="font-semibold underline">POS</Link>.
          </div>
        ) : (
          <div className="space-y-5">
            {(["Today", "Yesterday", "Earlier"] as const).map(
              (label) =>
                activity[label].length > 0 && (
                  <div key={label}>
                    <div className="text-xs uppercase tracking-wider text-[color:var(--muted)] font-semibold mb-2">{label}</div>
                    <ul className="space-y-2">
                      {activity[label].map((e) => (
                        <li
                          key={e.id}
                          className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 flex items-center gap-3 hover:shadow-sm transition"
                        >
                          <ActivityIcon kind={e.kind} />
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-sm">{e.title}</div>
                            <div className="text-xs text-[color:var(--muted)] truncate">{e.detail}</div>
                          </div>
                          <div className="text-xs text-[color:var(--muted)] whitespace-nowrap">
                            {formatDate(e.when)}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
            )}
          </div>
        )}
      </section>

      {/* SECONDARY STATS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-8">
        <Mini
          label="Pending orders"
          value={String(pendingOrders)}
          accent={pendingOrders > 0 ? "amber" : undefined}
        />
        <Mini label="Sourcing orders" value={String(sourcing.items.length)} />
        <Mini label="Outstanding invoices" value={String(invoices.items.filter((i) => i.status === "sent" || i.status === "overdue").length)} />
        <Mini label="Products in catalog" value={String(inventory.items.length)} />
      </div>
    </div>
  );
}

function RangePicker({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  const [open, setOpen] = useState(false);
  const labels: Record<Range, string> = { today: "Today", week: "This week", month: "This month", all: "All time" };
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition"
      >
        {labels[value]}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className={`transition ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-36 rounded-xl bg-white text-[color:var(--brand-navy)] shadow-xl overflow-hidden z-10">
          {(Object.keys(labels) as Range[]).map((k) => (
            <button
              key={k}
              onClick={() => {
                onChange(k);
                setOpen(false);
              }}
              className={`block w-full text-left px-4 py-2 text-sm hover:bg-[color:var(--brand-cream)] ${
                value === k ? "font-bold" : ""
              }`}
            >
              {labels[k]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function QuickAction({ href, label, icon }: { href: string; label: string; icon: "phone" | "card" | "cart" | "bag" }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-2 group">
      <span className="h-16 w-16 rounded-2xl bg-[color:var(--brand-teal)] text-[color:var(--brand-gold)] inline-flex items-center justify-center group-hover:scale-105 group-active:scale-95 transition shadow-sm">
        <QuickIcon name={icon} />
      </span>
      <span className="text-xs font-semibold text-[color:var(--brand-navy)]">{label}</span>
    </Link>
  );
}

function QuickIcon({ name }: { name: "phone" | "card" | "cart" | "bag" }) {
  const paths: Record<typeof name, React.ReactNode> = {
    phone: <path d="M7 2h10a2 2 0 012 2v16a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2zM11 18h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    card: <><rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M2 11h20M15 15l3-3-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></>,
    cart: <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6zM3 6h18M16 10a4 4 0 11-8 0" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />,
    bag: <path d="M6 2L4 6v14a2 2 0 002 2h12a2 2 0 002-2V6l-2-4H6z M4 6h16M9 10v0a3 3 0 006 0v0" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />,
  };
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      {paths[name]}
    </svg>
  );
}

function ActivityIcon({ kind }: { kind: "in" | "out" | "stock" | "inventory" }) {
  if (kind === "in") {
    return (
      <span className="h-10 w-10 rounded-full bg-[color:var(--brand-cream)] text-[color:var(--brand-navy)] inline-flex items-center justify-center shrink-0">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 4v16m0 0l-5-5m5 5l5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (kind === "out") {
    return (
      <span className="h-10 w-10 rounded-full bg-[color:var(--brand-cream)] text-[color:var(--brand-clay)] inline-flex items-center justify-center shrink-0">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M3 7h4l5 5-5 5H3M14 12h7M17 9l3 3-3 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (kind === "inventory") {
    return (
      <span className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 inline-flex items-center justify-center shrink-0">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M3 8l9-5 9 5v8l-9 5-9-5V8zM3 8l9 5m0 0l9-5m-9 5v9" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  return (
    <span className="h-10 w-10 rounded-full bg-[color:var(--brand-cream)] text-[color:var(--brand-teal)] inline-flex items-center justify-center shrink-0">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M3 8l9-5 9 5v8l-9 5-9-5V8z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function Mini({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className={`card !p-4 ${accent === "amber" ? "border-amber-300" : ""}`}>
      <div className="text-xs uppercase tracking-wider text-[color:var(--muted)]">{label}</div>
      <div className={`mt-1 text-xl font-bold ${accent === "amber" ? "text-amber-600" : ""}`}>
        {value}
      </div>
    </div>
  );
}
