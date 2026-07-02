"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "./CartContext";
import { formatPrice, type Product } from "@/lib/products";

export default function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const discounted =
    product.discountPercentage > 0
      ? product.price * (1 - product.discountPercentage / 100)
      : product.price;

  function addToCart() {
    add({
      id: product.id,
      title: product.title,
      price: discounted,
      thumbnail: product.thumbnail,
    });
  }

  return (
    <div className="group bg-white border border-[color:var(--border)] rounded-xl overflow-hidden hover:shadow-xl transition flex flex-col">
      {/* Image */}
      <Link href={`/products/${product.id}`} className="relative aspect-square bg-[color:var(--brand-cream)] overflow-hidden block shrink-0">
        <Image
          src={product.thumbnail}
          alt={product.title}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-contain p-4 group-hover:scale-105 transition"
          unoptimized
        />
        {/* Discount badge — only renders when genuinely > 0 */}
        {product.discountPercentage > 0 && (
          <span className="absolute top-3 left-3 px-2 py-1 rounded-md bg-[color:var(--brand-clay)] text-white text-[11px] font-bold leading-none">
            -{Math.round(product.discountPercentage)}%
          </span>
        )}
        {/* Pre-order sign — reserve now, pay on arrival */}
        {product.preorderable && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[color:var(--brand-navy)] text-[color:var(--brand-gold)] text-[10px] font-bold uppercase tracking-wide leading-none shadow">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Pre-order
          </span>
        )}
      </Link>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        {/* Brand */}
        {product.brand && (
          <div className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--brand-gold)]">
            {product.brand}
          </div>
        )}

        {/* Title */}
        <Link href={`/products/${product.id}`} className="hover:text-[color:var(--brand-clay)] transition">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-[color:var(--brand-navy)]">
            {product.title}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 text-xs text-[color:var(--muted)]">
          <span className="text-[color:var(--brand-gold)]">★</span>
          <span className="font-medium text-[color:var(--brand-navy)]">{product.rating.toFixed(1)}</span>
          {product.stock > 0 ? (
            <span>· {product.stock} in stock</span>
          ) : product.preorderable ? (
            <span className="text-[color:var(--brand-navy)] font-semibold">· Reserve — pay on arrival</span>
          ) : (
            <span className="text-[color:var(--brand-clay)]">· Out of stock</span>
          )}
        </div>

        {/* Price */}
        <div className="mt-auto pt-2">
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-base text-[color:var(--brand-navy)]">
              {formatPrice(discounted)}
            </span>
            {product.discountPercentage > 0 && (
              <span className="text-xs text-[color:var(--muted)] line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 mt-3">
            <Link
              href={`/products/${product.id}`}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[color:var(--border)] text-xs font-semibold text-[color:var(--brand-navy)] hover:border-[color:var(--brand-navy)] hover:bg-[color:var(--brand-cream)] transition"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
              </svg>
              View
            </Link>
            {product.stock === 0 && product.preorderable ? (
              <Link
                href={`/products/${product.id}`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[color:var(--brand-gold)] text-[color:var(--brand-navy)] text-xs font-bold hover:brightness-105 transition"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Pre-order
              </Link>
            ) : (
              <button
                onClick={addToCart}
                disabled={product.stock === 0}
                aria-label={`Add ${product.title} to basket`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[color:var(--brand-navy)] text-white text-xs font-bold hover:bg-[color:var(--brand-navy-soft)] disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6zM3 6h18M16 10a4 4 0 11-8 0" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
                Basket
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
