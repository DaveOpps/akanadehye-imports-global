"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export default function ProductsFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [q, setQ] = useState(sp.get("q") ?? "");
  const [minPrice, setMinPrice] = useState(sp.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(sp.get("maxPrice") ?? "");
  const minRating = sp.get("minRating") ?? "";
  const sort = sp.get("sort") ?? "";
  const order = sp.get("order") ?? "asc";

  // Debounced search — push URL after 400ms of no typing
  useEffect(() => {
    const id = setTimeout(() => {
      pushParam("q", q);
    }, 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function pushParam(key: string, value: string | null) {
    const next = new URLSearchParams(sp.toString());
    if (value && value.length > 0) next.set(key, value);
    else next.delete(key);
    startTransition(() => {
      router.push(`/products?${next.toString()}`);
    });
  }

  function pushParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v && v.length > 0) next.set(k, v);
      else next.delete(k);
    }
    startTransition(() => {
      router.push(`/products?${next.toString()}`);
    });
  }

  function clearAll() {
    setQ("");
    setMinPrice("");
    setMaxPrice("");
    startTransition(() => {
      router.push("/products");
    });
  }

  const hasFilters = q || minPrice || maxPrice || minRating || sort;

  return (
    <div className="space-y-5">
      {/* Search */}
      <div>
        <label className="block text-xs uppercase tracking-wider text-[color:var(--muted)] font-semibold mb-1.5">
          Search
        </label>
        <div className="relative">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products…"
            className="input pr-9"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded-full hover:bg-[color:var(--brand-cream)] text-[color:var(--muted)]"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Price range */}
      <div>
        <label className="block text-xs uppercase tracking-wider text-[color:var(--muted)] font-semibold mb-1.5">
          Price (USD)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onBlur={() => pushParam("minPrice", minPrice)}
            className="input text-sm"
          />
          <span className="text-[color:var(--muted)] text-xs">to</span>
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={() => pushParam("maxPrice", maxPrice)}
            className="input text-sm"
          />
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="block text-xs uppercase tracking-wider text-[color:var(--muted)] font-semibold mb-2">
          Minimum rating
        </label>
        <div className="space-y-1">
          {[
            { v: "4", label: "4★ & up" },
            { v: "3", label: "3★ & up" },
            { v: "2", label: "2★ & up" },
            { v: "", label: "Any rating" },
          ].map((opt) => (
            <button
              key={opt.v}
              onClick={() => pushParam("minRating", opt.v || null)}
              className={`block w-full text-left px-3 py-1.5 rounded-md text-sm transition ${
                minRating === opt.v
                  ? "bg-[color:var(--brand-navy)] text-white font-semibold"
                  : "hover:bg-[color:var(--brand-cream)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-xs uppercase tracking-wider text-[color:var(--muted)] font-semibold mb-1.5">
          Sort by
        </label>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={sort}
            onChange={(e) => pushParams({ sort: e.target.value || null })}
            className="input text-sm"
          >
            <option value="">Default</option>
            <option value="price">Price</option>
            <option value="rating">Rating</option>
            <option value="title">Name</option>
          </select>
          <select
            value={order}
            onChange={(e) => pushParam("order", e.target.value)}
            className="input text-sm"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      {hasFilters && (
        <button
          onClick={clearAll}
          className="text-sm font-semibold text-[color:var(--brand-clay)] hover:underline"
        >
          Clear all filters
        </button>
      )}

      {pending && (
        <div className="text-xs text-[color:var(--muted)] italic">Updating…</div>
      )}
    </div>
  );
}
