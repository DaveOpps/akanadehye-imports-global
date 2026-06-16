import { Suspense } from "react";
import Link from "next/link";
import { getProducts } from "@/lib/shop-products";
import {
  UMBRELLA_CATEGORIES,
  findUmbrellaForSlug,
  findCategoryLabel,
} from "@/lib/storefront-categories";
import ProductsFilters from "@/components/ProductsFilters";
import LoadMoreGrid from "@/components/LoadMoreGrid";

export const metadata = {
  title: "Shop — Akanadehye",
  description: "Browse our full catalog — electronics, fashion, beauty, and more.",
};

type SP = Promise<{
  category?: string;
  sort?: string;
  order?: string;
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
}>;

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
  const params = await searchParams;
  const category = params.category;
  const sort = params.sort;
  const order = (params.order as "asc" | "desc") || undefined;
  const q = params.q;
  const minPrice = params.minPrice ? Number(params.minPrice) : undefined;
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined;
  const minRating = params.minRating ? Number(params.minRating) : undefined;

  const PAGE_SIZE = 24;

  const initial = await getProducts({
    category,
    sort,
    order,
    q,
    limit: PAGE_SIZE,
    minPrice,
    maxPrice,
    minRating,
  });

  const activeCategoryName = findCategoryLabel(category);
  const activeUmbrella = findUmbrellaForSlug(category);

  return (
    <div className="max-w-7xl mx-auto px-5 lg:px-8 py-10 lg:py-14">
      <header className="mb-8">
        <nav className="text-xs text-[color:var(--muted)] mb-3 flex items-center gap-1.5 flex-wrap" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[color:var(--brand-navy)]">Home</Link>
          <span className="text-[color:var(--border)]">/</span>
          {activeUmbrella && activeUmbrella.primarySlug !== category && (
            <>
              <Link
                href={`/categories/${activeUmbrella.primarySlug}`}
                className="hover:text-[color:var(--brand-navy)]"
              >
                {activeUmbrella.label}
              </Link>
              <span className="text-[color:var(--border)]">/</span>
            </>
          )}
          <span className="text-[color:var(--brand-navy)] font-medium capitalize">{activeCategoryName}</span>
          {q && (
            <>
              <span className="text-[color:var(--border)]">/</span>
              <span className="text-[color:var(--brand-navy)]">&ldquo;{q}&rdquo;</span>
            </>
          )}
        </nav>
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
          {q ? `Results for "${q}"` : activeCategoryName}
        </h1>
        <p className="mt-2 text-[color:var(--muted)]">
          Browse our full catalog — electronics, fashion, beauty, and more.
        </p>
      </header>

      <div className="grid lg:grid-cols-[280px_1fr] gap-8">
        {/* SIDEBAR */}
        <aside className="lg:sticky lg:top-20 lg:self-start space-y-6">
          <div className="border border-[color:var(--border)] rounded-xl bg-white overflow-hidden">
            <div className="px-4 py-3 bg-[color:var(--brand-cream)] border-b border-[color:var(--border)]">
              <h2 className="font-semibold text-xs uppercase tracking-wider text-[color:var(--muted)]">
                Categories
              </h2>
            </div>
            <nav className="p-2 max-h-[70vh] overflow-y-auto">
              <Link
                href="/products"
                className={`block px-3 py-1.5 rounded-md text-sm hover:bg-[color:var(--brand-cream)] ${
                  !category ? "bg-[color:var(--brand-navy)] text-white font-semibold" : ""
                }`}
              >
                All products
              </Link>

              {UMBRELLA_CATEGORIES.map((u) => {
                const isActiveUmbrella = activeUmbrella?.label === u.label;
                const isPrimaryActive = category === u.primarySlug;
                return (
                  <div key={u.label} className="mt-2">
                    <Link
                      href={`/categories/${u.primarySlug}`}
                      className={`block px-3 py-1.5 rounded-md text-sm font-semibold transition ${
                        isPrimaryActive
                          ? "bg-[color:var(--brand-navy)] text-white"
                          : isActiveUmbrella
                          ? "text-[color:var(--brand-navy)] bg-[color:var(--brand-cream)]"
                          : "text-[color:var(--brand-navy)] hover:bg-[color:var(--brand-cream)]"
                      }`}
                    >
                      {u.label}
                    </Link>

                    {/* Auto-expand subcategories for the active umbrella */}
                    {isActiveUmbrella && (
                      <div className="mt-1 ml-3 pl-3 border-l-2 border-[color:var(--brand-cream)] space-y-2">
                        {u.groups.map((g) => (
                          <div key={g.title}>
                            <div className="px-3 py-1 text-[10px] uppercase tracking-[0.1em] text-[color:var(--muted)] font-bold">
                              {g.title}
                            </div>
                            <ul>
                              {g.items.map((item, idx) => {
                                const isActiveItem = category === item.slug && !isPrimaryActive;
                                return (
                                  <li key={`${g.title}-${item.slug}-${idx}`}>
                                    <Link
                                      href={`/products?category=${item.slug}`}
                                      className={`block px-3 py-1 rounded-md text-xs transition ${
                                        isActiveItem
                                          ? "bg-[color:var(--brand-navy)] text-white font-semibold"
                                          : "text-[color:var(--brand-navy)]/85 hover:bg-[color:var(--brand-cream)] hover:text-[color:var(--brand-navy)]"
                                      }`}
                                    >
                                      {item.label}
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="border border-[color:var(--border)] rounded-xl bg-white p-5">
            <h2 className="font-semibold text-xs uppercase tracking-wider text-[color:var(--muted)] mb-4">
              Refine
            </h2>
            <Suspense>
              <ProductsFilters />
            </Suspense>
          </div>
        </aside>

        {/* GRID */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="text-sm text-[color:var(--muted)]">
              <span className="font-semibold text-[color:var(--brand-navy)]">{initial.total}</span>{" "}
              product{initial.total === 1 ? "" : "s"} found
            </div>
          </div>

          <LoadMoreGrid
            initial={initial}
            query={{ category, sort, order, q, minPrice: params.minPrice, maxPrice: params.maxPrice, minRating: params.minRating }}
          />
        </div>
      </div>
    </div>
  );
}
