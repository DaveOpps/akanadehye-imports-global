"use client";

import { useState } from "react";
import { usePayments, formatGHS, formatDate, methodLabel, uid, type PaymentMethod } from "@/lib/store";
import PageHeader from "@/components/PageHeader";

export default function PaymentsPage() {
  const { items, add, hydrated } = usePayments();
  const [customer, setCustomer] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("mobile-money");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [flash, setFlash] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!customer || !amt || amt <= 0) return;
    add({
      id: uid("pay"),
      createdAt: new Date().toISOString(),
      customer,
      amount: amt,
      currency: "GHS",
      method,
      reference: reference || `${method.toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      status: "succeeded",
      note: note || undefined,
    });
    setCustomer("");
    setAmount("");
    setReference("");
    setNote("");
    setFlash("Payment recorded successfully.");
    setTimeout(() => setFlash(null), 2500);
  }

  const totals = items
    .filter((p) => p.status === "succeeded")
    .reduce(
      (acc, p) => {
        acc.total += p.amount;
        acc.byMethod[p.method] = (acc.byMethod[p.method] || 0) + p.amount;
        return acc;
      },
      { total: 0, byMethod: {} as Record<string, number> }
    );

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Get paid" },
          { label: "Payments" },
        ]}
        title="Payments"
        subtitle="Record payments anywhere — Mobile Money, Visa, Mastercard, Apple Pay. Works online and offline."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Mini label="Total received" value={formatGHS(totals.total)} />
        <Mini label="Mobile Money" value={formatGHS(totals.byMethod["mobile-money"] || 0)} />
        <Mini label="Cards" value={formatGHS((totals.byMethod["visa"] || 0) + (totals.byMethod["mastercard"] || 0))} />
        <Mini label="Apple Pay" value={formatGHS(totals.byMethod["apple-pay"] || 0)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <form onSubmit={onSubmit} className="card space-y-4">
          <h2 className="font-bold text-lg">Record a payment</h2>

          {flash && (
            <div className="rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm px-3 py-2">
              {flash}
            </div>
          )}

          <Field label="Customer name">
            <input
              required
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="e.g. Adwoa Mensah"
              className="input"
            />
          </Field>

          <Field label="Amount (GHS)">
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="input"
            />
          </Field>

          <Field label="Payment method">
            <div className="grid grid-cols-2 gap-2">
              {(["mobile-money", "visa", "mastercard", "apple-pay"] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition ${
                    method === m
                      ? "border-[color:var(--brand-navy)] bg-[color:var(--brand-navy)] text-white"
                      : "border-[color:var(--border)] hover:border-[color:var(--brand-navy)]"
                  }`}
                >
                  {methodLabel(m)}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Reference (optional)">
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Auto-generated if blank"
              className="input"
            />
          </Field>

          <Field label="Note (optional)">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="input resize-none"
            />
          </Field>

          <button className="btn-gold w-full justify-center">Record payment</button>
        </form>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">Recent payments</h2>
            <span className="text-sm text-[color:var(--muted)]">{items.length} total</span>
          </div>

          {!hydrated ? (
            <div className="text-sm text-[color:var(--muted)]">Loading…</div>
          ) : items.length === 0 ? (
            <div className="card text-center text-[color:var(--muted)]">No payments recorded yet.</div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[color:var(--border)] bg-white">
              <table className="w-full text-sm">
                <thead className="bg-[color:var(--brand-cream)] text-xs uppercase tracking-wider text-[color:var(--muted)]">
                  <tr>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Customer</th>
                    <th className="text-left px-4 py-3">Method</th>
                    <th className="text-left px-4 py-3">Reference</th>
                    <th className="text-right px-4 py-3">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => (
                    <tr key={p.id} className="border-t border-[color:var(--border)]">
                      <td className="px-4 py-3 text-[color:var(--muted)]">{formatDate(p.createdAt)}</td>
                      <td className="px-4 py-3 font-medium">{p.customer}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[color:var(--brand-cream)] text-xs">
                          {methodLabel(p.method)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[color:var(--muted)]">{p.reference}</td>
                      <td className="px-4 py-3 text-right font-bold">{formatGHS(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="card !p-4">
      <div className="text-xs uppercase tracking-wider text-[color:var(--muted)]">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
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
