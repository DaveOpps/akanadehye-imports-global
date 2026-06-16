"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "./CartContext";
import { useInventory, formatGHS } from "@/lib/store";

/**
 * Rail that surfaces the merchant's own uploaded inventory on the storefront.
 *
 * Reads directly from the localStorage-backed inventory store. Once a product
 * catalog DB is wired (Sprint 1 #38), swap the data source — the rendering
 * stays the same.
 *
 * Hidden entirely until at least one product has been added, so first-time
 * visits stay focused on the marketplace rails.
 */
export default function MerchantProductsRail() {
  const { items, hydrated } = useInventory();
  const { add } = useCart();

  if (!hydrated) return null;

  // Only show items that the merchant has stocked + given a photo
  const sellable = items.filter((i) => i.stock > 0);
  if (sellable.length === 0) return null;

  return (
    <section className="bg-white border border-[color:var(--border)] rounded-xl overflow-hidden">
      <header className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-[color:var(--brand-gold)] to-[color:var(--brand-clay)] text-white">
        <div>
          <h2 className="font-bold text-lg tracking-tight">From our shop</h2>
          <p className="text-xs text-white/80">Hand-picked, in stock, ready to ship.</p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full">
          {sellable.length} listed
        </span>
      </header>

      <div className="flex overflow-x-auto scrollbar-hide divide-x divide-[color:var(--border)]">
        {sellable.map((p) => {
          const primary = p.images?.[0];
          return (
            <article
              key={p.id}
              className="shrink-0 w-48 md:w-56 p-3 hover:bg-[color:var(--brand-cream)]/40 transition group"
            >
              <div className="relative aspect-square bg-[color:var(--brand-cream)] rounded-lg overflow-hidden mb-2">
                {primary ? (
                  <Image
                    src={primary}
                    alt={p.name}
                    fill
                    sizes="224px"
                    className="object-cover group-hover:scale-105 transition"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[color:var(--muted)]">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M14 9a1 1 0 100-2 1 1 0 000 2z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
                {p.salePrice != null && p.salePrice < p.price ? (
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-[color:var(--brand-clay)] text-white text-[10px] font-bold uppercase tracking-wider">
                    Sale −{Math.round((1 - p.salePrice / p.price) * 100)}%
                  </span>
                ) : (
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-[color:var(--brand-navy)] text-white text-[10px] font-bold uppercase tracking-wider">
                    In stock
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
                {p.name}
              </h3>
              {p.description && (
                <p className="mt-1 text-xs text-[color:var(--muted)] line-clamp-2 min-h-[2rem]">
                  {p.description}
                </p>
              )}
              <div className="mt-2 flex items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-[color:var(--brand-navy)] leading-none">
                    {formatGHS(p.salePrice ?? p.price)}
                  </div>
                  {p.salePrice != null && p.salePrice < p.price && (
                    <div className="text-[10px] text-[color:var(--muted)] line-through mt-0.5">
                      {formatGHS(p.price)}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    add({
                      // The cart Item id is numeric (matching the dummyjson catalog),
                      // but for merchant items we use a deterministic large negative
                      // hash so they don't collide. Cart only uses id for grouping.
                      id: hashId(p.id),
                      title: p.name,
                      price: p.salePrice ?? p.price,
                      thumbnail: primary ?? "",
                    })
                  }
                  className="text-xs font-bold bg-[color:var(--brand-navy)] text-white hover:bg-[color:var(--brand-navy-soft)] px-2.5 py-1 rounded transition"
                >
                  Add
                </button>
              </div>
              <div className="text-[10px] text-[color:var(--muted)] mt-1 capitalize">
                {p.category} · {p.stock} available
              </div>
            </article>
          );
        })}
      </div>

      <footer className="px-5 py-2.5 bg-[color:var(--brand-cream)]/40 border-t border-[color:var(--border)] text-right">
        <Link
          href="/products"
          className="text-xs font-semibold text-[color:var(--brand-navy)] hover:text-[color:var(--brand-clay)]"
        >
          Browse the full catalog →
        </Link>
      </footer>
    </section>
  );
}

/** Stable string-to-number hash for cart line identity. */
function hashId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  // Negative range so it never collides with dummyjson positive ids
  return -Math.abs(h || 1);
}
