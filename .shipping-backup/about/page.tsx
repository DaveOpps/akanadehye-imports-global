export const metadata = {
  title: "About — Akanadehye Imports Global",
  description:
    "Born on the floors of Tema Port. 18 years moving Ghana's goods to the world and back.",
};

export default function AboutPage() {
  return (
    <>
      <section className="bg-[color:var(--brand-navy)] text-white py-16 lg:py-20">
        <div className="max-w-5xl mx-auto px-5 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-gold)]">
            About Akanadehye
          </p>
          <h1 className="mt-2 text-4xl lg:text-6xl font-bold leading-tight">
            We built this company on the docks.
          </h1>
          <p className="mt-5 max-w-2xl text-white/75 text-lg leading-relaxed">
            Not from a glass office. Not from a textbook. From eighteen years
            on the floors of Tema Port, watching how cargo really moves — and
            how it gets stuck.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-5 lg:px-8 prose prose-lg">
          <h2 className="text-3xl font-bold text-[color:var(--brand-navy)]">
            Our story
          </h2>
          <p className="text-[color:var(--muted)] leading-relaxed mt-3">
            Akanadehye Imports Global was founded in 2007 by a small team of
            ex-shipping line agents and customs brokers in Tema. We&apos;d
            spent years watching honest traders lose money to demurrage,
            misclassified duties, and freight forwarders who disappeared
            after taking deposits. We knew we could do better.
          </p>
          <p className="text-[color:var(--muted)] leading-relaxed mt-3">
            Today we clear over 8,000 shipments a year, run bonded warehouses
            in four cities, and ship to 120+ countries. We&apos;re still
            family-run. We still answer the phone. And we still know
            everyone&apos;s name at the port.
          </p>

          <h2 className="text-3xl font-bold text-[color:var(--brand-navy)] mt-12">
            What we believe
          </h2>
          <ul className="mt-4 space-y-4">
            {[
              {
                t: "Transparency over markup.",
                d: "You see every line item — freight, duty, handling, last mile. No surprise invoices.",
              },
              {
                t: "Time is money — yours.",
                d: "Every day your container sits is money lost. We move fast and we tell you why if we can't.",
              },
              {
                t: "Africa first, always.",
                d: "Ghana-owned, Ghana-staffed. Our profits stay here and our people grow here.",
              },
              {
                t: "Technology serves people.",
                d: "Live tracking, SMS milestones, online quotes. Tools that save you phone calls — not ones that hide us behind a chatbot.",
              },
            ].map((v) => (
              <li key={v.t} className="flex gap-4">
                <div className="w-1.5 self-stretch bg-[color:var(--brand-gold)] rounded-full" />
                <div>
                  <div className="font-bold text-[color:var(--brand-navy)]">
                    {v.t}
                  </div>
                  <div className="text-[color:var(--muted)] mt-1">{v.d}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-14 bg-[color:var(--brand-cream)]">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          {[
            { n: "2007", l: "Year founded" },
            { n: "82,000+", l: "Shipments cleared" },
            { n: "4 cities", l: "Warehouses in Ghana" },
            { n: "120+", l: "Destination countries" },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-4xl lg:text-5xl font-bold text-[color:var(--brand-navy)]">
                {s.n}
              </div>
              <div className="mt-2 text-sm uppercase tracking-wider text-[color:var(--muted)]">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
