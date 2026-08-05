"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/components/CartContext";
import { formatPrice } from "@/lib/products";
import { COUPONS } from "@/lib/orders";

export default function CartPage() {
  const { items, saved, subtotal, setQuantity, remove, clear, saveForLater, moveToCart, removeSaved } = useCart();

  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; pct: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const discount = appliedCoupon ? (subtotal * appliedCoupon.pct) / 100 : 0;
  const shipping = subtotal > 50 || subtotal === 0 ? 0 : 5;
  const taxRate = 0; // demo
  const tax = (subtotal - discount) * taxRate;
  const total = Math.max(0, subtotal - discount + shipping + tax);

  function applyCoupon(e: React.FormEvent) {
    e.preventDefault();
    setCouponError(null);
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    const found = COUPONS[code];
    if (!found) {
      setCouponError("Coupon code not recognised.");
      return;
    }
    setAppliedCoupon({ code, pct: found.discountPct });
    setCoupon("");
  }

  return (
    <div className="max-w-6xl mx-auto px-5 lg:px-8 py-10 lg:py-14">
      <header className="mb-8">
        <nav className="text-xs text-[color:var(--muted)] mb-3 flex items-center gap-1.5">
          <Link href="/" className="hover:text-[color:var(--brand-navy)]">Home</Link>
          <span className="text-[color:var(--border)]">/</span>
          <span className="text-[color:var(--brand-navy)] font-medium">Cart</span>
        </nav>
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Your Cart</h1>
        <p className="mt-1 text-sm text-[color:var(--muted)]">
          {items.length} item{items.length === 1 ? "" : "s"} in cart
          {saved.length > 0 && ` · ${saved.length} saved for later`}
        </p>
      </header>

      {items.length === 0 && saved.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            {/* Active cart items */}
            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[color:var(--border)] py-12 text-center bg-[color:var(--brand-cream)]/40">
                <div className="text-4xl">🛒</div>
                <p className="mt-2 text-[color:var(--muted)]">Your cart is empty. Move something from saved-for-later below, or keep shopping.</p>
              </div>
            ) : (
              <section>
                <div className="space-y-3">
                  {items.map((item) => (
                    <article
                      key={item.id}
                      className="flex gap-4 bg-white border border-[color:var(--border)] rounded-xl p-4"
                    >
                      <Link href={`/products/${item.id}`} className="relative h-24 w-24 shrink-0 bg-[color:var(--brand-cream)] rounded-lg overflow-hidden">
                        <Image
                          src={item.thumbnail}
                          alt={item.title}
                          fill
                          sizes="96px"
                          className="object-contain p-2"
                          unoptimized
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${item.id}`} className="font-semibold text-sm leading-snug line-clamp-2 hover:text-[color:var(--brand-clay)]">
                          {item.title}
                        </Link>
                        <div className="mt-1 text-sm text-[color:var(--muted)]">{formatPrice(item.price)} each</div>
                        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                          <div className="inline-flex items-center border border-[color:var(--border)] rounded-lg">
                            <button
                              onClick={() => setQuantity(item.id, item.quantity - 1)}
                              className="px-3 py-1.5 hover:bg-[color:var(--brand-cream)]"
                              aria-label="Decrease"
                            >
                              −
                            </button>
                            <span className="px-3 py-1.5 min-w-8 text-center text-sm font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => setQuantity(item.id, item.quantity + 1)}
                              className="px-3 py-1.5 hover:bg-[color:var(--brand-cream)]"
                              aria-label="Increase"
                            >
                              +
                            </button>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <button
                              onClick={() => saveForLater(item.id)}
                              className="font-semibold text-[color:var(--brand-navy)] hover:underline"
                            >
                              Save for later
                            </button>
                            <button
                              onClick={() => remove(item.id)}
                              className="font-semibold text-[color:var(--brand-clay)] hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold">{formatPrice(item.price * item.quantity)}</div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="flex justify-between pt-4">
                  <Link href="/products" className="text-sm font-semibold text-[color:var(--brand-navy)] hover:text-[color:var(--brand-clay)]">
                    ← Continue Shopping
                  </Link>
                  <button onClick={clear} className="text-sm text-[color:var(--muted)] hover:text-[color:var(--brand-clay)]">
                    Clear cart
                  </button>
                </div>
              </section>
            )}

            {/* Saved for later */}
            {saved.length > 0 && (
              <section className="pt-4 border-t border-[color:var(--border)]">
                <h2 className="text-lg font-bold mb-3">Saved for later</h2>
                <div className="space-y-3">
                  {saved.map((s) => (
                    <article
                      key={s.id}
                      className="flex gap-4 bg-white border border-[color:var(--border)] rounded-xl p-4"
                    >
                      <Link href={`/products/${s.id}`} className="relative h-20 w-20 shrink-0 bg-[color:var(--brand-cream)] rounded-lg overflow-hidden">
                        <Image
                          src={s.thumbnail}
                          alt={s.title}
                          fill
                          sizes="80px"
                          className="object-contain p-2"
                          unoptimized
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${s.id}`} className="font-semibold text-sm leading-snug line-clamp-2 hover:text-[color:var(--brand-clay)]">
                          {s.title}
                        </Link>
                        <div className="mt-1 text-sm text-[color:var(--muted)]">{formatPrice(s.price)}</div>
                        <div className="mt-2 flex items-center gap-3 text-xs">
                          <button
                            onClick={() => moveToCart(s.id)}
                            className="font-semibold text-[color:var(--brand-navy)] hover:underline"
                          >
                            Move to cart
                          </button>
                          <button
                            onClick={() => removeSaved(s.id)}
                            className="font-semibold text-[color:var(--brand-clay)] hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Order summary */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="bg-white border border-[color:var(--border)] rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-bold">Order Summary</h2>

              {/* Coupon */}
              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm">
                  <div>
                    <div className="font-semibold text-green-800">Coupon applied: {appliedCoupon.code}</div>
                    <div className="text-xs text-green-700">−{appliedCoupon.pct}%</div>
                  </div>
                  <button
                    onClick={() => setAppliedCoupon(null)}
                    className="text-xs font-semibold text-green-800 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={applyCoupon} className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-[color:var(--muted)] font-semibold block">
                    Coupon code
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      placeholder="e.g. WELCOME10"
                      className="input text-sm uppercase"
                    />
                    <button className="px-3 py-2 rounded-lg border border-[color:var(--brand-navy)] text-[color:var(--brand-navy)] text-xs font-semibold hover:bg-[color:var(--brand-navy)] hover:text-white transition">
                      Apply
                    </button>
                  </div>
                  {couponError && <div className="text-xs text-[color:var(--brand-clay)]">{couponError}</div>}
                  <div className="text-[10px] text-[color:var(--muted)]">Try: WELCOME10 or AKAN15</div>
                </form>
              )}

              <dl className="space-y-2 text-sm pt-2 border-t border-[color:var(--border)]">
                <Row label="Subtotal" value={formatPrice(subtotal)} />
                {discount > 0 && <Row label={`Discount (${appliedCoupon?.code})`} value={`−${formatPrice(discount)}`} accent="clay" />}
                <Row label="Shipping" value={shipping === 0 ? "Free" : formatPrice(shipping)} />
                {tax > 0 && <Row label="Tax" value={formatPrice(tax)} />}
                <div className="flex justify-between pt-3 border-t border-[color:var(--border)] text-base">
                  <dt className="font-semibold">Total</dt>
                  <dd className="font-bold">{formatPrice(total)}</dd>
                </div>
              </dl>

              {subtotal < 50 && subtotal > 0 && (
                <p className="text-xs text-[color:var(--brand-clay)]">
                  Add {formatPrice(50 - subtotal)} more for free shipping.
                </p>
              )}

              <Link
                href={items.length > 0 ? "/checkout/address" : "#"}
                aria-disabled={items.length === 0}
                onClick={(e) => items.length === 0 && e.preventDefault()}
                className={`w-full btn-gold justify-center ${
                  items.length === 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Checkout →
              </Link>

              <p className="text-xs text-[color:var(--muted)] text-center">
                Secure checkout · 256-bit encryption
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20 border border-dashed border-[color:var(--border)] rounded-2xl bg-[color:var(--brand-cream)]/40">
      <div className="text-6xl">🛒</div>
      <h2 className="mt-4 text-xl font-semibold">Your cart is empty</h2>
      <p className="mt-2 text-[color:var(--muted)]">
        Looks like you haven&apos;t added anything yet.
      </p>
      <Link href="/products" className="mt-6 btn-gold">
        Continue Shopping →
      </Link>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: "clay" }) {
  return (
    <div className="flex justify-between">
      <dt className="text-[color:var(--muted)]">{label}</dt>
      <dd className={`font-semibold ${accent === "clay" ? "text-[color:var(--brand-clay)]" : ""}`}>{value}</dd>
    </div>
  );
}
