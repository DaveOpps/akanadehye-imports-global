"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { useOrders, paymentLabel, statusLabel, type Order } from "@/lib/orders";
import { formatPrice } from "@/lib/products";
import { formatDate } from "@/lib/store";

const PAGE_SIZE = 15;
const STATUSES: Order["status"][] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

const STATUS_BADGE: Record<Order["status"], string> = {
  pending: "badge-amber",
  confirmed: "badge-blue",
  shipped: "badge-blue",
  delivered: "badge-green",
  cancelled: "badge-red",
};

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="text-sm text-[color:var(--muted)]">Loading orders…</div>}>
      <OrdersContent />
    </Suspense>
  );
}

function OrdersContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const { items, update, hydrated } = useOrders();

  const statusFilter = (sp.get("status") as Order["status"] | null) ?? null;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.number.toLowerCase().includes(q) ||
        o.address.fullName.toLowerCase().includes(q) ||
        o.address.email.toLowerCase().includes(q) ||
        (o.customerEmail ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const pendingCount = items.filter((o) => o.status === "pending").length;
  const revenue = items
    .filter((o) => o.status !== "cancelled")
    .reduce((n, o) => n + o.total, 0);

  function setStatusFilter(next: string) {
    setPage(1);
    router.push(next ? `/admin/orders?status=${next}` : "/admin/orders");
  }

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Run shop" },
          { label: "Orders" },
        ]}
        title="Orders"
        subtitle="Manage customer orders — search, filter, and update statuses inline."
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Mini label="Total orders" value={String(items.length)} />
        <Mini label="Pending" value={String(pendingCount)} accent={pendingCount > 0 ? "amber" : undefined} />
        <Mini label="Revenue (non-cancelled)" value={formatPrice(revenue)} />
      </div>

      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-56">
          <svg
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)]"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M15.5 15.5L20 20M10 17a7 7 0 110-14 7 7 0 010 14z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by order number, customer name, or email"
            className="input pl-9"
          />
        </div>

        <select
          value={statusFilter ?? ""}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input !w-auto text-sm"
        >
          <option value="">All statuses ({items.length})</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)} ({items.filter((o) => o.status === s).length})
            </option>
          ))}
        </select>

        {(search || statusFilter) && (
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("");
            }}
            className="text-xs font-semibold text-[color:var(--brand-clay)] hover:underline"
          >
            Clear
          </button>
        )}

        <div className="ml-auto text-xs text-[color:var(--muted)]">
          Showing <strong className="text-[color:var(--brand-navy)]">{pageItems.length}</strong> of {filtered.length}
        </div>
      </div>

      {!hydrated ? (
        <div className="card text-center text-[color:var(--muted)] py-10">Loading…</div>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <div className="card text-center text-[color:var(--muted)] py-12">
          <div className="text-3xl mb-2">🔍</div>
          <p>No orders match your filters.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-[color:var(--border)] bg-white">
            <table className="w-full text-sm">
              <thead className="bg-[color:var(--brand-cream)] text-xs uppercase tracking-wider text-[color:var(--muted)]">
                <tr>
                  <th className="text-left px-4 py-3">Order #</th>
                  <th className="text-left px-4 py-3">Customer</th>
                  <th className="text-right px-4 py-3">Items</th>
                  <th className="text-right px-4 py-3">Total</th>
                  <th className="text-left px-4 py-3">Payment</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-right px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((o) => (
                  <tr key={o.id} className="border-t border-[color:var(--border)]">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-mono text-xs font-bold text-[color:var(--brand-navy)] hover:underline"
                      >
                        {o.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 min-w-44">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium">{o.address.fullName}</span>
                        {o.customerEmail && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                            ✓ Registered
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[color:var(--muted)] truncate">{o.customerEmail ?? o.address.email}</div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {o.items.reduce((n, i) => n + i.quantity, 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold">{formatPrice(o.total)}</td>
                    <td className="px-4 py-3 text-[color:var(--muted)] text-xs">
                      {paymentLabel(o.paymentMethod)}
                    </td>
                    <td className="px-4 py-3">
                      {/* Inline status update — saves immediately */}
                      <div className="flex items-center gap-2">
                        <span className={`badge ${STATUS_BADGE[o.status]}`}>{statusLabel(o.status)}</span>
                        <select
                          value={o.status}
                          onChange={(e) => update(o.id, { status: e.target.value as Order["status"] })}
                          aria-label={`Change status of ${o.number}`}
                          className="text-xs border border-[color:var(--border)] rounded-md px-1.5 py-1 bg-white hover:border-[color:var(--brand-navy)]"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {statusLabel(s)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[color:var(--muted)] text-xs whitespace-nowrap">
                      {formatDate(o.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="text-xs font-semibold text-[color:var(--brand-navy)] hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="btn-outline text-xs !px-3 !py-1.5 disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="text-xs text-[color:var(--muted)]">
                Page {safePage} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="btn-outline text-xs !px-3 !py-1.5 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      <p className="mt-6 text-xs text-[color:var(--muted)]">
        Orders are stored locally in this browser until the database migration lands — you&apos;ll see
        orders placed from this browser&apos;s storefront.
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--brand-cream)]/40 py-14 text-center">
      <div className="text-5xl mb-3">📦</div>
      <h2 className="text-xl font-bold text-[color:var(--brand-navy)]">No orders yet</h2>
      <p className="mt-2 text-sm text-[color:var(--muted)] max-w-md mx-auto">
        When customers check out on the storefront, their orders appear here for you to manage.
      </p>
      <Link href="/products" className="mt-5 btn-gold inline-flex">
        View storefront →
      </Link>
    </div>
  );
}

function Mini({ label, value, accent }: { label: string; value: string; accent?: "amber" }) {
  return (
    <div className="card !p-4">
      <div className="text-xs uppercase tracking-wider text-[color:var(--muted)]">{label}</div>
      <div className={`mt-1 text-xl font-bold ${accent === "amber" ? "text-amber-600" : ""}`}>{value}</div>
    </div>
  );
}

// Image import retained for future thumbnail column
void Image;
