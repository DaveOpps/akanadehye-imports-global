import QuoteForm from "./QuoteForm";

export const metadata = {
  title: "Request a Quote — Akanadehye Imports Global",
  description:
    "Get a free, no-obligation freight quote. Ocean, air, and road. We respond in under 24 hours.",
};

export default function QuotePage() {
  return (
    <div className="bg-[color:var(--brand-cream)]">
      <div className="max-w-6xl mx-auto px-5 lg:px-8 py-12 lg:py-16 grid lg:grid-cols-[1fr_2fr] gap-10">
        <aside>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-clay)]">
            Free quote
          </p>
          <h1 className="mt-2 text-3xl lg:text-4xl font-bold text-[color:var(--brand-navy)]">
            Tell us about your shipment.
          </h1>
          <p className="mt-4 text-[color:var(--muted)]">
            Three quick steps. Our trade desk replies with an all-in price
            within 24 hours.
          </p>

          <ul className="mt-8 space-y-4 text-sm">
            {[
              "Transparent, all-in pricing — no hidden fees",
              "Specialists for perishables, hazmat, oversized",
              "Cargo insurance included on request",
              "Dedicated account manager from day one",
            ].map((t) => (
              <li
                key={t}
                className="flex gap-3 text-[color:var(--brand-navy)]"
              >
                <span className="text-[color:var(--brand-gold)] font-bold">
                  ✓
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 p-5 rounded-2xl bg-white border border-[color:var(--border)]">
            <div className="text-sm font-semibold text-[color:var(--brand-navy)]">
              Prefer to call?
            </div>
            <a
              href="tel:+233500000000"
              className="block mt-2 text-lg font-bold text-[color:var(--brand-clay)]"
            >
              +233 50 000 0000
            </a>
            <div className="text-xs text-[color:var(--muted)]">
              Mon–Sat, 7am–8pm GMT
            </div>
          </div>
        </aside>

        <QuoteForm />
      </div>
    </div>
  );
}
