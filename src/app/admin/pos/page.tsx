"use client";

import { useMemo, useState } from "react";
import {
  useInventory,
  usePayments,
  formatGHS,
  methodLabel,
  uid,
  type InventoryItem,
  type PaymentMethod,
} from "@/lib/store";
import PageHeader from "@/components/PageHeader";

type Line = { item: InventoryItem; quantity: number };

export default function POSPage() {
  const inventory = useInventory();
  const payments = usePayments();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [lines, setLines] = useState<Line[]>([]);
  const [method, setMethod] = useState<PaymentMethod>("mobile-money");
  const [customer, setCustomer] = useState("");
  const [cashTendered, setCashTendered] = useState("");
  const [receipt, setReceipt] = useState<null | {
    id: string;
    lines: Line[];
    total: number;
    method: PaymentMethod;
    customer: string;
    reference: string;
    when: string;
  }>(null);

  const categories = useMemo(() => {
    const set = new Set(inventory.items.map((i) => i.category));
    return ["All", ...Array.from(set).sort()];
  }, [inventory.items]);

  const visibleProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inventory.items.filter((i) => {
      if (category !== "All" && i.category !== category) return false;
      if (i.stock <= 0) return false;
      if (!q) return true;
      return (
        i.name.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
      );
    });
  }, [inventory.items, query, category]);

  const subtotal = lines.reduce((n, l) => n + l.item.price * l.quantity, 0);
  const tax = 0;
  const total = subtotal + tax;
  const tendered = parseFloat(cashTendered);
  const change = !isNaN(tendered) ? Math.max(0, tendered - total) : 0;

  function addToTicket(item: InventoryItem) {
    setLines((prev) => {
      const existing = prev.find((l) => l.item.id === item.id);
      if (existing) {
        if (existing.quantity + 1 > item.stock) return prev;
        return prev.map((l) => (l.item.id === item.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { item, quantity: 1 }];
    });
  }

  function setLineQty(id: string, qty: number) {
    setLines((prev) => {
      if (qty <= 0) return prev.filter((l) => l.item.id !== id);
      return prev.map((l) =>
        l.item.id === id ? { ...l, quantity: Math.min(qty, l.item.stock) } : l
      );
    });
  }

  function removeLine(id: string) {
    setLines((prev) => prev.filter((l) => l.item.id !== id));
  }

  function clearTicket() {
    setLines([]);
    setCashTendered("");
    setCustomer("");
  }

  function completeSale() {
    if (lines.length === 0) return;
    const reference = `POS-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const itemSummary = lines.map((l) => `${l.quantity}× ${l.item.name}`).join(", ");

    // 1. Record payment
    payments.add({
      id: uid("pay"),
      createdAt: new Date().toISOString(),
      customer: customer || "Walk-in customer",
      amount: total,
      currency: "GHS",
      method,
      reference,
      status: "succeeded",
      note: itemSummary,
    });

    // 2. Decrement stock for each line
    for (const l of lines) {
      inventory.update(l.item.id, { stock: Math.max(0, l.item.stock - l.quantity) });
    }

    // 3. Show receipt
    setReceipt({
      id: uid("rcp"),
      lines: [...lines],
      total,
      method,
      customer: customer || "Walk-in customer",
      reference,
      when: new Date().toISOString(),
    });

    clearTicket();
  }

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Run shop" },
          { label: "Point of Sale" },
        ]}
        title="Point of Sale"
        subtitle="Ring up sales fast. Stock and payments update automatically."
        actions={
          <span className="text-sm text-[color:var(--muted)] self-center">
            {inventory.items.length} products · {inventory.items.filter((i) => i.stock > 0).length} in stock
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* PRODUCTS */}
        <div>
          {/* Search + categories */}
          <div className="mb-4 space-y-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, SKU, or category…"
              className="input"
              autoFocus
            />
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                    category === c
                      ? "border-[color:var(--brand-navy)] bg-[color:var(--brand-navy)] text-white"
                      : "border-[color:var(--border)] hover:border-[color:var(--brand-navy)]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {visibleProducts.length === 0 ? (
            <div className="card text-center text-[color:var(--muted)]">
              {inventory.items.length === 0
                ? "Add products in the Inventory page first."
                : "No products match this search."}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {visibleProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToTicket(p)}
                  className="text-left card !p-4 hover:border-[color:var(--brand-teal)] active:scale-[0.98] transition"
                >
                  <div className="aspect-square rounded-lg bg-gradient-to-br from-[color:var(--brand-cream)] to-white flex items-center justify-center text-3xl text-[color:var(--brand-teal)]/30 font-bold mb-3">
                    {p.name[0]}
                  </div>
                  <div className="text-xs text-[color:var(--muted)] font-mono">{p.sku}</div>
                  <div className="font-semibold text-sm leading-snug line-clamp-2 mt-0.5">{p.name}</div>
                  <div className="mt-2 flex items-end justify-between gap-2">
                    <div className="font-bold text-[color:var(--brand-navy)]">{formatGHS(p.price)}</div>
                    <div className={`text-xs ${p.stock <= p.reorderAt ? "text-[color:var(--brand-clay)]" : "text-[color:var(--muted)]"}`}>
                      {p.stock} left
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* TICKET */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-xl bg-white border border-[color:var(--border)] overflow-hidden">
            <div className="px-5 py-4 bg-[color:var(--brand-navy)] text-white flex items-center justify-between">
              <div className="font-bold">Current ticket</div>
              <div className="text-xs text-white/70">{lines.reduce((n, l) => n + l.quantity, 0)} item(s)</div>
            </div>

            <div className="max-h-72 overflow-y-auto">
              {lines.length === 0 ? (
                <div className="p-8 text-center text-sm text-[color:var(--muted)]">
                  Tap a product to add it.
                </div>
              ) : (
                <ul className="divide-y divide-[color:var(--border)]">
                  {lines.map((l) => (
                    <li key={l.item.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm truncate">{l.item.name}</div>
                          <div className="text-xs text-[color:var(--muted)]">{formatGHS(l.item.price)} each</div>
                        </div>
                        <button
                          onClick={() => removeLine(l.item.id)}
                          className="text-[color:var(--brand-clay)] text-lg leading-none"
                          aria-label="Remove"
                        >
                          ×
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="inline-flex items-center border border-[color:var(--border)] rounded-lg">
                          <button
                            onClick={() => setLineQty(l.item.id, l.quantity - 1)}
                            className="px-2.5 py-1 hover:bg-[color:var(--brand-cream)]"
                            aria-label="Decrease"
                          >
                            −
                          </button>
                          <span className="px-3 text-sm font-semibold min-w-8 text-center">{l.quantity}</span>
                          <button
                            onClick={() => setLineQty(l.item.id, l.quantity + 1)}
                            disabled={l.quantity >= l.item.stock}
                            className="px-2.5 py-1 hover:bg-[color:var(--brand-cream)] disabled:opacity-30"
                            aria-label="Increase"
                          >
                            +
                          </button>
                        </div>
                        <div className="font-bold">{formatGHS(l.item.price * l.quantity)}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Totals */}
            <div className="px-5 py-4 border-t border-[color:var(--border)] bg-[color:var(--brand-cream)]/30 space-y-1.5 text-sm">
              <Row label="Subtotal" value={formatGHS(subtotal)} />
              <Row label="Tax" value={formatGHS(tax)} />
              <div className="border-t border-[color:var(--border)] my-2" />
              <div className="flex justify-between text-base">
                <span className="font-bold">Total</span>
                <span className="font-bold">{formatGHS(total)}</span>
              </div>
            </div>

            {/* Payment & complete */}
            <div className="px-5 py-4 border-t border-[color:var(--border)] space-y-3">
              <input
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="Customer name (optional)"
                className="input"
              />

              <div>
                <div className="text-xs uppercase tracking-wider text-[color:var(--muted)] font-semibold mb-1.5">Payment method</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["mobile-money", "visa", "mastercard", "apple-pay"] as PaymentMethod[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMethod(m)}
                      className={`px-2.5 py-2 rounded-lg border text-xs font-semibold transition ${
                        method === m
                          ? "border-[color:var(--brand-navy)] bg-[color:var(--brand-navy)] text-white"
                          : "border-[color:var(--border)] hover:border-[color:var(--brand-navy)]"
                      }`}
                    >
                      {methodLabel(m)}
                    </button>
                  ))}
                </div>
              </div>

              {method === "mobile-money" && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-[color:var(--muted)] font-semibold mb-1.5">Cash tendered (optional)</div>
                  <input
                    type="number"
                    step="0.01"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    placeholder="0.00"
                    className="input"
                  />
                  {tendered > 0 && (
                    <div className="mt-1.5 text-sm flex justify-between">
                      <span className="text-[color:var(--muted)]">Change:</span>
                      <span className="font-bold text-[color:var(--brand-teal)]">{formatGHS(change)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={clearTicket}
                  disabled={lines.length === 0}
                  className="btn-outline text-sm flex-1 justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Clear
                </button>
                <button
                  onClick={completeSale}
                  disabled={lines.length === 0}
                  className="btn-gold text-sm flex-[2] justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Complete sale · {formatGHS(total)}
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {receipt && <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[color:var(--muted)]">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

type Receipt = {
  id: string;
  lines: Line[];
  total: number;
  method: PaymentMethod;
  customer: string;
  reference: string;
  when: string;
};

function ReceiptModal({ receipt, onClose }: { receipt: Receipt; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden">
        <div className="px-6 py-5 bg-[color:var(--brand-teal)] text-white text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-[color:var(--brand-teal)] mb-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-xl font-bold">Sale complete</h2>
          <div className="text-sm text-white/80 mt-1">Reference {receipt.reference}</div>
        </div>

        <div className="p-6 space-y-3 text-sm">
          <div className="flex justify-between text-xs text-[color:var(--muted)]">
            <span>{new Date(receipt.when).toLocaleString("en-GH")}</span>
            <span>{methodLabel(receipt.method)}</span>
          </div>

          <div className="text-sm">
            <div className="text-[color:var(--muted)] text-xs uppercase tracking-wider mb-1">Customer</div>
            <div className="font-semibold">{receipt.customer}</div>
          </div>

          <div className="border-t border-[color:var(--border)] pt-3 space-y-1.5">
            {receipt.lines.map((l) => (
              <div key={l.item.id} className="flex justify-between text-sm">
                <span>{l.quantity}× {l.item.name}</span>
                <span className="font-semibold">{formatGHS(l.item.price * l.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-[color:var(--border)] pt-3 flex justify-between text-lg">
            <span className="font-bold">Total</span>
            <span className="font-bold">{formatGHS(receipt.total)}</span>
          </div>

          <div className="flex gap-2 pt-3">
            <button
              onClick={() => window.print()}
              className="btn-outline text-sm flex-1 justify-center"
            >
              Print
            </button>
            <button onClick={onClose} className="btn-gold text-sm flex-1 justify-center">
              New sale
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
