"use client";

import { useState } from "react";
import { formatPrice, discountedPrice, type Product } from "@/lib/products";

function formatEta(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

type Result = { number: string; quantity: number } | null;

export default function PreOrderPanel({
  product,
  variant = "primary",
}: {
  product: Product;
  variant?: "primary" | "secondary";
}) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);
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
        setResult({ number: data.preorder.number, quantity: data.preorder.quantity });
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
      setName(""); setEmail(""); setPhone(""); setNote(""); setQty(1);
    }
  }

  const btnClass =
    variant === "primary"
      ? "btn-gold w-full justify-center"
      : "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[color:var(--brand-navy)] text-sm font-semibold text-[color:var(--brand-navy)] hover:bg-[color:var(--brand-cream)] transition";

  return (
    <>
      <div className="space-y-1.5">
        <button type="button" onClick={() => setOpen(true)} className={btnClass}>
          Pre-order this item
        </button>
        <p className="text-xs text-[color:var(--muted)] text-center">
          Reserve now, pay on arrival{eta ? ` · expected ${eta}` : ""}
        </p>
      </div>

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
                  We&apos;ve reserved <strong>{result.quantity} × {product.title}</strong>. No payment is
                  needed now — we&apos;ll contact you to confirm and invoice when it arrives
                  {eta ? ` (expected ${eta})` : ""}. A confirmation has been sent to your email.
                </p>
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
                      {formatPrice(price)} each{eta ? ` · expected ${eta}` : ""}
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
                      Est. total <strong className="text-[color:var(--brand-navy)]">{formatPrice(price * qty)}</strong>
                    </div>
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

                <div className="rounded-lg bg-[color:var(--brand-cream)]/60 px-3 py-2 text-[11px] text-[color:var(--muted)] leading-relaxed">
                  No payment is taken now. This reserves your item — we&apos;ll confirm availability and
                  send an invoice when the goods arrive.
                </div>

                <button type="submit" disabled={submitting} className="btn-gold w-full justify-center disabled:opacity-60">
                  {submitting ? "Reserving…" : "Place pre-order"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
