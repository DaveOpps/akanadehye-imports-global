"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { formatPrice } from "@/lib/products";

const CONFIRM_PHRASE = "DELETE ALL CUSTOMERS";

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  newsletterSubscribed: boolean;
  createdAt: string;
  orderCount: number;
  totalSpend: number;
};

export default function CustomersPage() {
  const { data: session } = useSession();
  const isSuperAdmin = (session?.user as { role?: string } | undefined)?.role === "super_admin";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showDanger, setShowDanger] = useState(false);

  function loadCustomers() {
    setLoading(true);
    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then((d) => { setCustomers(d.customers ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { loadCustomers(); }, []);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.phone ?? "").includes(q);
  });

  const totalSpend = customers.reduce((n, c) => n + c.totalSpend, 0);
  const subscribed = customers.filter((c) => c.newsletterSubscribed).length;
  const withOrders = customers.filter((c) => c.orderCount > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[color:var(--brand-navy)]">Customers</h1>
        <p className="text-sm text-[color:var(--muted)] mt-1">Everyone who has registered an account on the storefront</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total customers", value: loading ? "—" : customers.length.toString(), sub: "registered accounts" },
          { label: "Newsletter subscribers", value: loading ? "—" : subscribed.toString(), sub: `of ${customers.length} opted in` },
          { label: "Customers with orders", value: loading ? "—" : withOrders.toString(), sub: "have placed at least one order" },
          { label: "Total customer spend", value: loading ? "—" : formatPrice(totalSpend), sub: "across all linked orders" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[color:var(--border)] p-4 shadow-sm">
            <div className="text-xs text-[color:var(--muted)] font-medium">{s.label}</div>
            <div className="text-2xl font-bold text-[color:var(--brand-navy)] mt-1">{s.value}</div>
            <div className="text-[10px] text-[color:var(--muted)] mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M15.5 15.5L20 20M10 17a7 7 0 110-14 7 7 0 010 14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or phone…"
          className="input pl-9 w-full"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[color:var(--border)] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-[color:var(--muted)]">Loading customers…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-4xl mb-3">👥</div>
            <div className="font-semibold text-[color:var(--brand-navy)]">
              {search ? "No customers match your search" : "No customers yet"}
            </div>
            <div className="text-sm text-[color:var(--muted)] mt-1">
              {search ? "Try a different search term" : "Customers will appear here when they register on the storefront"}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[color:var(--border)] bg-[color:var(--brand-cream)]/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[color:var(--muted)] uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[color:var(--muted)] uppercase tracking-wider">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[color:var(--muted)] uppercase tracking-wider">Newsletter</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[color:var(--muted)] uppercase tracking-wider">Orders</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[color:var(--muted)] uppercase tracking-wider">Total spend</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[color:var(--muted)] uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border)]">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-[color:var(--brand-cream)]/30 transition cursor-pointer">
                    {/* Name + avatar */}
                    <td className="px-4 py-3">
                      <Link href={`/admin/customers/${c.id}`} className="flex items-center gap-3 group">
                        <div className="h-8 w-8 shrink-0 rounded-full bg-[color:var(--brand-navy)] flex items-center justify-center text-white text-xs font-bold">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-[color:var(--brand-navy)] group-hover:underline">{c.name}</span>
                      </Link>
                    </td>
                    {/* Contact */}
                    <td className="px-4 py-3">
                      <div className="text-[color:var(--brand-navy)]">{c.email}</div>
                      {c.phone && <div className="text-xs text-[color:var(--muted)] mt-0.5">{c.phone}</div>}
                    </td>
                    {/* Newsletter */}
                    <td className="px-4 py-3">
                      {c.newsletterSubscribed ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          Subscribed
                        </span>
                      ) : (
                        <span className="text-xs text-[color:var(--muted)]">Not subscribed</span>
                      )}
                    </td>
                    {/* Orders */}
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${c.orderCount > 0 ? "text-[color:var(--brand-navy)]" : "text-[color:var(--muted)]"}`}>
                        {c.orderCount}
                      </span>
                    </td>
                    {/* Spend */}
                    <td className="px-4 py-3 font-semibold text-[color:var(--brand-navy)]">
                      {c.totalSpend > 0 ? formatPrice(c.totalSpend) : <span className="text-[color:var(--muted)] font-normal">—</span>}
                    </td>
                    {/* Joined */}
                    <td className="px-4 py-3 text-xs text-[color:var(--muted)]">
                      {new Date(c.createdAt).toLocaleDateString("en-GH", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2.5 border-t border-[color:var(--border)] text-xs text-[color:var(--muted)]">
              {filtered.length} customer{filtered.length !== 1 ? "s" : ""}{search ? " matching" : ""}
            </div>
          </div>
        )}
      </div>

      {/* Danger zone — super_admin only */}
      {isSuperAdmin && (
        <div className="rounded-xl border border-[color:var(--brand-clay)]/30 bg-[color:var(--brand-clay)]/[0.03] p-5">
          <h2 className="font-bold text-[color:var(--brand-clay)] mb-1">Danger zone</h2>
          <p className="text-sm text-[color:var(--muted)] mb-4">
            Permanently delete every customer account and login. Order and payment history is
            kept — only storefront accounts are removed. This cannot be undone.
          </p>
          <button
            onClick={() => setShowDanger(true)}
            disabled={customers.length === 0}
            className="px-4 py-2 rounded-lg border border-[color:var(--brand-clay)] text-[color:var(--brand-clay)] text-sm font-semibold hover:bg-[color:var(--brand-clay)]/5 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Clear all customers
          </button>
        </div>
      )}

      {showDanger && (
        <ClearCustomersModal
          count={customers.length}
          onClose={() => setShowDanger(false)}
          onCleared={() => { setShowDanger(false); loadCustomers(); }}
        />
      )}
    </div>
  );
}

function ClearCustomersModal({
  count,
  onClose,
  onCleared,
}: {
  count: number;
  onClose: () => void;
  onCleared: () => void;
}) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canConfirm = typed === CONFIRM_PHRASE;

  async function handleConfirm() {
    if (!canConfirm || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/customers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: typed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to clear customers.");
        setBusy(false);
        return;
      }
      onCleared();
    } catch {
      setError("Network error — please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <span className="shrink-0 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div>
            <h2 className="font-bold text-[color:var(--brand-navy)]">Clear all customers?</h2>
            <p className="text-sm text-[color:var(--muted)] mt-1">
              This permanently deletes <strong>{count} customer account{count === 1 ? "" : "s"}</strong> and
              their storefront logins. Orders and payments already placed are kept. This cannot be undone.
            </p>
          </div>
        </div>

        <label className="block">
          <span className="block text-sm font-medium mb-1.5">
            Type <code className="font-mono text-xs bg-[color:var(--brand-cream)] px-1.5 py-0.5 rounded">{CONFIRM_PHRASE}</code> to confirm
          </span>
          <input
            autoFocus
            value={typed}
            onChange={(e) => { setTyped(e.target.value); setError(""); }}
            className="input font-mono"
            placeholder={CONFIRM_PHRASE}
            spellCheck={false}
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onClose} disabled={busy} className="btn-outline text-sm">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || busy}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {busy ? "Clearing…" : `Delete ${count} customer${count === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
