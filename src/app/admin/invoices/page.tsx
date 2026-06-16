"use client";

import { useState } from "react";
import { useInvoices, formatGHS, formatDate, invoiceTotal, uid, type Invoice, type InvoiceLine } from "@/lib/store";
import PageHeader from "@/components/PageHeader";

export default function InvoicesPage() {
  const { items, add, update, remove, hydrated } = useInvoices();
  const [showForm, setShowForm] = useState(false);

  const sent = items.filter((i) => i.status === "sent" || i.status === "overdue");
  const paid = items.filter((i) => i.status === "paid");
  const outstanding = sent.reduce((n, i) => n + invoiceTotal(i), 0);
  const collected = paid.reduce((n, i) => n + invoiceTotal(i), 0);

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Get paid" },
          { label: "Invoices" },
        ]}
        title="Invoices"
        subtitle="Create and send invoices in seconds. Track payments, stay organized, and get paid faster."
        actions={
          <button onClick={() => setShowForm(true)} className="btn-gold">
            + New invoice
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Mini label="Invoices total" value={String(items.length)} />
        <Mini label="Outstanding" value={formatGHS(outstanding)} accent="clay" />
        <Mini label="Collected" value={formatGHS(collected)} accent="teal" />
      </div>

      {showForm && (
        <InvoiceForm
          onCancel={() => setShowForm(false)}
          onSave={(data) => {
            add({
              ...data,
              id: uid("inv"),
              number: `INV-${(items.length + 1).toString().padStart(4, "0")}`,
              createdAt: new Date().toISOString(),
            });
            setShowForm(false);
          }}
        />
      )}

      {!hydrated ? (
        <div className="text-sm text-[color:var(--muted)]">Loading…</div>
      ) : items.length === 0 ? (
        <div className="card text-center text-[color:var(--muted)]">
          No invoices yet. Create your first one to start tracking what you&apos;re owed.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[color:var(--border)] bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[color:var(--brand-cream)] text-xs uppercase tracking-wider text-[color:var(--muted)]">
              <tr>
                <th className="text-left px-4 py-3">Number</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Issued</th>
                <th className="text-left px-4 py-3">Due</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((inv) => (
                <tr key={inv.id} className="border-t border-[color:var(--border)]">
                  <td className="px-4 py-3 font-mono text-xs">{inv.number}</td>
                  <td className="px-4 py-3 font-medium">{inv.customerName}</td>
                  <td className="px-4 py-3 text-[color:var(--muted)]">{formatDate(inv.createdAt)}</td>
                  <td className="px-4 py-3 text-[color:var(--muted)]">{formatDate(inv.dueDate)}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatGHS(invoiceTotal(inv))}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge s={inv.status} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {inv.status === "draft" && (
                      <button onClick={() => update(inv.id, { status: "sent" })} className="text-xs font-semibold text-[color:var(--brand-navy)] hover:underline mr-3">
                        Send
                      </button>
                    )}
                    {(inv.status === "sent" || inv.status === "overdue") && (
                      <button onClick={() => update(inv.id, { status: "paid" })} className="text-xs font-semibold text-[color:var(--brand-teal)] hover:underline mr-3">
                        Mark paid
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${inv.number}?`)) remove(inv.id);
                      }}
                      className="text-xs font-semibold text-[color:var(--brand-clay)] hover:underline"
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
  );
}

function StatusBadge({ s }: { s: Invoice["status"] }) {
  const map = {
    draft: "badge-gray",
    sent: "badge-blue",
    paid: "badge-green",
    overdue: "badge-red",
  }[s];
  return <span className={`badge ${map}`}>{s}</span>;
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

function InvoiceForm({
  onSave,
  onCancel,
}: {
  onSave: (data: Omit<Invoice, "id" | "number" | "createdAt">) => void;
  onCancel: () => void;
}) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  const [lines, setLines] = useState<InvoiceLine[]>([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [notes, setNotes] = useState("");

  const total = lines.reduce((n, l) => n + l.quantity * l.unitPrice, 0);

  function setLine(idx: number, patch: Partial<InvoiceLine>) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function submit(e: React.FormEvent, asDraft: boolean) {
    e.preventDefault();
    const cleaned = lines.filter((l) => l.description && l.quantity > 0);
    if (cleaned.length === 0 || !customerName) return;
    onSave({
      customerName,
      customerEmail,
      dueDate,
      lines: cleaned,
      status: asDraft ? "draft" : "sent",
      notes,
    });
  }

  return (
    <form onSubmit={(e) => submit(e, false)} className="card mb-6 space-y-4">
      <h2 className="font-bold text-lg">New invoice</h2>

      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Customer name">
          <input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="input" placeholder="e.g. Kojo Antwi" />
        </Field>
        <Field label="Customer email">
          <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="input" placeholder="customer@example.com" />
        </Field>
        <Field label="Due date" className="sm:col-span-2">
          <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
        </Field>
      </div>

      <div>
        <div className="text-sm font-medium mb-2">Line items</div>
        <div className="space-y-2">
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px_120px_36px] gap-2 items-center">
              <input
                value={l.description}
                onChange={(e) => setLine(i, { description: e.target.value })}
                placeholder="Description"
                className="input"
              />
              <input
                type="number"
                min="0"
                value={l.quantity}
                onChange={(e) => setLine(i, { quantity: parseInt(e.target.value) || 0 })}
                className="input"
              />
              <input
                type="number"
                step="0.01"
                min="0"
                value={l.unitPrice}
                onChange={(e) => setLine(i, { unitPrice: parseFloat(e.target.value) || 0 })}
                placeholder="Unit price"
                className="input"
              />
              <button
                type="button"
                onClick={() => setLines((p) => p.filter((_, idx) => idx !== i))}
                disabled={lines.length === 1}
                className="text-[color:var(--brand-clay)] disabled:opacity-30 hover:bg-[color:var(--brand-cream)] rounded h-9"
                aria-label="Remove line"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setLines((p) => [...p, { description: "", quantity: 1, unitPrice: 0 }])}
          className="mt-2 text-sm font-semibold text-[color:var(--brand-navy)] hover:underline"
        >
          + Add line
        </button>
      </div>

      <Field label="Notes (optional)">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="input resize-none" />
      </Field>

      <div className="flex items-center justify-between pt-3 border-t border-[color:var(--border)]">
        <div>
          <div className="text-xs text-[color:var(--muted)] uppercase tracking-wider">Invoice total</div>
          <div className="text-2xl font-bold">{formatGHS(total)}</div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="btn-outline text-sm">Cancel</button>
          <button type="button" onClick={(e) => submit(e, true)} className="btn-outline text-sm">Save as draft</button>
          <button className="btn-gold text-sm">Save & send</button>
        </div>
      </div>
    </form>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      {children}
    </label>
  );
}
