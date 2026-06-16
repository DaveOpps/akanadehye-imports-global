"use client";
import Image from "next/image";
import { useEffect } from "react";
import { useCart } from "./CartContext";
import { formatPrice } from "@/lib/products";

const DURATION = 3200; // ms before auto-dismiss

export default function CartToast() {
  const { notification, clearNotification } = useCart();

  // Auto-dismiss after DURATION
  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(clearNotification, DURATION);
    return () => clearTimeout(t);
  }, [notification, clearNotification]);

  if (!notification) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="cart-toast-enter fixed top-20 left-1/2 z-50 w-80 rounded-2xl bg-white shadow-2xl overflow-hidden border border-[color:var(--border)]"
      style={{ transform: "translateX(-50%)" }}
    >
      {/* Green header */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-green-500">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/30">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="font-bold text-white text-sm">Added to Cart!</span>

        {/* Close */}
        <button
          onClick={clearNotification}
          aria-label="Dismiss"
          className="ml-auto inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-white/20 transition"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Product row */}
      <div className="px-4 pt-4 pb-3 flex items-start gap-3">
        <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-[color:var(--brand-cream)]">
          <Image
            src={notification.thumbnail}
            alt={notification.title}
            fill
            className="object-contain p-1"
            unoptimized
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-[color:var(--brand-navy)] leading-snug line-clamp-2">
            {notification.title}
          </p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-[color:var(--muted)]">Qty: 1</span>
            <span className="text-sm font-bold text-[color:var(--brand-clay)]">
              {formatPrice(notification.price)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[color:var(--border)] mx-4 mb-3 pt-2.5 flex items-center justify-center gap-2">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-[color:var(--brand-clay)]">
          <path
            d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6zM3 6h18M16 10a4 4 0 11-8 0"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
        <span className="text-sm font-semibold text-[color:var(--brand-clay)]">
          Item successfully added
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-green-100">
        <div
          className="h-full bg-green-500 origin-left"
          style={{ animation: `shrink-bar ${DURATION}ms linear forwards` }}
        />
      </div>
    </div>
  );
}
