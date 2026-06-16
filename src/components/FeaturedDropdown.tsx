"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// Each item carries a `category` slug — used to pick a product thumbnail from inventory
const LEFT_ITEMS = [
  { label: "Featured",           href: "/products",                                      icon: "featured", category: ""                        },
  { label: "Trending Now",       href: "/products?sort=rating&order=desc",               icon: "trending", category: "agricultural-machinery"   },
  { label: "New Arrivals",       href: "/products?sort=id&order=desc",                   icon: "new",      category: "food-processing-machines"  },
  { label: "Best Sellers",       href: "/products?sort=rating&order=desc",               icon: "star",     category: "bags-accessories"          },
  { label: "Special Deals",      href: "/products?sort=discountPercentage&order=desc",   icon: "tag",      category: "drinkware-tumblers"        },
  { label: "Gift Ideas",         href: "/products?category=drinkware-tumblers",          icon: "gift",     category: "electronics-gadgets"       },
  { label: "Premium Collection", href: "/products?category=security-doors-gates",        icon: "gem",      category: "security-doors-gates"      },
];

const QUICK_ACCESS = [
  { label: "Trending Now",   desc: "Popular products right now",  href: "/products?sort=rating&order=desc",             icon: "trending", category: "agricultural-machinery"  },
  { label: "New Arrivals",   desc: "Latest products added",       href: "/products?sort=id&order=desc",                 icon: "new",      category: "food-processing-machines" },
  { label: "Best Sellers",   desc: "Most popular products",       href: "/products?sort=rating&order=desc",             icon: "star",     category: "bags-accessories"         },
  { label: "Special Deals",  desc: "Limited time offers",         href: "/products?sort=discountPercentage&order=desc", icon: "tag",      category: "drinkware-tumblers"       },
];

const SPECIAL_COLLECTIONS = [
  { label: "Gift Ideas",         desc: "Perfect gifts for everyone",  href: "/products?category=drinkware-tumblers",    category: "drinkware-tumblers"   },
  { label: "Premium Collection", desc: "High-end quality products",   href: "/products?category=security-doors-gates",  category: "security-doors-gates" },
  { label: "Limited Edition",    desc: "Exclusive limited items",     href: "/products?category=electronics-gadgets",   category: "electronics-gadgets"  },
  { label: "Flash Sale",         desc: "Time-sensitive deals",        href: "/products?category=building-materials",    category: "building-materials"   },
  { label: "Customer Favorites", desc: "Most wishlisted items",       href: "/products?category=footwear",              category: "footwear"             },
];

type InventoryItem = { id: string; images: string[]; category: string };

export default function FeaturedDropdown() {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState("Featured");
  const [thumbMap, setThumbMap] = useState<Record<string, string>>({});
  const ref = useRef<HTMLDivElement>(null);

  // Fetch product thumbnails once when the dropdown first opens
  const fetchedRef = useRef(false);
  useEffect(() => {
    if (!open || fetchedRef.current) return;
    fetchedRef.current = true;
    fetch("/api/inventory?limit=60")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then(({ items }: { items: InventoryItem[] }) => {
        const map: Record<string, string> = {};
        for (const item of items) {
          if (item.images?.length > 0) {
            const slug = item.category
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "");
            if (!map[slug]) {
              map[slug] = `/api/products/${item.id}/image?i=0`;
            }
          }
        }
        setThumbMap(map);
      })
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded transition ${
          open
            ? "text-[color:var(--brand-clay)] bg-[color:var(--brand-cream)]"
            : "text-[color:var(--brand-navy)] hover:bg-[color:var(--brand-cream)]"
        }`}
      >
        Featured
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Mega panel */}
      {open && (
        <div
          className="absolute top-full left-0 mt-1.5 flex rounded-2xl shadow-2xl overflow-hidden border border-[color:var(--border)] z-50"
          style={{ width: 780, maxHeight: "80vh" }}
        >
          {/* ── Left panel (navy sidebar) ── */}
          <div className="w-52 shrink-0 bg-[color:var(--brand-navy)] py-3 overflow-y-auto">
            {LEFT_ITEMS.map((item) => {
              const thumb = thumbMap[item.category] ?? null;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  onMouseEnter={() => setHovered(item.label)}
                  className={`flex items-center gap-3 px-4 py-2 text-sm transition ${
                    hovered === item.label
                      ? "bg-white/10 text-white"
                      : "text-white/65 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {thumb ? (
                    <div className="h-8 w-8 shrink-0 rounded-lg overflow-hidden border border-white/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumb} alt={item.label} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <span className={`shrink-0 transition ${hovered === item.label ? "text-[color:var(--brand-gold)]" : "text-white/50"}`}>
                      <DropIcon name={item.icon} />
                    </span>
                  )}
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* ── Right panel (white content) ── */}
          <div className="flex-1 bg-white p-5 overflow-y-auto">
            {/* Header */}
            <div className="mb-4">
              <h3 className="text-base font-bold text-[color:var(--brand-navy)]">Featured Collections</h3>
              <p className="text-xs text-[color:var(--muted)] mt-0.5">Discover our curated selections and special offers</p>
            </div>

            {/* Quick Access */}
            <div className="mb-5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted)] mb-2.5 pb-1.5 border-b border-[color:var(--border)]">
                Quick Access
              </div>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACCESS.map((q) => {
                  const thumb = thumbMap[q.category] ?? null;
                  return (
                    <Link
                      key={q.label}
                      href={q.href}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-2.5 p-3 rounded-xl border border-[color:var(--border)] hover:border-[color:var(--brand-navy)]/30 hover:bg-[color:var(--brand-cream)] transition group overflow-hidden"
                    >
                      {thumb ? (
                        <div className="h-14 w-14 shrink-0 rounded-lg overflow-hidden border border-[color:var(--border)] bg-[color:var(--brand-cream)]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={thumb} alt={q.label} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200" />
                        </div>
                      ) : (
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color:var(--brand-cream)] text-[color:var(--brand-navy)] group-hover:bg-[color:var(--brand-navy)] group-hover:text-[color:var(--brand-gold)] transition">
                          <DropIcon name={q.icon} />
                        </span>
                      )}
                      <div>
                        <div className="text-xs font-bold text-[color:var(--brand-navy)] leading-tight">{q.label}</div>
                        <div className="text-[10px] text-[color:var(--muted)] leading-snug mt-0.5">{q.desc}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Special Collections */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted)] mb-2.5 pb-1.5 border-b border-[color:var(--border)]">
                Special Collections
              </div>
              <div className="space-y-0.5">
                {SPECIAL_COLLECTIONS.map((s) => {
                  const thumb = thumbMap[s.category] ?? null;
                  return (
                    <Link
                      key={s.label}
                      href={s.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-[color:var(--brand-cream)] transition group"
                    >
                      <div className="flex items-center gap-2.5">
                        {thumb ? (
                          <div className="h-8 w-8 shrink-0 rounded-md overflow-hidden border border-[color:var(--border)]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={thumb} alt={s.label} className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <span className="text-[color:var(--brand-gold)]">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          </span>
                        )}
                        <span className="text-xs font-semibold text-[color:var(--brand-navy)]">{s.label}</span>
                      </div>
                      <span className="text-[10px] text-[color:var(--muted)] group-hover:text-[color:var(--brand-navy)] transition">{s.desc}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Footer link */}
            <div className="mt-4 pt-3 border-t border-[color:var(--border)]">
              <Link href="/products" onClick={() => setOpen(false)} className="text-xs font-bold text-[color:var(--brand-gold)] hover:underline underline-offset-2">
                View All Featured Products →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DropIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    featured: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" />,
    trending: <path d="M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    new:      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
    star:     <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
    tag:      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    gift:     <path d="M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
    gem:      <path d="M6 3h12l4 6-10 13L2 9l4-6zM2 9h20M12 22L6 9M12 22l6-13M12 3l-6 6M12 3l6 6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
  };
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      {paths[name] ?? null}
    </svg>
  );
}
