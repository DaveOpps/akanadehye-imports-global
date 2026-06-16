import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Help Center — Akanadehye",
  description: "Find answers to your questions or get in touch with our support team.",
};

const CATEGORIES = [
  {
    icon: "orders",
    label: "Orders & Shipping",
    count: 12,
    desc: "Track orders, shipping info, and delivery updates",
    href: "#orders",
  },
  {
    icon: "payments",
    label: "Payments & Billing",
    count: 8,
    desc: "Payment methods, billing, and refunds",
    href: "#payments",
  },
  {
    icon: "returns",
    label: "Returns & Exchanges",
    count: 6,
    desc: "Return policy, exchanges, and refund process",
    href: "/returns",
  },
  {
    icon: "account",
    label: "Account & Settings",
    count: 10,
    desc: "Account management and profile settings",
    href: "#account",
  },
];

const ARTICLES = [
  { q: "How to track my order?", href: "#" },
  { q: "What is your return policy?", href: "/returns" },
  { q: "How to change my delivery address?", href: "#" },
  { q: "Payment methods accepted", href: "#" },
  { q: "How to cancel my order?", href: "#" },
  { q: "Setting up account notifications", href: "#" },
];

const QUICK_LINKS = [
  { label: "Returns Policy", href: "/returns" },
  { label: "Shipping Information", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Privacy Policy", href: "#" },
  { label: "FAQ", href: "#" },
];

export default function HelpPage() {
  return (
    <div className="min-h-[70vh]">

      {/* ── Hero ── */}
      <div className="bg-white border-b border-[color:var(--border)] py-12 px-4 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--brand-navy)]/10 text-[color:var(--brand-navy)] mb-4">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h1 className="text-3xl font-bold text-[color:var(--brand-navy)]">How can we help you?</h1>
        <p className="mt-2 text-[color:var(--muted)] max-w-md mx-auto">
          Find answers to your questions or get in touch with our support team
        </p>
        <div className="mt-5 max-w-lg mx-auto relative">
          <svg
            aria-hidden="true"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--muted)]"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path d="M15.5 15.5L20 20M10 17a7 7 0 110-14 7 7 0 010 14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            placeholder="Search for help articles..."
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--brand-cream)] text-sm focus:outline-2 focus:outline-[color:var(--brand-navy)] focus:bg-white transition"
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* ── Browse by Category ── */}
        <section>
          <h2 className="text-xl font-bold text-[color:var(--brand-navy)] mb-4">Browse by Category</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.label}
                href={cat.href}
                className="card group hover:border-[color:var(--brand-navy)]/40 hover:shadow-md transition flex flex-col gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--brand-navy)]/10 text-[color:var(--brand-navy)] group-hover:bg-[color:var(--brand-navy)] group-hover:text-[color:var(--brand-gold)] transition shrink-0">
                    <HelpIcon name={cat.icon} />
                  </span>
                  <div>
                    <div className="font-bold text-sm text-[color:var(--brand-navy)] leading-tight">{cat.label}</div>
                    <div className="text-[11px] text-[color:var(--muted)]">{cat.count} articles</div>
                  </div>
                </div>
                <p className="text-xs text-[color:var(--muted)] leading-relaxed flex-1">{cat.desc}</p>
                <span className="text-xs font-semibold text-[color:var(--brand-clay)] group-hover:underline">
                  View Articles →
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Popular Articles ── */}
        <section>
          <h2 className="text-xl font-bold text-[color:var(--brand-navy)] mb-4">Popular Articles</h2>
          <div className="rounded-xl border border-[color:var(--border)] bg-white overflow-hidden divide-y divide-[color:var(--border)]">
            {ARTICLES.map((a) => (
              <Link
                key={a.q}
                href={a.href}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-[color:var(--brand-cream)] transition group"
              >
                <span className="shrink-0 text-[color:var(--muted)]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M8 8h8M8 12h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="flex-1 text-sm font-medium text-[color:var(--brand-navy)] group-hover:text-[color:var(--brand-clay)] transition">
                  {a.q}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[color:var(--muted)]">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Contact Support ── */}
        <section>
          <h2 className="text-xl font-bold text-[color:var(--brand-navy)] mb-4">Contact Support</h2>
          <div className="grid sm:grid-cols-3 gap-4">

            {/* Live Chat */}
            <div className="card text-center flex flex-col items-center gap-2">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                </svg>
              </span>
              <div className="font-bold text-[color:var(--brand-navy)]">Live Chat</div>
              <p className="text-xs text-[color:var(--muted)]">Chat with our support team</p>
              <div className="flex items-center gap-1 text-xs text-[color:var(--muted)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                24/7
              </div>
              <a
                href="https://wa.me/233000000000"
                className="mt-2 w-full inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[color:var(--brand-navy)] text-white text-sm font-bold hover:bg-[color:var(--brand-navy-soft)] transition"
              >
                Start Chat
              </a>
            </div>

            {/* Phone Support */}
            <div className="card text-center flex flex-col items-center gap-2">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.1 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                </svg>
              </span>
              <div className="font-bold text-[color:var(--brand-navy)]">Phone Support</div>
              <p className="text-xs text-[color:var(--muted)]">Call us for immediate assistance</p>
              <div className="flex items-center gap-1 text-xs text-[color:var(--muted)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Mon–Fri 9AM–6PM
              </div>
              <a
                href="tel:+233000000000"
                className="mt-2 w-full inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[color:var(--brand-navy)] text-white text-sm font-bold hover:bg-[color:var(--brand-navy-soft)] transition"
              >
                Call Now
              </a>
            </div>

            {/* Email Support */}
            <div className="card text-center flex flex-col items-center gap-2">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                </svg>
              </span>
              <div className="font-bold text-[color:var(--brand-navy)]">Email Support</div>
              <p className="text-xs text-[color:var(--muted)]">Send us your questions</p>
              <div className="flex items-center gap-1 text-xs text-[color:var(--muted)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Response within 24h
              </div>
              <a
                href="mailto:support@akanadehye.com"
                className="mt-2 w-full inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[color:var(--brand-navy)] text-white text-sm font-bold hover:bg-[color:var(--brand-navy-soft)] transition"
              >
                Send Email
              </a>
            </div>
          </div>
        </section>

        {/* ── Quick Links ── */}
        <div className="border-t border-[color:var(--border)] pt-6 text-center">
          <p className="text-xs font-semibold text-[color:var(--muted)] mb-3">Quick Links</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
            {QUICK_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-sm text-[color:var(--brand-clay)] hover:underline underline-offset-2 transition"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function HelpIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    orders: (
      <path
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    payments: (
      <path
        d="M3 8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8zM3 8v2h18V8M7 14h.01M11 14h2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    returns: (
      <path
        d="M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    account: (
      <path
        d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  };
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      {paths[name] ?? null}
    </svg>
  );
}
