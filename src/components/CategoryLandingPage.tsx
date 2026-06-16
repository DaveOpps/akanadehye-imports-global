import Link from "next/link";
import type { UmbrellaCategory } from "@/lib/storefront-categories";

const SCHEMES = [
  { grad: "from-amber-500 to-amber-700",     btn: "text-amber-700",   tile: "bg-amber-50 border-amber-200",   dot: "bg-amber-500"   },
  { grad: "from-teal-600 to-teal-800",       btn: "text-teal-700",    tile: "bg-teal-50 border-teal-200",     dot: "bg-teal-600"    },
  { grad: "from-indigo-500 to-indigo-800",   btn: "text-indigo-700",  tile: "bg-indigo-50 border-indigo-200", dot: "bg-indigo-600"  },
  { grad: "from-rose-500 to-rose-700",       btn: "text-rose-700",    tile: "bg-rose-50 border-rose-200",     dot: "bg-rose-500"    },
  { grad: "from-emerald-600 to-emerald-800", btn: "text-emerald-700", tile: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-600" },
  { grad: "from-violet-600 to-violet-800",   btn: "text-violet-700",  tile: "bg-violet-50 border-violet-200", dot: "bg-violet-600"  },
];

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[color:var(--brand-gold)]">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CategoryLandingPage({ umbrella }: { umbrella: UmbrellaCategory }) {
  return (
    <div className="space-y-10">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-[color:var(--brand-navy)] px-8 py-10 text-white">
        {/* decorative circles */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute right-8 bottom-0 h-36 w-36 rounded-full bg-[color:var(--brand-gold)]/10" />

        <div className="relative z-10">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[color:var(--brand-gold)]">
            Category
          </p>
          <h1 className="text-3xl font-bold lg:text-4xl">{umbrella.label}</h1>
          {umbrella.blurb && (
            <p className="mt-2 text-base text-white/70">{umbrella.blurb}</p>
          )}

          {/* Trust badges */}
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {["Premium Quality Products", "Fast Delivery Available", "Secure Shopping"].map((badge) => (
              <span key={badge} className="flex items-center gap-2">
                <CheckIcon />
                <span className="text-white/80">{badge}</span>
              </span>
            ))}
          </div>

          {/* CTA */}
          <Link
            href={`/products?category=${umbrella.primarySlug}&sort=rating&order=desc`}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[color:var(--brand-gold)] px-5 py-2.5 text-sm font-bold text-[color:var(--brand-navy)] transition hover:opacity-90"
          >
            Shop All {umbrella.label}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>

      {/* ── Subcategory groups ── */}
      {umbrella.groups.map((group, idx) => {
        const s = SCHEMES[idx % SCHEMES.length];
        // Prefer "All X" item for the "Shop Now" link, fall back to last item
        const shopSlug =
          group.items.find((i) => i.label.toLowerCase().startsWith("all"))?.slug ??
          group.items[group.items.length - 1]?.slug ??
          umbrella.primarySlug;

        return (
          <section key={group.title}>
            {/* Banner card */}
            <div className={`relative overflow-hidden rounded-xl bg-gradient-to-r ${s.grad} px-6 py-5 text-white`}>
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">{group.title}</h2>
                  <p className="mt-1 text-sm text-white/70">
                    Explore our {group.title.toLowerCase()} collection
                  </p>
                </div>
                <Link
                  href={`/products?category=${shopSlug}`}
                  className={`shrink-0 rounded-lg bg-white ${s.btn} px-5 py-2 text-sm font-bold transition hover:opacity-90`}
                >
                  Shop Now
                </Link>
              </div>
            </div>

            {/* Sub-category tiles */}
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {group.items.slice(0, 6).map((item) => (
                <Link
                  key={item.slug}
                  href={`/products?category=${item.slug}`}
                  className={`group flex flex-col items-center gap-2.5 rounded-xl border ${s.tile} p-3 text-center transition hover:shadow-md`}
                >
                  {/* Initial avatar */}
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-full ${s.dot} text-sm font-bold text-white shadow-sm`}
                  >
                    {item.label.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold leading-snug text-[color:var(--brand-navy)] transition group-hover:text-[color:var(--brand-clay)]">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
