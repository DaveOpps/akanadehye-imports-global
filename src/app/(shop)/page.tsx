export const dynamic = "force-dynamic";

import Link from "next/link";
import { getProducts } from "@/lib/shop-products";
import { PREORDER_LEAD_WORKING_DAYS } from "@/lib/dates";
import { UMBRELLA_CATEGORIES } from "@/lib/storefront-categories";
import CategoryRail from "@/components/CategoryRail";
import PromoStrip from "@/components/PromoStrip";
import ProductRail from "@/components/ProductRail";
import HeroVideo from "@/components/HeroVideo";

// The 8 umbrella categories featured on the home page showcase
const FEATURED_SLUGS = [
  "building-security",
  "machinery-equipment",
  "groceries",
  "mens-shirts",
  "furniture",
  "electronics",
  "sports-accessories",
  "baby-products",
];
const FEATURED_UMBRELLAS = FEATURED_SLUGS
  .map((slug) => UMBRELLA_CATEGORIES.find((u) => u.primarySlug === slug))
  .filter(Boolean) as typeof UMBRELLA_CATEGORIES;

// Banner colour schemes — cycles for each umbrella
const SCHEMES = [
  { grad: "from-green-600 to-green-800",     btn: "text-green-700",   tile: "bg-green-50 border-green-200",   dot: "bg-green-600"   },
  { grad: "from-blue-600 to-blue-800",       btn: "text-blue-700",    tile: "bg-blue-50 border-blue-200",     dot: "bg-blue-600"    },
  { grad: "from-indigo-500 to-indigo-800",   btn: "text-indigo-700",  tile: "bg-indigo-50 border-indigo-200", dot: "bg-indigo-600"  },
  { grad: "from-pink-500 to-pink-700",       btn: "text-pink-700",    tile: "bg-pink-50 border-pink-200",     dot: "bg-pink-500"    },
  { grad: "from-purple-600 to-purple-800",   btn: "text-purple-700",  tile: "bg-purple-50 border-purple-200", dot: "bg-purple-600"  },
  { grad: "from-amber-500 to-amber-700",     btn: "text-amber-700",   tile: "bg-amber-50 border-amber-200",   dot: "bg-amber-500"   },
  { grad: "from-red-500 to-red-700",         btn: "text-red-700",     tile: "bg-red-50 border-red-200",       dot: "bg-red-500"     },
  { grad: "from-teal-600 to-teal-800",       btn: "text-teal-700",    tile: "bg-teal-50 border-teal-200",     dot: "bg-teal-600"    },
];

const testimonials = [
  { name: "Adwoa K.", city: "Accra, Ghana", body: "Finally one app that has everything. Saved me hours of jumping between shops." },
  { name: "Tobi A.", city: "Lagos, Nigeria", body: "Prices are transparent and delivery was faster than I expected." },
  { name: "Kwame O.", city: "Kumasi, Ghana", body: "The wishlist is brilliant. I planned my whole birthday haul on it." },
  { name: "Ama D.", city: "Lomé, Togo", body: "Customer support replied in minutes. Smooth end to end." },
  { name: "Yaw M.", city: "Takoradi, Ghana", body: "Authentic brands, no knock-offs. That alone earned my trust." },
  { name: "Esi B.", city: "Cape Coast, Ghana", body: "I love comparing across categories. My default shopping site now." },
];

export default async function Home() {
  // Fetch product rails in parallel — all from our inventory
  const [latest, agri, food, bags, building] = await Promise.all([
    getProducts({ limit: 60 }).catch(() => ({ products: [] as never[] })),
    getProducts({ category: "agricultural-machinery", limit: 12 }).catch(() => ({ products: [] as never[] })),
    getProducts({ category: "food-processing-machines", limit: 12 }).catch(() => ({ products: [] as never[] })),
    getProducts({ category: "bags-accessories", limit: 12 }).catch(() => ({ products: [] as never[] })),
    getProducts({ category: "building-security", limit: 12 }).catch(() => ({ products: [] as never[] })),
  ]);

  // Build category-slug → thumbnail map for the subcategory tile images
  const thumbMap: Record<string, string> = {};
  for (const p of latest.products) {
    if (!thumbMap[p.category] && p.thumbnail !== "/placeholder.png") {
      thumbMap[p.category] = p.thumbnail;
    }
  }

  return (
    <>
      <CategoryRail />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-20">
          <HeroVideo src="/main-ad.mp4" />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[color:var(--brand-navy)]/85 via-[color:var(--brand-navy)]/70 to-[color:var(--brand-navy)]/85" />

        <div className="relative max-w-7xl mx-auto px-5 lg:px-8 py-16 lg:py-24 text-center text-white">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[color:var(--brand-gold)] text-[color:var(--brand-navy)] text-xs md:text-sm font-extrabold uppercase tracking-[0.12em] mb-5 shadow-lg">
            <span className="h-2 w-2 rounded-full bg-[color:var(--brand-navy)]" />
            Pre-order import service
          </span>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] max-w-4xl mx-auto drop-shadow-lg">
            We Import It For You. Pre-Order Today.
          </h1>
          <p className="mt-5 text-base md:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
            Akanadehye is an <strong className="font-semibold text-white">importing service, not a walk-in shop</strong>.
            You reserve what you need, we source and ship it in — typically within{" "}
            {PREORDER_LEAD_WORKING_DAYS} working days.
          </p>
          <p className="mt-3 text-sm text-white/75 max-w-2xl mx-auto">
            Some items are already in stock and ship immediately. Everything else is pre-order.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 justify-center">
            <Link href="/products" className="btn-gold">
              Start a pre-order →
            </Link>
            <Link
              href="/#how-it-works"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-white/80 text-white font-semibold hover:bg-white hover:text-[color:var(--brand-navy)] transition"
            >
              How pre-ordering works
            </Link>
          </div>
        </div>
      </section>

      {/* HOW PRE-ORDERING WORKS — sits directly under the hero on purpose.
          The business is an import/sourcing service, so the model has to be
          unmissable before anyone starts browsing like it's a normal shop. */}
      <section id="how-it-works" className="bg-[color:var(--brand-navy)] text-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-10 lg:py-14">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              How pre-ordering works
            </h2>
            <p className="mt-3 text-white/80 text-sm md:text-base leading-relaxed">
              Most of what you see here is <strong className="text-[color:var(--brand-gold)] font-semibold">brought in to order</strong>.
              You are reserving stock from our next shipment, not buying off a shelf.
            </p>
          </div>

          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                n: "1",
                title: "Reserve your item",
                body: "Pick what you need and place a pre-order. Full payment up front is what secures your slot in the shipment.",
              },
              {
                n: "2",
                title: "We source and ship",
                body: "Our team buys direct, consolidates your item into the next container, and handles clearing on arrival.",
              },
              {
                n: "3",
                title: "Collect or get it delivered",
                body: `Typically ${PREORDER_LEAD_WORKING_DAYS} working days from payment. We contact you the moment it lands.`,
              },
            ].map((step) => (
              <li
                key={step.n}
                className="rounded-xl bg-white/5 border border-white/15 p-5 backdrop-blur"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--brand-gold)] text-[color:var(--brand-navy)] font-extrabold">
                  {step.n}
                </span>
                <div className="mt-3 font-semibold text-base">{step.title}</div>
                <p className="mt-1.5 text-sm text-white/75 leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>

          <p className="mt-6 text-center text-sm text-white/70">
            Items marked <strong className="text-white font-semibold">In stock</strong> are already
            in Ghana and ship straight away — everything else follows the timeline above.
          </p>
        </div>
      </section>

      <PromoStrip />

      {/* SHOP BY CATEGORY — landing-page style showcase */}
      <section id="categories" className="max-w-7xl mx-auto px-3 lg:px-8 pt-10 pb-4 space-y-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold text-[color:var(--brand-navy)]">
            Browse what we source
          </h2>
          <Link
            href="/products"
            className="text-sm font-semibold text-[color:var(--brand-navy)] hover:text-[color:var(--brand-clay)] transition"
          >
            View all →
          </Link>
        </div>

        {FEATURED_UMBRELLAS.map((umbrella, idx) => {
          const s = SCHEMES[idx % SCHEMES.length];

          // Only show sub-category tiles that actually have products in stock.
          // Most taxonomy slugs (Entry Doors, Corn Shellers, etc.) have no
          // inventory yet — showing them duplicated the same fallback image, so
          // we hide them. Pull from every group in the umbrella, not just the first.
          const tiles: { label: string; slug: string; thumb: string }[] = [];
          const seen = new Set<string>();
          for (const item of umbrella.groups.flatMap((g) => g.items)) {
            const thumb = thumbMap[item.slug];
            if (thumb && !seen.has(item.slug)) {
              seen.add(item.slug);
              tiles.push({ label: item.label, slug: item.slug, thumb });
              if (tiles.length >= 6) break;
            }
          }

          // Nothing in stock under this umbrella — skip the whole section.
          if (tiles.length === 0) return null;

          return (
            <div key={umbrella.primarySlug}>
              {/* Section header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-[color:var(--brand-navy)]">{umbrella.label}</h3>
                <Link
                  href={`/categories/${umbrella.primarySlug}`}
                  className="text-sm font-semibold text-[color:var(--brand-navy)] hover:text-[color:var(--brand-clay)] transition"
                >
                  Browse all →
                </Link>
              </div>

              {/* Banner */}
              <div className={`relative overflow-hidden rounded-xl bg-gradient-to-r ${s.grad} px-6 py-5 text-white mb-4`}>
                <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
                <div className="relative z-10 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-white/60 mb-1">
                      {umbrella.groups[0].title}
                    </p>
                    <h4 className="text-xl font-bold">{umbrella.label}</h4>
                    {umbrella.blurb && (
                      <p className="mt-1 text-sm text-white/75">{umbrella.blurb}</p>
                    )}
                  </div>
                  <Link
                    href={`/products?category=${tiles[0].slug}`}
                    className={`shrink-0 rounded-lg bg-white ${s.btn} px-5 py-2 text-sm font-bold transition hover:opacity-90`}
                  >
                    Shop Now
                  </Link>
                </div>
              </div>

              {/* Sub-category tiles — only ones with real stock */}
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {tiles.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/products?category=${item.slug}`}
                    className={`group flex flex-col gap-2 rounded-xl border ${s.tile} overflow-hidden text-center transition hover:shadow-md`}
                  >
                    <div className="w-full aspect-square overflow-hidden bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.thumb}
                        alt={item.label}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <span className="px-2 pb-2.5 text-xs font-semibold leading-snug text-[color:var(--brand-navy)] transition group-hover:text-[color:var(--brand-clay)]">
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* RAILS */}
      <div className="max-w-7xl mx-auto px-3 lg:px-8 py-8 space-y-6">
        <ProductRail
          title="Latest arrivals"
          products={latest.products}
          seeAllHref="/products"
          accent="clay"
        />

        {/* Featured promo banner */}
        <section className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[color:var(--brand-navy)] to-[color:var(--brand-navy-soft)] text-white p-6 md:p-10 grid md:grid-cols-2 gap-6 items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--brand-gold)] font-bold mb-2">
              Direct from manufacturer
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight leading-tight">
              Quality imports. Competitive prices.
            </h2>
            <p className="mt-3 text-white/80 max-w-md">
              We source directly — machinery, building materials, fashion, food equipment and more. No middlemen.
            </p>
            <Link href="/products" className="btn-gold mt-5 inline-flex">
              Browse all products →
            </Link>
          </div>
          <div className="relative h-40 md:h-56 grid grid-cols-3 gap-3">
            {latest.products.slice(0, 3).map((p, i) => (
              <div
                key={p.id}
                className={`relative rounded-lg overflow-hidden bg-white/10 ${i === 1 ? "md:translate-y-4" : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.thumbnail} alt={p.title} className="object-contain p-3 h-full w-full" />
              </div>
            ))}
          </div>
        </section>

        <ProductRail
          title="Agricultural Machinery"
          products={agri.products}
          seeAllHref="/products?category=agricultural-machinery"
          accent="navy"
        />

        <ProductRail
          title="Food Processing Equipment"
          products={food.products}
          seeAllHref="/products?category=food-processing-machines"
          accent="gold"
        />

        <ProductRail
          title="Bags & Accessories"
          products={bags.products}
          seeAllHref="/products?category=bags-accessories"
          accent="teal"
        />

        <ProductRail
          title="Building & Security"
          products={building.products}
          seeAllHref="/categories/building-security"
          accent="navy"
        />
      </div>

      {/* TESTIMONIALS */}
      <section id="pricing" className="py-14 lg:py-20 bg-[color:var(--brand-cream)]/40">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="chip mb-3">Customer stories</span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Loved by shoppers across the continent.
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="card">
                <div className="text-[color:var(--brand-gold)] text-sm">★★★★★</div>
                <p className="mt-3 text-[color:var(--brand-navy)] leading-relaxed">&ldquo;{t.body}&rdquo;</p>
                <div className="mt-4 pt-3 border-t border-[color:var(--border)]">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs text-[color:var(--muted)]">{t.city}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-5 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-[color:var(--brand-navy)] to-[color:var(--brand-navy-soft)] p-10 md:p-14 text-center text-white">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
              Ready to shop smarter?
            </h2>
            <p className="mt-3 text-white/70 max-w-xl mx-auto">
              Join thousands of shoppers who&apos;ve made Akanadehye their default.
            </p>
            <Link href="/products" className="mt-6 btn-gold">
              Browse all products →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
