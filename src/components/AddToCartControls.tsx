"use client";

import { useState } from "react";
import { useCart } from "./CartContext";
import { formatPrice, type Product } from "@/lib/products";

export default function AddToCartControls({ product }: { product: Product }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [flash, setFlash] = useState(false);

  const discounted =
    product.discountPercentage > 0
      ? product.price * (1 - product.discountPercentage / 100)
      : product.price;
  const maxQty = Math.max(1, product.stock);
  const outOfStock = product.stock <= 0;

  function handleAdd() {
    add(
      {
        id: product.id,
        title: product.title,
        price: discounted,
        thumbnail: product.thumbnail,
      },
      qty
    );
    setFlash(true);
    setTimeout(() => setFlash(false), 1800);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-4">
        <div>
          <div className="text-3xl md:text-4xl font-bold text-[color:var(--brand-navy)]">
            {formatPrice(discounted)}
          </div>
          {product.discountPercentage > 0 && (
            <div className="mt-1 text-sm text-[color:var(--muted)]">
              <span className="line-through">{formatPrice(product.price)}</span>{" "}
              <span className="text-[color:var(--brand-clay)] font-semibold">
                save {Math.round(product.discountPercentage)}%
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
            outOfStock
              ? "bg-red-100 text-red-700"
              : product.stock <= 5
              ? "bg-amber-100 text-amber-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {outOfStock
            ? "Out of stock"
            : product.stock <= 5
            ? `Only ${product.stock} left`
            : "In stock"}
        </span>
        <span className="text-[color:var(--brand-gold)]">★</span>
        <span className="font-medium">{product.rating.toFixed(1)}</span>
        {product.reviews && product.reviews.length > 0 && (
          <span className="text-[color:var(--muted)]">({product.reviews.length} reviews)</span>
        )}
      </div>

      {!outOfStock && (
        <div className="flex gap-3">
          <div className="inline-flex items-center border border-[color:var(--border)] rounded-lg bg-white">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              className="px-3 py-2.5 hover:bg-[color:var(--brand-cream)] disabled:opacity-30"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="px-4 py-2.5 min-w-12 text-center font-semibold">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
              disabled={qty >= maxQty}
              className="px-3 py-2.5 hover:bg-[color:var(--brand-cream)] disabled:opacity-30"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <button onClick={handleAdd} className="btn-gold flex-1 justify-center">
            {flash ? "✓ Added to cart" : `Add to cart · ${formatPrice(discounted * qty)}`}
          </button>
        </div>
      )}

      {outOfStock && (
        <button disabled className="btn-outline w-full justify-center opacity-60 cursor-not-allowed">
          Out of stock — notify me
        </button>
      )}
    </div>
  );
}
