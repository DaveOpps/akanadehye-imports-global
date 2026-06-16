import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Returns & Refunds — Akanadehye",
  description: "Easy returns and hassle-free refunds for your peace of mind.",
};

const STEPS = [
  {
    num: "1",
    title: "Start Return",
    desc: "Log into your account and select the item you want to return.",
  },
  {
    num: "2",
    title: "Pack & Label",
    desc: "Pack the item securely and attach the provided return label.",
  },
  {
    num: "3",
    title: "Ship Back",
    desc: "Drop off at any authorised shipping location or schedule a pickup.",
  },
];

const ELIGIBLE = [
  "Items in original, unused condition",
  "Items with original packaging and accessories",
  "Non-personalised items",
  "Purchased within the last 30 days",
];

const NOT_ELIGIBLE = [
  "Personalised or customised items",
  "Items damaged by misuse",
  "Items returned after 30 days",
  "Certain hygiene-related products",
  "Digital products and gift cards",
];

export default function ReturnsPage() {
  return (
    <div className="min-h-[70vh] bg-[color:var(--brand-cream)]/30 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* ── Hero ── */}
        <div className="text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--brand-navy)]/10 text-[color:var(--brand-navy)] mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <h1 className="text-3xl font-bold text-[color:var(--brand-navy)]">Returns &amp; Refunds</h1>
          <p className="mt-2 text-[color:var(--muted)] max-w-md mx-auto">
            Easy returns and hassle-free refunds for your peace of mind.
          </p>
        </div>

        {/* ── Policy overview cards ── */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="card">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-green-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <h2 className="font-bold text-[color:var(--brand-navy)]">30-Day Return Policy</h2>
            </div>
            <p className="text-sm text-[color:var(--muted)] leading-relaxed">
              Return most items within 30 days of delivery for a full refund. Items must be in original condition with all packaging.
            </p>
          </div>

          <div className="card">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-blue-500">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <h2 className="font-bold text-[color:var(--brand-navy)]">Quick Processing</h2>
            </div>
            <p className="text-sm text-[color:var(--muted)] leading-relaxed">
              Returns are processed within 3–5 business days. Refunds are issued to your original payment method within 7–10 business days.
            </p>
          </div>
        </div>

        {/* ── How to return ── */}
        <div className="card">
          <h2 className="text-lg font-bold text-[color:var(--brand-navy)] mb-6">How to Return an Item</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {STEPS.map((step) => (
              <div key={step.num} className="flex flex-col items-center text-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--brand-navy)] text-[color:var(--brand-gold)] font-bold text-base shrink-0">
                  {step.num}
                </span>
                <div>
                  <div className="font-bold text-[color:var(--brand-navy)]">{step.title}</div>
                  <p className="mt-1 text-xs text-[color:var(--muted)] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Step connector line (desktop) */}
          <div className="hidden sm:flex items-center justify-center mt-4 relative pointer-events-none select-none" aria-hidden>
            <div className="absolute top-0 left-[16.7%] right-[16.7%] h-px bg-[color:var(--border)] -mt-[60px]" />
          </div>
        </div>

        {/* ── Policy details ── */}
        <div className="card">
          <h2 className="text-lg font-bold text-[color:var(--brand-navy)] mb-5">Return Policy Details</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-[color:var(--brand-navy)] mb-2.5">Items Eligible for Return:</h3>
              <ul className="space-y-1.5">
                {ELIGIBLE.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[color:var(--muted)]">
                    <span className="text-green-500 mt-0.5 shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-[color:var(--brand-navy)] mb-2.5">Items Not Eligible for Return:</h3>
              <ul className="space-y-1.5">
                {NOT_ELIGIBLE.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[color:var(--muted)]">
                    <span className="text-red-400 mt-0.5 shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ── Contact CTA ── */}
        <div className="rounded-2xl bg-[color:var(--brand-navy)] text-white p-6 text-center">
          <h2 className="font-bold text-lg">Need help with a return?</h2>
          <p className="mt-1.5 text-white/70 text-sm">
            Our support team is available 24/7 to assist you with any return or refund questions.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[color:var(--brand-gold)] text-[color:var(--brand-navy)] text-sm font-bold hover:brightness-110 transition"
          >
            Contact Support →
          </Link>
        </div>

      </div>
    </div>
  );
}
