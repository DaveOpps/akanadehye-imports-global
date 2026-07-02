"use client";

import { useEffect, useState, useCallback } from "react";

// ---------- Types ----------

export type PaymentMethod = "mobile-money" | "visa" | "mastercard" | "apple-pay";

export type Payment = {
  id: string;
  createdAt: string;
  customer: string;
  amount: number;
  currency: "GHS" | "USD";
  method: PaymentMethod;
  reference: string;
  status: "succeeded" | "pending" | "failed";
  note?: string;
};

export type InventoryItem = {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  /** Optional discounted price. Shown as the active price when present. */
  salePrice?: number;
  stock: number;
  reorderAt: number;
  createdAt: string;
  /** Last edit timestamp — set on every update. */
  updatedAt?: string;
  /** Base64 data-URLs of product photos. First image is the primary thumbnail. */
  images?: string[];
  /** Long-form product description for storefront + receipts. */
  description?: string;
  /** Lowercase, searchable keywords. */
  tags?: string[];
  /** When true, customers can reserve this item (pay on arrival) even if out of stock. */
  preorderable?: boolean;
  /** Optional expected arrival date (ISO string) shown on the pre-order form. */
  expectedArrival?: string | null;
};

export type InvoiceLine = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type Invoice = {
  id: string;
  number: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  dueDate: string;
  lines: InvoiceLine[];
  status: "draft" | "sent" | "paid" | "overdue";
  notes?: string;
};

export type SourcingOrder = {
  id: string;
  createdAt: string;
  productLink: string;
  productName: string;
  quantity: number;
  estCostUsd: number;
  fxRate: number;
  status: "requested" | "quoted" | "purchased" | "shipping" | "arrived";
  notes?: string;
};

export type FinancingApplication = {
  id: string;
  createdAt: string;
  amount: number;
  termMonths: number;
  purpose: string;
  status: "submitted" | "under-review" | "approved" | "declined";
};

// ---------- Generic DB-backed hook ----------
// Same interface as the old useLocalCollection so all admin pages work unchanged.

function useDbCollection<T extends { id: string }>(endpoint: string) {
  const [items, setItems] = useState<T[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    fetch(endpoint)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: T[]) => {
        setItems(Array.isArray(data) ? data : []);
        setHydrated(true);
      })
      .catch(() => setHydrated(true));
  }, [endpoint]);

  const add = useCallback(
    async (item: T) => {
      setItems((p) => [item, ...p]);
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
        if (!res.ok) {
          // Rollback on failure
          setItems((p) => p.filter((it) => it.id !== item.id));
        }
      } catch {
        setItems((p) => p.filter((it) => it.id !== item.id));
      }
    },
    [endpoint]
  );

  const update = useCallback(
    (id: string, patch: Partial<T>) => {
      setItems((p) => p.map((it) => (it.id === id ? { ...it, ...patch } : it)));
      fetch(`${endpoint}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }).catch(() => {});
    },
    [endpoint]
  );

  const remove = useCallback(
    (id: string) => {
      setItems((p) => p.filter((it) => it.id !== id));
      fetch(`${endpoint}/${id}`, { method: "DELETE" }).catch(() => {});
    },
    [endpoint]
  );

  const clear = useCallback(() => setItems([]), []);

  return { items, hydrated, add, update, remove, clear, setItems };
}

// ---------- Inventory — uses the existing /api/inventory which returns { total, items } ----------

function useDbInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    fetch("/api/inventory?limit=1000")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then(({ items: data }: { items: InventoryItem[] }) => {
        setItems(Array.isArray(data) ? data : []);
        setHydrated(true);
      })
      .catch(() => setHydrated(true));
  }, []);

  const add = useCallback(async (item: InventoryItem) => {
    setItems((p) => [item, ...p]);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!res.ok) setItems((p) => p.filter((it) => it.id !== item.id));
    } catch {
      setItems((p) => p.filter((it) => it.id !== item.id));
    }
  }, []);

  const update = useCallback((id: string, patch: Partial<InventoryItem>) => {
    setItems((p) => p.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    fetch(`/api/inventory/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => {});
  }, []);

  const remove = useCallback((id: string) => {
    setItems((p) => p.filter((it) => it.id !== id));
    fetch(`/api/inventory/${id}`, { method: "DELETE" }).catch(() => {});
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return { items, hydrated, add, update, remove, clear, setItems };
}

// ---------- Public hooks (same names as before — all admin pages unchanged) ----------

export const usePayments = () => useDbCollection<Payment>("/api/payments");
export const useInventory = () => useDbInventory();
export const useInvoices = () => useDbCollection<Invoice>("/api/invoices");
export const useSourcing = () => useDbCollection<SourcingOrder>("/api/sourcing");
export const useFinancing = () => useDbCollection<FinancingApplication>("/api/financing");

// ---------- Helpers (unchanged) ----------

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function formatGHS(amount: number): string {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GH", { day: "2-digit", month: "short", year: "numeric" });
}

export function invoiceTotal(inv: Invoice): number {
  return inv.lines.reduce((n, l) => n + l.quantity * l.unitPrice, 0);
}

export function methodLabel(m: PaymentMethod): string {
  return ({ "mobile-money": "Mobile Money", visa: "Visa", mastercard: "Mastercard", "apple-pay": "Apple Pay" } as const)[m];
}
