"use client";

import { useEffect, useState, useCallback } from "react";
import type { CartItem } from "@/components/CartContext";

export type ShippingAddress = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  region: string;
  country: string;
  notes?: string;
};

export type ShippingMethod = "standard" | "express" | "pickup";

export type CheckoutPaymentMethod = "mobile-money" | "card" | "bank-transfer" | "cash-on-delivery";

export type Order = {
  id: string;
  number: string;
  createdAt: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  address: ShippingAddress;
  shippingMethod: ShippingMethod;
  paymentMethod: CheckoutPaymentMethod;
  customerEmail?: string;
  paymentReference?: string;
  couponCode?: string;
};

export function useOrders() {
  const [items, setItems] = useState<Order[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Order[]) => {
        setItems(Array.isArray(data) ? data : []);
        setHydrated(true);
      })
      .catch(() => setHydrated(true));
  }, []);

  const add = useCallback(async (order: Order) => {
    setItems((prev) => [order, ...prev]);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });
      if (!res.ok) setItems((prev) => prev.filter((o) => o.id !== order.id));
    } catch {
      setItems((prev) => prev.filter((o) => o.id !== order.id));
    }
  }, []);

  const update = useCallback((id: string, patch: Partial<Order>) => {
    setItems((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
    fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => {});
  }, []);

  const get = useCallback(
    (id: string) => items.find((o) => o.id === id),
    [items]
  );

  return { items, hydrated, add, update, get };
}

export function nextOrderNumber(existing: Order[]): string {
  return `AKN-${(existing.length + 1).toString().padStart(5, "0")}`;
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

// Shipping cost calculator
export function shippingCost(method: ShippingMethod, subtotal: number): number {
  if (method === "pickup") return 0;
  if (method === "express") return subtotal >= 100 ? 10 : 15;
  // standard
  return subtotal >= 50 ? 0 : 5;
}

export function shippingLabel(method: ShippingMethod): string {
  return { standard: "Standard (3-5 days)", express: "Express (1-2 days)", pickup: "Pickup in store" }[method];
}

export function paymentLabel(m: CheckoutPaymentMethod): string {
  return {
    "mobile-money": "Mobile Money",
    card: "Credit / Debit Card",
    "bank-transfer": "Bank Transfer",
    "cash-on-delivery": "Cash on Delivery",
  }[m];
}

export function statusLabel(s: Order["status"]): string {
  return { pending: "Pending", confirmed: "Confirmed", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" }[s];
}

// Simple coupon registry (demo)
export const COUPONS: Record<string, { discountPct: number; description: string }> = {
  WELCOME10: { discountPct: 10, description: "10% off your first order" },
  AKAN15: { discountPct: 15, description: "15% off everything" },
  FREESHIP: { discountPct: 0, description: "Free standard shipping (auto-applied at $50+)" },
};

// ---------- Checkout draft (shared between steps) ----------

export type CheckoutDraft = {
  address?: Partial<ShippingAddress>;
  shippingMethod?: ShippingMethod;
  paymentMethod?: CheckoutPaymentMethod;
  couponCode?: string;
  couponPct?: number;
};

const DRAFT_KEY = "akanadehye-checkout-draft-v1";

export function useCheckoutDraft() {
  const [draft, setDraftState] = useState<CheckoutDraft>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) setDraftState(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {}
  }, [draft, hydrated]);

  const setDraft = useCallback((patch: Partial<CheckoutDraft>) => {
    setDraftState((prev) => ({ ...prev, ...patch }));
  }, []);

  const clearDraft = useCallback(() => setDraftState({}), []);

  return { draft, setDraft, clearDraft, hydrated };
}
