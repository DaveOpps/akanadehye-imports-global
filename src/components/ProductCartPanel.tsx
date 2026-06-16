"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "./CartContext";
import { formatPrice, discountedPrice, type Product } from "@/lib/products";

const WISHLIST_KEY = "akanadehye-wishlist-v1";

function loadWishlist(): (string | number)[] {
  try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) ?? "[]"); } catch { return []; }
}
function saveWishlist(ids: (string | number)[]) {
  try { localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids)); } catch {}
}

export default function ProductCartPanel({ product }: { product: Product }) {
  const { add, items, count, subtotal } = useCart();
  const [qty, setQty] = useState(1);
  const [flash, setFlash] = useState(false);

  // Wishlist
  const [wished, setWished] = useState(false);
  useEffect(() => {
    setWished(loadWishlist().includes(product.id));
  }, [product.id]);
  function toggleWishlist() {
    const current = loadWishlist();
    const next = current.includes(product.id)
      ? current.filter((id) => id !== product.id)
      : [...current, product.id];
    saveWishlist(next);
    setWished(next.includes(product.id));
  }

  // Share
  const [shareLabel, setShareLabel] = useState("Share");
  async function handleShare() {
    const url = window.location.href;
    const shareData = {
      title: product.title,
      text: `${product.title} — ${product.description.slice(0, 100)}…\n\n${formatPrice(discountedPrice(product))}`,
      url,
    };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled — do nothing
      }
    } else {
      // Fallback: copy link to clipboard
      try {
        await navigator.clipboard.writeText(
          `${product.title}\n${formatPrice(discountedPrice(product))}\n${url}\n\nShop at Akanadehye: ${window.location.origin}`
        );
        setShareLabel("Link copied!");
        setTimeout(() => setShareLabel("Share"), 2200);
      } catch {
        setShareLabel("Copy failed");
        setTimeout(() => setShareLabel("Share"), 2200);
      }
    }
  }

  const price = discountedPrice(product);
  const maxQty = Math.max(1, product.stock);
  const outOfStock = product.stock <= 0;
  const inCart = items.find((i) => i.id === product.id);

  function handleAdd() {
    add(
      {
        id: product.id,
        title: product.title,
        price,
        thumbnail: product.thumbnail,
      },
      qty
    );
    setFlash(true);
    setTimeout(() => setFlash(false), 1800);
  }

  return (
    <div className="space-y-4">
      {/* Add-to-cart card */}
      <div className="rounded-xl border border-[color:var(--border)] bg-white p-5 space-y-4">
        <div>
          <div className="text-3xl font-bold text-[color:var(--brand-navy)] leading-none">
            {formatPrice(price)}
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
        </div>

        {!outOfStock && (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-[color:var(--muted)]">Quantity</span>
              <div className="inline-flex items-center border border-[color:var(--border)] rounded-lg">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  className="px-3 py-2 hover:bg-[color:var(--brand-cream)] disabled:opacity-30 font-bold"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="px-4 py-2 min-w-12 text-center font-semibold">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  disabled={qty >= maxQty}
                  className="px-3 py-2 hover:bg-[color:var(--brand-cream)] disabled:opacity-30 font-bold"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            <button onClick={handleAdd} className="btn-gold w-full justify-center">
              {flash ? "✓ Added to cart" : `Add to cart · ${formatPrice(price * qty)}`}
            </button>

            {inCart && (
              <div className="text-xs text-[color:var(--muted)] text-center">
                You have {inCart.quantity} of this in your cart already
              </div>
            )}
          </>
        )}

        {outOfStock && (
          <button disabled className="btn-outline w-full justify-center opacity-60 cursor-not-allowed">
            Out of stock — notify me
          </button>
        )}
      </div>

      {/* Trust badges */}
      <div className="rounded-xl border border-[color:var(--border)] bg-white p-4 space-y-3 text-sm">
        <TrustRow icon="truck" title="Free shipping" body="On orders over $50" />
        <TrustRow icon="return" title="30-day returns" body="Hassle-free, no questions asked" />
        <TrustRow icon="shield" title="Secure checkout" body="256-bit encrypted payments" />
      </div>

      {/* Wishlist + Share */}
      <div className="space-y-2">
        <button
          onClick={toggleWishlist}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition ${
            wished
              ? "bg-[color:var(--brand-clay)]/10 border-[color:var(--brand-clay)] text-[color:var(--brand-clay)]"
              : "border-[color:var(--border)] text-[color:var(--brand-navy)] hover:bg-[color:var(--brand-cream)]"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={wished ? "currentColor" : "none"}>
            <path
              d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
          {wished ? "Saved to Wishlist" : "Add to Wishlist"}
        </button>

        <button
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[color:var(--border)] text-sm font-semibold text-[color:var(--brand-navy)] hover:bg-[color:var(--brand-cream)] transition"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {shareLabel}
        </button>
      </div>

      {/* Cart summary */}
      {count > 0 && (
        <div className="rounded-xl bg-[color:var(--brand-navy)] text-white p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs uppercase tracking-wider text-white/60 font-semibold">
                Cart summary
              </div>
              <div className="mt-1 text-sm text-white/80">
                {count} item{count === 1 ? "" : "s"}
              </div>
            </div>
            <Link
              href="/cart"
              className="text-xs underline text-white/80 hover:text-white"
            >
              View cart
            </Link>
          </div>
          <div className="flex items-end justify-between border-t border-white/15 pt-3">
            <span className="text-sm text-white/70">Subtotal</span>
            <span className="text-xl font-bold text-[color:var(--brand-gold)]">
              {formatPrice(subtotal)}
            </span>
          </div>
          <Link href="/checkout/address" className="btn-gold w-full justify-center">
            Checkout →
          </Link>
        </div>
      )}
    </div>
  );
}

function TrustRow({ icon, title, body }: { icon: string; title: string; body: string }) {
  const paths: Record<string, React.ReactNode> = {
    truck: <path d="M3 7h11v10H3zM14 11h5l2 3v3h-7M7 20a2 2 0 100-4 2 2 0 000 4zM17 20a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
    return: <path d="M3 12a9 9 0 109-9v3M3 12l3-3m-3 3l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
  };
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-[color:var(--brand-navy)] shrink-0 mt-0.5">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">{paths[icon]}</svg>
      </span>
      <div className="min-w-0">
        <div className="font-semibold text-[color:var(--brand-navy)]">{title}</div>
        <div className="text-xs text-[color:var(--muted)]">{body}</div>
      </div>
    </div>
  );
}
