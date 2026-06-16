import Link from "next/link";
import { STOREFRONT_CATEGORIES } from "@/lib/storefront-categories";

export default function CategoryRail() {
  return (
    <nav
      aria-label="Browse categories"
      className="bg-white border-b border-[color:var(--border)] shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-3 lg:px-8">
        <ul className="flex gap-0.5 overflow-x-auto scrollbar-hide py-3">

          {/* "All" chip — always first */}
          <li className="shrink-0">
            <Link
              href="/products"
              className="flex flex-col items-center gap-1.5 w-[88px] px-2 py-2.5 rounded-xl hover:bg-[color:var(--brand-cream)] transition group"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--brand-navy)] text-[color:var(--brand-gold)] transition">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              <span className="text-xs font-bold text-[color:var(--brand-navy)] text-center whitespace-nowrap">
                All
              </span>
            </Link>
          </li>

          {STOREFRONT_CATEGORIES.map((c) => (
            <li key={c.slug} className="shrink-0">
              <Link
                href={`/categories/${c.slug}`}
                className="flex flex-col items-center gap-1.5 w-[88px] px-2 py-2.5 rounded-xl hover:bg-[color:var(--brand-cream)] transition group"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--brand-cream)] border border-[color:var(--border)] text-[color:var(--brand-navy)] group-hover:bg-[color:var(--brand-navy)] group-hover:text-[color:var(--brand-gold)] group-hover:border-[color:var(--brand-navy)] transition">
                  <CategoryIcon name={c.icon} />
                </span>
                <span className="text-xs font-semibold text-[color:var(--brand-navy)] text-center leading-tight">
                  {c.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export function CategoryIcon({ name, size = 22 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    phone: <path d="M7 2h10a2 2 0 012 2v16a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2zM11 18h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    laptop: <path d="M4 5h16v11H4zM2 19h20" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
    tablet: <path d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zM10 18h4" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
    headphones: <path d="M3 14v-3a9 9 0 0118 0v3M3 14a2 2 0 012-2h2v6H5a2 2 0 01-2-2v-2zm18 0a2 2 0 00-2-2h-2v6h2a2 2 0 002-2v-2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
    shirt: <path d="M8 2l4 3 4-3 6 3-2 6h-3v11H7V11H4L2 5l6-3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
    dress: <path d="M9 2h6l-1 5 4 5-2 10H8l-2-10 4-5-1-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
    shoe: <path d="M2 16v3h20v-2c0-2-2-3-4-3l-4-1-3-3-7-1v7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
    sparkle: <path d="M12 3v6m0 6v6m-9-9h6m6 0h6M5.5 5.5l4 4m5 5l4 4m0-13l-4 4m-5 5l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
    flask: <path d="M9 2h6v6l4 8a2 2 0 01-2 3H7a2 2 0 01-2-3l4-8V2zM9 2h6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
    home: <path d="M3 11l9-8 9 8v10a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1V11z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
    kitchen: <path d="M6 2v4l-3 3v13h18V9l-3-3V2M3 13h18" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
    cart: <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6zM3 6h18M16 10a4 4 0 11-8 0" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />,
    dumbbell: <path d="M6 6v12M2 9v6M22 9v6M18 6v12M6 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    tv: <path d="M2 5h20v12H2zM7 21h10M9 17v4M15 17v4" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />,
    fridge: <path d="M5 2h14a1 1 0 011 1v18a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1zM4 10h16M8 6v2M8 14v3" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />,
    baby: <path d="M12 3a4 4 0 014 4M12 3a4 4 0 00-4 4M8 7a8 8 0 0016 0M9 11h.01M15 11h.01M9 15c.6 1.2 1.8 2 3 2s2.4-.8 3-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    gamepad: <path d="M6 12h4M8 10v4M15 12h.01M18 11h.01M3 17l2-8a3 3 0 013-2h8a3 3 0 013 2l2 8a2 2 0 01-2 2c-1 0-2-1-3-2H8c-1 1-2 2-3 2a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
    book: <path d="M4 4v16a2 2 0 002 2h14V2H6a2 2 0 00-2 2zM4 4a2 2 0 002 2h14M8 8h8M8 12h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    paw: <path d="M5 11a2 2 0 100-4 2 2 0 000 4zM19 11a2 2 0 100-4 2 2 0 000 4zM9 7a2 2 0 100-4 2 2 0 000 4zM15 7a2 2 0 100-4 2 2 0 000 4zM6 16a6 6 0 0112 0c0 2-2 4-3 4h-6c-1 0-3-2-3-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
    car: <path d="M5 17h14M5 13l2-6h10l2 6M3 17v3h3v-3M18 17v3h3v-3M7 17a1 1 0 100-2 1 1 0 000 2zM17 17a1 1 0 100-2 1 1 0 000 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />,
    basket: <path d="M5 8h14l-2 12a2 2 0 01-2 2H9a2 2 0 01-2-2L5 8zM3 8h18M9 8V5a3 3 0 016 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    door: <path d="M3 21h18M5 21V4a1 1 0 011-1h12a1 1 0 011 1v17M15 13a1 1 0 11-2 0 1 1 0 012 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    cog: <path d="M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {paths[name]}
    </svg>
  );
}
