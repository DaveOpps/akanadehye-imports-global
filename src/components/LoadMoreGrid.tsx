"use client";

import { useState } from "react";
import ProductCard from "./ProductCard";
import type { Product, ProductsResponse } from "@/lib/products";

export default function LoadMoreGrid({
  initial,
  query,
}: {
  initial: ProductsResponse;
  query: Record<string, string | undefined>;
}) {
  const [items, setItems] = useState<Product[]>(initial.products);
  const [total, setTotal] = useState(initial.total);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PAGE_SIZE = 24;
  const hasMore = items.length < total;

  async function loadMore() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) {
        if (v) params.set(k, v);
      }
      params.set("skip", String(items.length));
      params.set("limit", String(PAGE_SIZE));

      const res = await fetch(`/api/products/list?${params}`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data: ProductsResponse = await res.json();
      setItems((prev) => [...prev, ...data.products]);
      setTotal(data.total);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    const hasFilters = !!(query.q || query.minPrice || query.maxPrice || query.minRating);
    return (
      <div className="text-center py-20 border border-dashed border-[color:var(--border)] rounded-2xl">
        <div className="text-5xl mb-4">{hasFilters ? "🔍" : "📦"}</div>
        <h3 className="font-bold text-lg">
          {hasFilters ? "No products match your filters" : "Stocking this category soon"}
        </h3>
        <p className="mt-1 text-sm text-[color:var(--muted)] max-w-md mx-auto">
          {hasFilters
            ? "Try widening your search or clearing filters in the sidebar."
            : "We're adding products here shortly. Browse our other categories in the meantime."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      <div className="mt-10 text-center">
        {hasMore ? (
          <button
            onClick={loadMore}
            disabled={loading}
            className="btn-outline disabled:opacity-50"
          >
            {loading ? "Loading…" : `Load more · ${total - items.length} remaining`}
          </button>
        ) : (
          <div className="text-sm text-[color:var(--muted)]">You&apos;ve reached the end</div>
        )}
        {error && <div className="mt-3 text-sm text-[color:var(--brand-clay)]">{error}</div>}
      </div>
    </>
  );
}
