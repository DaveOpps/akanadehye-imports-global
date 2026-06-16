"use client";

import { useMemo, useState } from "react";
import { useFinancing, useInvoices, usePayments, formatGHS, formatDate, invoiceTotal, uid, type FinancingApplication } from "@/lib/store";
import PageHeader from "@/components/PageHeader";

const INTEREST_RATE_MONTHLY = 0.025; // 2.5% per month, demo

export default function FinancingPage() {
  const { items, add, hydrated } = useFinancing();
  const payments = usePayments();
  const invoices = useInvoices();

  // Credit profile heuristic
  const profile = useMemo(() => {
    const revenue = payments.items.filter((p) => p.status === "succeeded").reduce((n, p) => n + p.amount, 0);
    const collected = invoices.items.filter((i) => i.status === "paid").reduce((n, i) => n + invoiceTotal(i), 0);
    const outstanding = invoices.items.filter((i) => i.status === "sent" || i.status === "overdue").reduce((n, i) => n + invoiceTotal(i), 0);

    const recurring = payments.items.length >= 3 ? 25 : payments.items.length * 8;
    const revenueScore = Math.min(35, Math.floor(revenue / 200));
    const invoicingScore = Math.min(25, invoices.items.length * 4);
    const onTimeRatio =
      invoices.items.length > 0 ? (invoices.items.filter((i) => i.status === "paid").length / invoices.items.length) * 15 : 5;

    const total = Math.min(100, Math.round(recurring + revenueScore + invoicingScore + onTimeRatio));
    const maxLoan = Math.round(revenue * 1.5 + collected * 0.8);
    const tier = total >= 75 ? "Prime" : total >= 50 ? "Growth" : total >= 25 ? "Starter" : "Building";

    return { revenue, collected, outstanding, total, maxLoan, tier };
  }, [payments.items, invoices.items]);

  const [amount, setAmount] = useState("");
  const [term, setTerm] = useState("6");
  const [purpose, setPurpose] = useState("Inventory restock");
  const [flash, setFlash] = useState<string | null>(null);

  const requested = parseFloat(amount || "0");
  const monthlyPayment = useMemo(() => {
    const months = parseInt(term);
    if (!requested || !months) return 0;
    const r = INTEREST_RATE_MONTHLY;
    return (requested * r) / (1 - Math.pow(1 + r, -months)) || 0;
  }, [requested, term]);

  const totalRepay = monthlyPayment * parseInt(term);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!requested || requested <= 0) return;
    if (requested > profile.maxLoan) {
      setFlash(`Requested amount exceeds your current limit of ${formatGHS(profile.maxLoan)}. Try a smaller amount or build more history.`);
      return;
    }
    add({
      id: uid("fin"),
      createdAt: new Date().toISOString(),
      amount: requested,
      termMonths: parseInt(term),
      purpose,
      status: "submitted",
    });
    setAmount("");
    setPurpose("Inventory restock");
    setFlash("Application submitted. We&apos;ll review and respond within 48 hours.");
    setTimeout(() => setFlash(null), 4000);
  }

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Grow" },
          { label: "Financing" },
        ]}
        title="Financing"
        subtitle="Turn your business data into real funding. Build your credit profile and access financing when you need it."
      />

      {/* Credit score */}
      <div className="card mb-6 bg-gradient-to-br from-[color:var(--brand-navy)] to-[color:var(--brand-navy-soft)] text-white">
        <div className="grid md:grid-cols-[200px_1fr_200px] gap-6 items-center">
          <div className="text-center">
            <ScoreRing score={profile.total} />
            <div className="mt-2 text-xs uppercase tracking-wider text-white/70">Credit profile</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-[color:var(--brand-gold)] mb-1">
              {profile.tier} tier
            </div>
            <div className="text-lg font-semibold">
              You&apos;re pre-qualified for up to <span className="text-[color:var(--brand-gold)]">{formatGHS(profile.maxLoan)}</span>
            </div>
            <p className="mt-2 text-sm text-white/70">
              Based on lifetime revenue of {formatGHS(profile.revenue)}, {invoices.items.length} invoices issued, and your payment history.
            </p>
          </div>
          <div className="space-y-1 text-sm">
            <Row label="Lifetime revenue" value={formatGHS(profile.revenue)} />
            <Row label="Collected" value={formatGHS(profile.collected)} />
            <Row label="Outstanding" value={formatGHS(profile.outstanding)} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[460px_1fr]">
        {/* Application */}
        <form onSubmit={submit} className="card space-y-4">
          <h2 className="font-bold text-lg">Apply for financing</h2>
          {flash && (
            <div className={`rounded-lg border text-sm px-3 py-2 ${flash.includes("exceeds") ? "bg-red-50 border-red-200 text-red-800" : "bg-green-50 border-green-200 text-green-800"}`}>
              {flash}
            </div>
          )}

          <Field label="Amount (GHS)">
            <input
              required
              type="number"
              step="0.01"
              min="0"
              max={profile.maxLoan}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input"
              placeholder="0.00"
            />
            <div className="text-xs text-[color:var(--muted)] mt-1">
              Max for your tier: {formatGHS(profile.maxLoan)}
            </div>
          </Field>

          <Field label="Term (months)">
            <select value={term} onChange={(e) => setTerm(e.target.value)} className="input">
              <option value="3">3 months</option>
              <option value="6">6 months</option>
              <option value="9">9 months</option>
              <option value="12">12 months</option>
            </select>
          </Field>

          <Field label="Purpose">
            <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="input">
              <option>Inventory restock</option>
              <option>Bulk sourcing order</option>
              <option>Equipment</option>
              <option>Hire staff</option>
              <option>Marketing & growth</option>
              <option>Working capital</option>
            </select>
          </Field>

          {requested > 0 && (
            <div className="rounded-lg bg-[color:var(--brand-cream)] p-4 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-[color:var(--muted)]">Interest rate</span>
                <span className="font-semibold">{(INTEREST_RATE_MONTHLY * 100).toFixed(1)}% per month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[color:var(--muted)]">Monthly payment</span>
                <span className="font-semibold">{formatGHS(monthlyPayment)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[color:var(--border)] mt-1">
                <span className="text-[color:var(--muted)]">Total repayment</span>
                <span className="font-bold text-[color:var(--brand-navy)]">{formatGHS(totalRepay)}</span>
              </div>
            </div>
          )}

          <button
            disabled={requested > profile.maxLoan || requested <= 0}
            className="btn-gold w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit application
          </button>
        </form>

        {/* Applications history */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">Your applications</h2>
            <span className="text-sm text-[color:var(--muted)]">{items.length} total</span>
          </div>
          {!hydrated ? (
            <div className="text-sm text-[color:var(--muted)]">Loading…</div>
          ) : items.length === 0 ? (
            <div className="card text-center text-[color:var(--muted)]">
              No applications yet. Submit one to see status updates here.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((a) => (
                <div key={a.id} className="card !p-5 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold">{formatGHS(a.amount)}</div>
                    <div className="text-xs text-[color:var(--muted)] mt-0.5">
                      {a.termMonths} months · {a.purpose} · {formatDate(a.createdAt)}
                    </div>
                  </div>
                  <StatusBadge s={a.status} />
                </div>
              ))}
            </div>
          )}

          <div className="card mt-6 bg-[color:var(--brand-cream)]">
            <h3 className="font-bold mb-2 text-sm">How to grow your limit</h3>
            <ul className="text-sm space-y-1.5 text-[color:var(--muted)]">
              <li className="flex gap-2"><span className="text-[color:var(--brand-gold)]">→</span> Record more payments to show consistent revenue</li>
              <li className="flex gap-2"><span className="text-[color:var(--brand-gold)]">→</span> Send invoices and mark them paid on time</li>
              <li className="flex gap-2"><span className="text-[color:var(--brand-gold)]">→</span> Keep low-stock items restocked</li>
              <li className="flex gap-2"><span className="text-[color:var(--brand-gold)]">→</span> Complete sourcing orders to demonstrate working capital flow</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative inline-block">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} stroke="rgba(255,255,255,0.15)" strokeWidth="12" fill="none" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          stroke="var(--brand-gold)"
          strokeWidth="12"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold">{score}</div>
        <div className="text-xs text-white/60">/ 100</div>
      </div>
    </div>
  );
}

function StatusBadge({ s }: { s: FinancingApplication["status"] }) {
  const map: Record<FinancingApplication["status"], string> = {
    submitted: "badge-gray",
    "under-review": "badge-amber",
    approved: "badge-green",
    declined: "badge-red",
  };
  return <span className={`badge ${map[s]}`}>{s.replace("-", " ")}</span>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/60">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      {children}
    </label>
  );
}
