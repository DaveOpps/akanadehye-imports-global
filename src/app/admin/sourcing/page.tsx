"use client";

import { useState } from "react";
import { useSourcing, formatGHS, formatUSD, formatDate, uid, type SourcingOrder } from "@/lib/store";
import PageHeader from "@/components/PageHeader";

const FX_RATE_DEFAULT = 15.2; // demo USD → GHS rate

const STATUS_FLOW: SourcingOrder["status"][] = ["requested", "quoted", "purchased", "shipping", "arrived"];

export default function SourcingPage() {
  const { items, add, update, remove, hydrated } = useSourcing();
  const [productLink, setProductLink] = useState("");
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [estCostUsd, setEstCostUsd] = useState("");
  const [notes, setNotes] = useState("");
  const [flash, setFlash] = useState<string | null>(null);

  const totalSpend = items
    .filter((o) => o.status !== "requested" && o.status !== "quoted")
    .reduce((n, o) => n + o.estCostUsd * o.fxRate * o.quantity, 0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const qty = parseInt(quantity);
    const usd = parseFloat(estCostUsd);
    if (!productName || !qty || !usd || usd <= 0) return;
    add({
      id: uid("src"),
      createdAt: new Date().toISOString(),
      productLink,
      productName,
      quantity: qty,
      estCostUsd: usd,
      fxRate: FX_RATE_DEFAULT,
      status: "requested",
      notes: notes || undefined,
    });
    setProductLink("");
    setProductName("");
    setQuantity("1");
    setEstCostUsd("");
    setNotes("");
    setFlash("Sourcing request submitted. Our team will quote within 24 hours.");
    setTimeout(() => setFlash(null), 3500);
  }

  function advance(o: SourcingOrder) {
    const idx = STATUS_FLOW.indexOf(o.status);
    if (idx < STATUS_FLOW.length - 1) {
      update(o.id, { status: STATUS_FLOW[idx + 1] });
    }
  }

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Run shop" },
          { label: "Sourcing" },
        ]}
        title="Sourcing"
        subtitle="Order directly from factories in China via BuyForMe. Pay locally in Cedis. We handle logistics and FX."
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Mini label="Active requests" value={String(items.length)} />
        <Mini label="Spend committed" value={formatGHS(totalSpend)} />
        <Mini label="Today&apos;s FX rate" value={`1 USD = ${FX_RATE_DEFAULT} GHS`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <form onSubmit={submit} className="card space-y-4">
          <h2 className="font-bold text-lg">Request a sourcing order</h2>
          {flash && (
            <div className="rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm px-3 py-2">
              {flash}
            </div>
          )}
          <Field label="Product name">
            <input required value={productName} onChange={(e) => setProductName(e.target.value)} className="input" placeholder="e.g. Bluetooth speaker case" />
          </Field>
          <Field label="Source link (Alibaba, 1688, etc.)">
            <input value={productLink} onChange={(e) => setProductLink(e.target.value)} className="input" placeholder="https://..." />
          </Field>
          <Field label="Quantity">
            <input required type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="input" />
          </Field>
          <Field label="Estimated unit cost (USD)">
            <input required type="number" step="0.01" min="0" value={estCostUsd} onChange={(e) => setEstCostUsd(e.target.value)} className="input" placeholder="0.00" />
          </Field>
          {estCostUsd && quantity && (
            <div className="rounded-lg bg-[color:var(--brand-cream)] p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[color:var(--muted)]">Estimated total (USD):</span>
                <span className="font-semibold">{formatUSD(parseFloat(estCostUsd) * parseInt(quantity || "0"))}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[color:var(--muted)]">Pay in Cedis (est.):</span>
                <span className="font-bold text-[color:var(--brand-navy)]">
                  {formatGHS(parseFloat(estCostUsd) * parseInt(quantity || "0") * FX_RATE_DEFAULT)}
                </span>
              </div>
            </div>
          )}
          <Field label="Notes (specs, MOQ, deadline)">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="input resize-none" />
          </Field>
          <button className="btn-gold w-full justify-center">Submit request</button>
        </form>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">Your sourcing orders</h2>
            <span className="text-sm text-[color:var(--muted)]">{items.length} total</span>
          </div>
          {!hydrated ? (
            <div className="text-sm text-[color:var(--muted)]">Loading…</div>
          ) : items.length === 0 ? (
            <div className="card text-center text-[color:var(--muted)]">
              No sourcing requests yet. Submit one to get a Cedi quote.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((o) => (
                <div key={o.id} className="card !p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold truncate">{o.productName}</div>
                      <div className="text-xs text-[color:var(--muted)] mt-0.5">
                        {formatDate(o.createdAt)} · Qty {o.quantity}
                        {o.productLink && (
                          <>
                            {" · "}
                            <a href={o.productLink} target="_blank" rel="noopener noreferrer" className="underline">
                              source
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                    <StatusBadge s={o.status} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <div className="text-xs text-[color:var(--muted)]">Estimated total</div>
                      <div className="font-bold">{formatGHS(o.estCostUsd * o.quantity * o.fxRate)}</div>
                      <div className="text-xs text-[color:var(--muted)]">
                        ({formatUSD(o.estCostUsd * o.quantity)} @ {o.fxRate})
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {o.status !== "arrived" && (
                        <button
                          onClick={() => advance(o)}
                          className="text-xs font-semibold text-[color:var(--brand-navy)] hover:underline"
                        >
                          Advance status →
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm(`Cancel ${o.productName}?`)) remove(o.id);
                        }}
                        className="text-xs font-semibold text-[color:var(--brand-clay)] hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-4 flex items-center gap-1.5">
                    {STATUS_FLOW.map((s, i) => {
                      const active = STATUS_FLOW.indexOf(o.status) >= i;
                      return (
                        <div key={s} className="flex-1 flex flex-col items-center gap-1">
                          <div className={`h-1 w-full rounded-full ${active ? "bg-[color:var(--brand-teal)]" : "bg-[color:var(--border)]"}`} />
                          <span className={`text-[10px] uppercase tracking-wider ${active ? "text-[color:var(--brand-teal)] font-semibold" : "text-[color:var(--muted)]"}`}>
                            {s}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {o.notes && (
                    <p className="mt-3 text-xs text-[color:var(--muted)] italic">{o.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ s }: { s: SourcingOrder["status"] }) {
  const map: Record<SourcingOrder["status"], string> = {
    requested: "badge-gray",
    quoted: "badge-blue",
    purchased: "badge-amber",
    shipping: "badge-amber",
    arrived: "badge-green",
  };
  return <span className={`badge ${map[s]}`}>{s}</span>;
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
