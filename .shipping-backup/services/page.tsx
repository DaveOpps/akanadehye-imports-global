import Link from "next/link";

export const metadata = {
  title: "Services — Akanadehye Imports Global",
  description:
    "Ocean freight, air cargo, customs clearance, warehousing, and last-mile delivery — built for Ghanaian importers and exporters going global.",
};

const SERVICES = [
  {
    id: "ocean",
    title: "Ocean Freight",
    tag: "FCL · LCL · Reefer",
    blurb:
      "Weekly sailings from Tema and Takoradi to every major port. Full containers (FCL), shared containers (LCL), and refrigerated reefer service for perishables.",
    features: [
      "20-ft, 40-ft, and 40-ft HQ containers",
      "Direct relationships with Maersk, MSC, CMA CGM, Hapag-Lloyd",
      "Container loading supervision at origin",
      "Bill of lading & shipping document preparation",
    ],
  },
  {
    id: "air",
    title: "Air Cargo",
    tag: "Standard · Express · Perishable",
    blurb:
      "Same-week air freight via Kotoka, Doha, Dubai, and Heathrow hubs. Specialised handling for perishables, pharmaceuticals, and dangerous goods.",
    features: [
      "Cold-chain ULDs for fresh produce, pharma, and seafood",
      "Charter service for outsized or urgent cargo",
      "IATA-certified DG packing and documentation",
      "Door-to-door air with customs included",
    ],
  },
  {
    id: "customs",
    title: "Customs Clearance",
    tag: "ICUMS · GCNet · UNIPASS",
    blurb:
      "In-house licensed brokers cut Tema clearance from days to hours. We handle duty calculation, classification, exemptions, and inspections.",
    features: [
      "ICUMS-registered customs brokers on staff",
      "HS code classification & duty optimisation",
      "Free Zone, VAT relief, and exemption handling",
      "Pre-arrival document review to avoid demurrage",
    ],
  },
  {
    id: "warehousing",
    title: "Warehousing & Distribution",
    tag: "Bonded · CFS · 3PL",
    blurb:
      "Bonded and general warehousing in Tema, Accra, Kumasi, and Takoradi. Pick-and-pack, cross-dock, and inventory management included.",
    features: [
      "24/7 secured facilities with CCTV and armed patrol",
      "Bonded warehouse for duty-deferred storage",
      "Cross-docking and consolidation services",
      "Real-time inventory via client portal",
    ],
  },
  {
    id: "lastmile",
    title: "Last-Mile Delivery",
    tag: "Ghana-wide · 120+ countries",
    blurb:
      "Door-to-door across all 16 regions of Ghana, plus partner networks in 120 countries. SMS notifications and proof of delivery on every drop.",
    features: [
      "Same-day delivery in Accra and Tema",
      "Tail-lift trucks for heavy or palletised cargo",
      "Signed proof of delivery (photo + signature)",
      "International door-to-door via DHL, FedEx, UPS partners",
    ],
  },
  {
    id: "ecommerce",
    title: "E-commerce Fulfilment",
    tag: "Coming soon",
    blurb:
      "End-to-end fulfilment for online sellers — receiving, storage, pick-pack, branded packaging, and shipping to your customers across Africa.",
    features: [
      "Shopify, WooCommerce, and Jumia integrations",
      "Branded box and insert customisation",
      "Returns processing and re-shelving",
      "Per-order pricing — pay only when you ship",
    ],
  },
];

export default function ServicesPage() {
  return (
    <>
      <section className="bg-[color:var(--brand-navy)] text-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-gold)]">
            Services
          </p>
          <h1 className="mt-2 text-4xl lg:text-6xl font-bold leading-tight max-w-3xl">
            One partner. Every leg of the journey.
          </h1>
          <p className="mt-5 max-w-2xl text-white/75 text-lg leading-relaxed">
            Pickup. Freight. Customs. Warehouse. Doorstep. We own every step
            so you don&apos;t have to chase six different vendors.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 space-y-12">
          {SERVICES.map((s, i) => (
            <article
              key={s.id}
              id={s.id}
              className={`grid lg:grid-cols-[1fr_2fr] gap-8 items-start scroll-mt-24 ${
                i % 2 === 1 ? "lg:grid-cols-[2fr_1fr] lg:[&>div:first-child]:order-2" : ""
              }`}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--brand-clay)]">
                  0{i + 1} · {s.tag}
                </p>
                <h2 className="mt-2 text-3xl font-bold text-[color:var(--brand-navy)]">
                  {s.title}
                </h2>
                <p className="mt-3 text-[color:var(--muted)] leading-relaxed">
                  {s.blurb}
                </p>
                <Link
                  href="/quote"
                  className="mt-5 inline-flex text-sm font-semibold text-[color:var(--brand-clay)] hover:underline"
                >
                  Get a quote for {s.title.toLowerCase()} →
                </Link>
              </div>
              <div className="bg-[color:var(--brand-cream)] rounded-2xl border border-[color:var(--border)] p-7">
                <h3 className="font-semibold text-[color:var(--brand-navy)] mb-4">
                  What&apos;s included
                </h3>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {s.features.map((f) => (
                    <li
                      key={f}
                      className="flex gap-2.5 text-sm text-[color:var(--brand-navy)]"
                    >
                      <span className="text-[color:var(--brand-gold)] font-bold mt-0.5">
                        ✓
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="py-16 bg-[color:var(--brand-navy)] text-white">
        <div className="max-w-5xl mx-auto px-5 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold">
            Not sure which service fits?
          </h2>
          <p className="mt-3 text-white/75">
            Tell us what you&apos;re moving — we&apos;ll recommend the right
            mode and quote it.
          </p>
          <Link href="/quote" className="btn-gold mt-7 inline-flex">
            Talk to a specialist →
          </Link>
        </div>
      </section>
    </>
  );
}
