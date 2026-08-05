"use client";

import { useState } from "react";
import { formatPrice, discountedPrice, type Product } from "@/lib/products";
import { formatEtaDate, PREORDER_LEAD_WORKING_DAYS } from "@/lib/dates";

function formatEta(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : formatEtaDate(d);
}

type PaymentMethod = "mobile-money" | "card" | "bank-transfer";
const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "mobile-money", label: "Mobile Money" },
  { value: "card", label: "Card" },
  { value: "bank-transfer", label: "Bank Transfer" },
];

type Result = { number: string; quantity: number; total: number; expectedArrival: string | null } | null;

export default function PreOrderPanel({
  product,
  variant = "primary",
}: {
  product: Product;
  variant?: "primary" | "secondary";
}) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mobile-money");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result>(null);

  const price = discountedPrice(product);
  const eta = formatEta(product.expectedArrival);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/preorders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: String(product.id),
          quantity: qty,
          paymentMethod,
          customerName: name.trim(),
          customerEmail: email.trim(),
          customerPhone: phone.trim() || undefined,
          note: note.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
      } else {
        setResult({
          number: data.preorder.number,
          quantity: data.preorder.quantity,
          total: data.preorder.total,
          expectedArrival: data.preorder.expectedArrival ?? null,
        });
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function close() {
    setOpen(false);
    // Reset only after a successful reservation so a retry keeps the form.
    if (result) {
      setResult(null);
      setName(""); setEmail(""); setPhone(""); setNote(""); setQty(1); setPaymentMethod("mobile-money");
    }
  }

  const btnClass =
    variant === "primary"
      ? "btn-gold w-full justify-center"
      : "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[color:var(--brand-navy)] text-white text-sm font-bold hover:bg-[color:var(--brand-navy-soft)] transition shadow-sm";

  const clockIcon = (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <>
      {variant === "secondary" ? (
        <div className="rounded-xl border-2 border-[color:var(--brand-navy)]/20 bg-[color:var(--brand-cream)]/60 p-3.5 space-y-2.5">
          <div className="flex items-center gap-1.5 text-[color:var(--brand-navy)]">
            {clockIcon}
            <span className="text-xs font-bold uppercase tracking-wide">Also open for pre-order</span>
          </div>
          <p className="text-xs text-[color:var(--muted)] leading-snug">
            Want more than what&apos;s in stock, or reserve from the next batch? Full payment secures your order —{" "}
            {eta ? `expected ${eta}` : `up to ${PREORDER_LEAD_WORKING_DAYS} working days`}.
          </p>
          <button type="button" onClick={() => setOpen(true)} className={btnClass}>
            {clockIcon}
            Pre-order this item
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <button type="button" onClick={() => setOpen(true)} className={btnClass}>
            Pre-order this item
          </button>
          <p className="text-xs text-[color:var(--muted)] text-center">
            Full payment required · {eta ? `expected ${eta}` : `takes up to ${PREORDER_LEAD_WORKING_DAYS} working days`}
          </p>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50" onClick={close} aria-hidden />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--border)] sticky top-0 bg-white">
              <h2 className="font-bold text-[color:var(--brand-navy)]">
                {result ? "Pre-order confirmed" : "Pre-order"}
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="h-8 w-8 inline-flex items-center justify-center rounded-full text-[color:var(--muted)] hover:bg-[color:var(--brand-cream)]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {result ? (
              <div className="p-6 text-center space-y-4">
                <div className="mx-auto h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-green-600">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-[color:var(--muted)]">Your reference</p>
                  <p className="text-2xl font-bold font-mono text-[color:var(--brand-navy)]">{result.number}</p>
                </div>
                <p className="text-sm text-[color:var(--brand-navy)]/90 leading-relaxed">
                  We&apos;ve reserved <strong>{result.quantity} × {product.title}</strong>. A confirmation has
                  been sent to your email with payment instructions.
                </p>
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-3.5 py-2.5 text-sm text-left">
                  <span className="block text-[10px] uppercase tracking-wider text-amber-800 font-bold">
                    Payment required to secure this pre-order
                  </span>
                  <span className="font-bold text-[color:var(--brand-navy)] text-base">
                    {formatPrice(result.total)} — full amount, in advance
                  </span>
                  <span className="block text-[11px] text-amber-900 mt-0.5">
                    Our team will contact you shortly to complete payment. Quote reference <strong>{result.number}</strong>.
                  </span>
                </div>
                <div className="rounded-lg bg-[color:var(--brand-cream)]/60 px-3.5 py-2.5 text-sm">
                  <span className="block text-[10px] uppercase tracking-wider text-[color:var(--muted)] font-semibold">
                    Expected arrival
                  </span>
                  <span className="font-bold text-[color:var(--brand-navy)]">
                    {formatEta(result.expectedArrival) ?? "—"}
                  </span>
                  <span className="block text-[11px] text-[color:var(--muted)] mt-0.5">
                    Pre-orders take up to {PREORDER_LEAD_WORKING_DAYS} working days from full payment.
                  </span>
                </div>
                <button type="button" onClick={close} className="btn-primary w-full justify-center">
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="p-5 space-y-4">
                {/* Item summary */}
                <div className="flex items-center gap-3 rounded-xl bg-[color:var(--brand-cream)]/50 p-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-[color:var(--brand-navy)] truncate">{product.title}</div>
                    <div className="text-xs text-[color:var(--muted)]">
                      {formatPrice(price)} each · {eta ? `expected ${eta}` : `up to ${PREORDER_LEAD_WORKING_DAYS} working days`}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="block text-sm font-medium mb-1.5">Quantity</span>
                    <input
                      type="number" min={1} max={999} value={qty}
                      onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="input"
                    />
                  </label>
                  <div className="flex items-end">
                    <div className="text-sm text-[color:var(--muted)] pb-2.5">
                      Total due now <strong className="text-[color:var(--brand-navy)]">{formatPrice(price * qty)}</strong>
                    </div>
                  </div>
                </div>

                {/* Payment method */}
                <div>
                  <span className="block text-sm font-medium mb-1.5">Payment method</span>
                  <div className="grid grid-cols-3 gap-2">
                    {PAYMENT_OPTIONS.map((opt) => {
                      const active = paymentMethod === opt.value;
                      return (
                        <button
                          type="button"
                          key={opt.value}
                          onClick={() => setPaymentMethod(opt.value)}
                          className={`text-xs font-semibold px-2 py-2.5 rounded-lg border-2 transition ${
                            active
                              ? "border-[color:var(--brand-navy)] bg-[color:var(--brand-cream)] text-[color:var(--brand-navy)]"
                              : "border-[color:var(--border)] text-[color:var(--muted)] hover:border-[color:var(--brand-navy)]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className="block">
                  <span className="block text-sm font-medium mb-1.5">Full name</span>
                  <input required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Your name" />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium mb-1.5">Email</span>
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium mb-1.5">Phone <span className="text-[color:var(--muted)] font-normal">(optional)</span></span>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="+233 …" />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium mb-1.5">Note <span className="text-[color:var(--muted)] font-normal">(optional)</span></span>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="input resize-y" placeholder="Anything we should know?" />
                </label>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-[11px] text-amber-900 leading-relaxed">
                  <strong>100% payment is required</strong> to secure this pre-order — our team will contact
                  you to complete payment via {PAYMENT_OPTIONS.find((o) => o.value === paymentMethod)?.label}.
                  Pre-orders take up to{" "}
                  <strong className="text-[color:var(--brand-navy)]">{PREORDER_LEAD_WORKING_DAYS} working days</strong> to arrive.
                </div>

                <button type="submit" disabled={submitting} className="btn-gold w-full justify-center disabled:opacity-60">
                  {submitting ? "Reserving…" : `Place pre-order · ${formatPrice(price * qty)}`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
