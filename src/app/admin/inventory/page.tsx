"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useInventory, formatGHS, uid, type InventoryItem } from "@/lib/store";
import PageHeader from "@/components/PageHeader";
import ImageUploader from "@/components/ImageUploader";

type SortKey = "name" | "category" | "price" | "stock" | "updated";
type SortDir = "asc" | "desc";
type Tab = "products" | "audit";

type AuditLog = {
  id: string;
  createdAt: string;
  action: string;
  entityId: string;
  entityName: string | null;
  entitySku: string | null;
  before: string | null;
  after: string | null;
  actor: string | null;
};

const PAGE_SIZE = 20;

// ---------- Auto-SKU helpers ----------

const CATEGORY_PREFIXES: Record<string, string> = {
  // Akanadehye product lines
  "Security Doors & Gates": "SEC",
  "Building Materials": "BLD",
  "Agricultural Machinery": "AGR",
  "Food Processing Machines": "FPM",
  "Furniture & Bedding": "FUR",
  "Home & Cleaning": "HCL",
  "Drinkware & Tumblers": "DRK",
  "Bags & Accessories": "BAG",
  Footwear: "FTW",
  "Electronics & Gadgets": "ELG",
  "Storage & Packaging": "STP",
  "Food & Grain": "FGR",
  // General
  Electronics: "ELE",
  Fashion: "FAS",
  Beauty: "BEA",
  Home: "HOM",
  Supermarket: "SUP",
  "Sports & Outdoors": "SPO",
  "Baby & Kids": "BAB",
  Other: "OTH",
};

function categoryPrefix(category: string): string {
  return CATEGORY_PREFIXES[category] ?? "GEN";
}

/**
 * Walk existing SKUs that match the AK-<PREFIX>-#### pattern and return the
 * next sequence number. Uses max + 1 so deleting items doesn't recycle SKUs
 * (which would conflict with old receipts / order history).
 */
function nextSkuFor(items: InventoryItem[], category: string, excludeId?: string): string {
  const prefix = categoryPrefix(category);
  const head = `AK-${prefix}-`;
  let maxSeq = 0;
  for (const i of items) {
    if (excludeId && i.id === excludeId) continue;
    if (i.sku && i.sku.startsWith(head)) {
      const seq = parseInt(i.sku.slice(head.length), 10);
      if (Number.isFinite(seq) && seq > maxSeq) maxSeq = seq;
    }
  }
  return `${head}${String(maxSeq + 1).padStart(4, "0")}`;
}

export default function InventoryPage() {
  const { items, add, update, remove, hydrated } = useInventory();

  const [tab, setTab] = useState<Tab>("products");
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [viewing, setViewing] = useState<InventoryItem | null>(null);

  // Toolbar state
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Bulk select
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Pagination
  const [page, setPage] = useState(1);

  // Two-step delete confirmation
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Map<string, number>();
    for (const i of items) set.set(i.category, (set.get(i.category) ?? 0) + 1);
    return Array.from(set.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = items.filter((i) => {
      if (categoryFilter !== "All" && i.category !== categoryFilter) return false;
      if (!q) return true;
      const hay = [i.name, i.sku, i.category, i.description ?? "", ...(i.tags ?? [])]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });

    out = [...out].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name) * dir;
        case "category":
          return a.category.localeCompare(b.category) * dir;
        case "price":
          return ((a.salePrice ?? a.price) - (b.salePrice ?? b.price)) * dir;
        case "stock":
          return (a.stock - b.stock) * dir;
        case "updated":
        default:
          return (
            (new Date(b.updatedAt ?? b.createdAt).getTime() -
              new Date(a.updatedAt ?? a.createdAt).getTime()) *
            dir *
            -1 // updated default desc
          );
      }
    });
    return out;
  }, [items, search, categoryFilter, sortKey, sortDir]);

  const totalValue = items.reduce(
    (n, i) => n + (i.salePrice ?? i.price) * i.stock,
    0
  );
  const lowStock = items.filter((i) => i.stock <= i.reorderAt);
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const pageItems = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleSelectAll() {
    if (selected.size === visible.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(visible.map((i) => i.id)));
    }
  }
  function bulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} selected product${selected.size === 1 ? "" : "s"}?`)) return;
    for (const id of selected) remove(id);
    setSelected(new Set());
  }
  function clearFilters() {
    setSearch("");
    setCategoryFilter("All");
    setPage(1);
  }

  // Reset to page 1 whenever search or category filter changes
  useEffect(() => { setPage(1); }, [search, categoryFilter]);

  function exportCsv() {
    const headers = [
      "sku",
      "name",
      "category",
      "price",
      "salePrice",
      "stock",
      "reorderAt",
      "description",
      "tags",
      "createdAt",
      "updatedAt",
    ];
    const rows = items.map((i) =>
      [
        i.sku,
        i.name,
        i.category,
        i.price,
        i.salePrice ?? "",
        i.stock,
        i.reorderAt,
        (i.description ?? "").replace(/"/g, '""'),
        (i.tags ?? []).join("|"),
        i.createdAt,
        i.updatedAt ?? "",
      ]
        .map((v) => (typeof v === "string" && (v.includes(",") || v.includes('"')) ? `"${v}"` : v))
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `akanadehye-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function adjustStock(item: InventoryItem, delta: number) {
    const next = Math.max(0, item.stock + delta);
    update(item.id, { stock: next, updatedAt: new Date().toISOString() });
  }

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Run shop" },
          { label: "Inventory" },
        ]}
        title="Inventory"
        subtitle="Track stock, set reorder points, and keep your catalog up to date."
        actions={
          <div className="flex gap-2">
            <button
              onClick={exportCsv}
              disabled={items.length === 0}
              className="btn-outline text-sm disabled:opacity-40"
              title="Download all products as CSV"
            >
              Export CSV
            </button>
            <button
              onClick={() => {
                setEditing(null);
                setFormLoading(false);
                setShowForm(true);
              }}
              className="btn-gold"
            >
              + Add product
            </button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Mini label="Products" value={String(items.length)} />
        <Mini label="Stock value" value={formatGHS(totalValue)} />
        <Mini
          label="Low stock items"
          value={String(lowStock.length)}
          accent={lowStock.length > 0 ? "clay" : undefined}
        />
      </div>

      {showForm && formLoading && (
        <FormLoadingDrawer
          onClose={() => {
            setShowForm(false);
            setFormLoading(false);
            setEditing(null);
          }}
        />
      )}

      {showForm && !formLoading && (
        <ProductForm
          initial={editing}
          items={items}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSave={(data) => {
            if (editing) {
              update(editing.id, { ...data, updatedAt: new Date().toISOString() });
            } else {
              add({
                ...data,
                id: uid("inv"),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            }
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      {viewing && (
        <ProductViewPanel
          item={viewing}
          onClose={() => setViewing(null)}
          onEdit={async () => {
            const it = viewing;
            setViewing(null);
            // Open the drawer immediately with a spinner, then load full images.
            setEditing(null);
            setFormLoading(true);
            setShowForm(true);
            try {
              const res = await fetch(`/api/inventory/${it.id}`);
              setEditing(res.ok ? await res.json() : it);
            } catch {
              setEditing(it);
            } finally {
              setFormLoading(false);
            }
          }}
        />
      )}

      {/* Tab switcher */}
      <div className="mb-5 flex gap-1 border-b border-[color:var(--border)]">
        {(["products", "audit"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold capitalize border-b-2 -mb-px transition ${
              tab === t
                ? "border-[color:var(--brand-navy)] text-[color:var(--brand-navy)]"
                : "border-transparent text-[color:var(--muted)] hover:text-[color:var(--brand-navy)]"
            }`}
          >
            {t === "audit" ? "Audit Trail" : "Products"}
          </button>
        ))}
      </div>

      {tab === "audit" ? (
        <AuditTrail />
      ) : !hydrated ? (
        <SkeletonRows />
      ) : items.length === 0 ? (
        <EmptyState onAdd={() => { setEditing(null); setFormLoading(false); setShowForm(true); }} />
      ) : (
        <>
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
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, SKU, tag or description"
                className="input pl-9"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input !w-auto text-sm"
            >
              <option value="All">All categories ({items.length})</option>
              {categories.map(([cat, count]) => (
                <option key={cat} value={cat}>
                  {cat} ({count})
                </option>
              ))}
            </select>

            {(search || categoryFilter !== "All") && (
              <button
                onClick={clearFilters}
                className="text-xs font-semibold text-[color:var(--brand-clay)] hover:underline"
              >
                Clear
              </button>
            )}

            <div className="ml-auto text-xs text-[color:var(--muted)]">
              {visible.length === 0 ? "0 results" : (
                <>
                  Showing{" "}
                  <strong className="text-[color:var(--brand-navy)]">
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, visible.length)}
                  </strong>{" "}
                  of {visible.length}
                  {visible.length < items.length && ` (${items.length} total)`}
                </>
              )}
            </div>
          </div>

          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div className="mb-3 rounded-lg bg-[color:var(--brand-navy)] text-white px-4 py-2.5 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <span className="text-sm font-semibold">
                {selected.size} selected
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelected(new Set())}
                  className="text-xs font-semibold text-white/80 hover:text-white"
                >
                  Clear
                </button>
                <button
                  onClick={bulkDelete}
                  className="text-xs font-bold bg-[color:var(--brand-clay)] hover:brightness-110 px-3 py-1.5 rounded transition"
                >
                  Delete selected
                </button>
              </div>
            </div>
          )}

          {visible.length === 0 ? (
            <div className="card text-center text-[color:var(--muted)] py-12">
              <div className="text-3xl mb-2">🔍</div>
              <p>No products match your filters.</p>
              <button
                onClick={clearFilters}
                className="mt-3 text-sm font-semibold text-[color:var(--brand-navy)] hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
            <div className="overflow-hidden rounded-xl border border-[color:var(--border)] bg-white">
              <table className="w-full text-sm">
                <thead className="bg-[color:var(--brand-cream)] text-xs uppercase tracking-wider text-[color:var(--muted)]">
                  <tr>
                    <th className="text-left px-3 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selected.size === visible.length && visible.length > 0}
                        onChange={toggleSelectAll}
                        aria-label="Select all"
                        className="accent-[color:var(--brand-navy)]"
                      />
                    </th>
                    <th className="text-left px-3 py-3 w-16"></th>
                    <SortHeader label="Product" k="name" sortKey={sortKey} sortDir={sortDir} setSortKey={setSortKey} setSortDir={setSortDir} />
                    <SortHeader label="Category" k="category" sortKey={sortKey} sortDir={sortDir} setSortKey={setSortKey} setSortDir={setSortDir} />
                    <SortHeader label="Price" k="price" align="right" sortKey={sortKey} sortDir={sortDir} setSortKey={setSortKey} setSortDir={setSortDir} />
                    <SortHeader label="Stock" k="stock" align="right" sortKey={sortKey} sortDir={sortDir} setSortKey={setSortKey} setSortDir={setSortDir} />
                    <th className="text-right px-3 py-3">Status</th>
                    <th className="text-right px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((i) => {
                    const isChecked = selected.has(i.id);
                    const active = i.salePrice ?? i.price;
                    return (
                      <tr
                        key={i.id}
                        className={`border-t border-[color:var(--border)] transition ${
                          isChecked ? "bg-[color:var(--brand-cream)]/50" : ""
                        }`}
                      >
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelect(i.id)}
                            aria-label={`Select ${i.name}`}
                            className="accent-[color:var(--brand-navy)]"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <Thumbnail src={i.images?.[0]} alt={i.name} count={i.images?.length} />
                        </td>
                        <td className="px-3 py-3 min-w-56">
                          <div className="font-medium">{i.name}</div>
                          <div className="text-[10px] text-[color:var(--muted)] font-mono mt-0.5">
                            {i.sku}
                          </div>
                          {i.tags && i.tags.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {i.tags.slice(0, 3).map((t) => (
                                <span
                                  key={t}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-[color:var(--brand-cream)] text-[color:var(--brand-navy)]"
                                >
                                  #{t}
                                </span>
                              ))}
                              {i.tags.length > 3 && (
                                <span className="text-[10px] text-[color:var(--muted)] py-0.5">
                                  +{i.tags.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-[color:var(--muted)]">{i.category}</td>
                        <td className="px-3 py-3 text-right">
                          <div className="font-bold">{formatGHS(active)}</div>
                          {i.salePrice != null && i.salePrice < i.price && (
                            <div className="text-[10px] text-[color:var(--muted)] line-through">
                              {formatGHS(i.price)}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => adjustStock(i, -1)}
                              disabled={i.stock <= 0}
                              className="h-6 w-6 inline-flex items-center justify-center rounded border border-[color:var(--border)] hover:border-[color:var(--brand-navy)] hover:bg-[color:var(--brand-cream)] disabled:opacity-30 text-sm font-bold leading-none"
                              aria-label="Decrease stock"
                            >
                              −
                            </button>
                            <span className="font-bold min-w-7 text-center tabular-nums">{i.stock}</span>
                            <button
                              onClick={() => adjustStock(i, 1)}
                              className="h-6 w-6 inline-flex items-center justify-center rounded border border-[color:var(--border)] hover:border-[color:var(--brand-navy)] hover:bg-[color:var(--brand-cream)] text-sm font-bold leading-none"
                              aria-label="Increase stock"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right">
                          {i.stock === 0 ? (
                            <span className="badge badge-red">Out</span>
                          ) : i.stock <= i.reorderAt ? (
                            <span className="badge badge-amber">Low</span>
                          ) : (
                            <span className="badge badge-green">OK</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => setViewing(i)}
                            title="Preview this product"
                            className="text-xs font-semibold text-[color:var(--muted)] hover:text-[color:var(--brand-navy)] hover:underline mr-3"
                          >
                            View
                          </button>
                          <button
                            onClick={async () => {
                              // Open the drawer immediately with a spinner, then
                              // load the full item (heavy base64 images) in the
                              // background so the click feels instant.
                              setEditing(null);
                              setFormLoading(true);
                              setShowForm(true);
                              try {
                                const res = await fetch(`/api/inventory/${i.id}`);
                                setEditing(res.ok ? await res.json() : i);
                              } catch {
                                setEditing(i);
                              } finally {
                                setFormLoading(false);
                              }
                            }}
                            className="text-xs font-semibold text-[color:var(--brand-navy)] hover:underline mr-3"
                          >
                            Edit
                          </button>
                          {confirmDelete === i.id ? (
                            <span className="inline-flex items-center gap-2">
                              <span className="text-xs text-[color:var(--muted)]">Remove?</span>
                              <button
                                onClick={() => { remove(i.id); setConfirmDelete(null); }}
                                className="text-xs font-bold text-[color:var(--brand-clay)] hover:underline"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="text-xs text-[color:var(--muted)] hover:underline"
                              >
                                No
                              </button>
                            </span>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(i.id)}
                              className="text-xs font-semibold text-[color:var(--brand-clay)] hover:underline"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="mt-3 flex items-center justify-between">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-[color:var(--border)] text-sm font-medium text-[color:var(--brand-navy)] disabled:opacity-40 hover:bg-[color:var(--brand-cream)] transition"
                >
                  ← Previous
                </button>
                <span className="text-sm text-[color:var(--muted)]">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-[color:var(--border)] text-sm font-medium text-[color:var(--brand-navy)] disabled:opacity-40 hover:bg-[color:var(--brand-cream)] transition"
                >
                  Next →
                </button>
              </div>
            )}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ---------- Audit Trail ----------

const ACTION_STYLES: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-800",
  UPDATE: "bg-blue-100 text-blue-800",
  STOCK_ADJUST: "bg-amber-100 text-amber-800",
  DELETE: "bg-red-100 text-red-800",
};

const FIELD_LABELS: Record<string, string> = {
  name: "Name", category: "Category", price: "Price (GHS)", salePrice: "Sale price (GHS)",
  stock: "Stock", reorderAt: "Reorder at", description: "Description", tags: "Tags", images: "Images",
};

function reltime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function AuditDiff({ before, after, action }: { before: string | null; after: string | null; action: string }) {
  if (action === "CREATE") return <span className="text-xs text-emerald-700 font-medium">Product added to catalog</span>;
  if (action === "DELETE") return <span className="text-xs text-red-600 font-medium">Product removed from catalog</span>;
  if (!before && !after) return <span className="text-xs text-[color:var(--muted)]">—</span>;

  let b: Record<string, unknown> = {};
  let a: Record<string, unknown> = {};
  try { b = JSON.parse(before ?? "{}"); } catch { /* ignore */ }
  try { a = JSON.parse(after ?? "{}"); } catch { /* ignore */ }

  const keys = Array.from(new Set([...Object.keys(b), ...Object.keys(a)]));
  const changed = keys.filter((k) => String(b[k]) !== String(a[k]));

  if (changed.length === 0) return <span className="text-xs text-[color:var(--muted)]">—</span>;

  return (
    <div className="space-y-1">
      {changed.map((k) => (
        <div key={k} className="text-xs leading-tight">
          <span className="font-medium text-[color:var(--brand-navy)]">{FIELD_LABELS[k] ?? k}:</span>{" "}
          <span className="line-through text-[color:var(--muted)]">{String(b[k] ?? "—")}</span>
          <span className="mx-1 text-[color:var(--muted)]">→</span>
          <span className="font-semibold text-[color:var(--brand-navy)]">{String(a[k] ?? "—")}</span>
        </div>
      ))}
    </div>
  );
}

function AuditTrail() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All");

  function load() {
    setLoading(true);
    fetch("/api/audit?entity=InventoryItem&limit=200")
      .then((r) => r.json())
      .then((d) => setLogs(d.logs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((l) => {
      if (actionFilter !== "All" && l.action !== actionFilter) return false;
      if (q) {
        return (
          (l.entityName ?? "").toLowerCase().includes(q) ||
          (l.entitySku ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, search, actionFilter]);

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-52">
          <svg aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M15.5 15.5L20 20M10 17a7 7 0 110-14 7 7 0 010 14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter by product name or SKU" className="input pl-9" />
        </div>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="input !w-auto text-sm">
          <option value="All">All actions</option>
          <option value="CREATE">Created</option>
          <option value="UPDATE">Edited</option>
          <option value="STOCK_ADJUST">Stock adjust</option>
          <option value="DELETE">Deleted</option>
        </select>
        <button onClick={load} className="btn-outline text-sm" title="Refresh audit log">
          Refresh
        </button>
        <span className="ml-auto text-xs text-[color:var(--muted)]">
          {visible.length} event{visible.length !== 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <div className="card py-12 text-center text-sm text-[color:var(--muted)] animate-pulse">Loading audit trail…</div>
      ) : visible.length === 0 ? (
        <div className="card py-12 text-center text-sm text-[color:var(--muted)]">
          {logs.length === 0 ? "No activity recorded yet. Changes to products will appear here." : "No events match your filters."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[color:var(--border)] bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[color:var(--brand-cream)] text-xs uppercase tracking-wider text-[color:var(--muted)]">
              <tr>
                <th className="text-left px-4 py-3 w-32">When</th>
                <th className="text-left px-4 py-3 w-28">Action</th>
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3">Changes</th>
                <th className="text-left px-4 py-3 w-24">By</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((log) => (
                <tr key={log.id} className="border-t border-[color:var(--border)] hover:bg-[color:var(--brand-cream)]/30 transition">
                  <td className="px-4 py-3 text-xs text-[color:var(--muted)] whitespace-nowrap" title={new Date(log.createdAt).toLocaleString()}>
                    {reltime(log.createdAt)}
                    <div className="text-[10px] mt-0.5 opacity-70">{new Date(log.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${ACTION_STYLES[log.action] ?? "bg-gray-100 text-gray-700"}`}>
                      {log.action === "STOCK_ADJUST" ? "Stock ±" : log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-[color:var(--brand-navy)]">{log.entityName ?? "—"}</div>
                    {log.entitySku && (
                      <div className="text-[10px] font-mono text-[color:var(--muted)] mt-0.5">{log.entitySku}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <AuditDiff before={log.before} after={log.after} action={log.action} />
                  </td>
                  <td className="px-4 py-3 text-xs text-[color:var(--muted)]">{log.actor ?? "admin"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------- Products tab helpers ----------

function SortHeader({
  label,
  k,
  align,
  sortKey,
  sortDir,
  setSortKey,
  setSortDir,
}: {
  label: string;
  k: SortKey;
  align?: "right";
  sortKey: SortKey;
  sortDir: SortDir;
  setSortKey: (k: SortKey) => void;
  setSortDir: (d: SortDir) => void;
}) {
  const active = sortKey === k;
  const arrow = active ? (sortDir === "asc" ? "↑" : "↓") : "";
  return (
    <th
      className={`px-3 py-3 ${align === "right" ? "text-right" : "text-left"} select-none cursor-pointer hover:text-[color:var(--brand-navy)]`}
      onClick={() => {
        if (active) {
          setSortDir(sortDir === "asc" ? "desc" : "asc");
        } else {
          setSortKey(k);
          setSortDir("asc");
        }
      }}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {arrow && <span className="text-[color:var(--brand-navy)]">{arrow}</span>}
      </span>
    </th>
  );
}

function Thumbnail({ src, alt, count }: { src?: string; alt: string; count?: number }) {
  if (!src) {
    return (
      <div className="h-12 w-12 rounded-lg bg-[color:var(--brand-cream)] inline-flex items-center justify-center text-[color:var(--muted)]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M14 9a1 1 0 100-2 1 1 0 000 2z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }
  return (
    <div className="relative h-12 w-12 rounded-lg bg-[color:var(--brand-cream)] overflow-hidden">
      <Image src={src} alt={alt} fill sizes="48px" className="object-cover" unoptimized />
      {count && count > 1 && (
        <span className="absolute bottom-0 right-0 px-1 py-0.5 bg-black/60 text-white text-[9px] font-bold">
          {count}
        </span>
      )}
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="overflow-hidden rounded-xl border border-[color:var(--border)] bg-white">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="px-4 py-4 border-b last:border-b-0 border-[color:var(--border)] flex gap-3 items-center animate-pulse">
          <div className="h-4 w-4 rounded bg-[color:var(--brand-cream)]" />
          <div className="h-12 w-12 rounded-lg bg-[color:var(--brand-cream)]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 bg-[color:var(--brand-cream)] rounded" />
            <div className="h-2.5 w-1/4 bg-[color:var(--brand-cream)] rounded" />
          </div>
          <div className="h-3 w-20 bg-[color:var(--brand-cream)] rounded" />
          <div className="h-3 w-16 bg-[color:var(--brand-cream)] rounded" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-gradient-to-br from-[color:var(--brand-cream)]/40 to-white p-10 md:p-14 text-center">
      <div className="relative w-32 h-32 mx-auto mb-4">
        <div className="absolute inset-0 rounded-2xl bg-[color:var(--brand-navy)]/5 rotate-6" />
        <div className="absolute inset-0 rounded-2xl bg-[color:var(--brand-gold)]/15 -rotate-6" />
        <div className="absolute inset-0 rounded-2xl bg-white border border-[color:var(--border)] flex items-center justify-center">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" className="text-[color:var(--brand-navy)]">
            <path d="M3 8l9-5 9 5v8l-9 5-9-5V8zM3 8l9 5m0 0l9-5m-9 5v9" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[color:var(--brand-navy)]">
        Your catalog is empty
      </h2>
      <p className="mt-2 text-sm text-[color:var(--muted)] max-w-md mx-auto">
        Add your first product to start tracking stock, accept POS sales, and feature it on your storefront.
      </p>

      <div className="mt-6 grid sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left">
        <Hint icon="camera" title="Snap photos" body="Use your phone camera or upload from your gallery." />
        <Hint icon="tag" title="Tag & price" body="Set price, sale price, stock, and a friendly description." />
        <Hint icon="storefront" title="Goes live" body="Stocked items appear on the storefront automatically." />
      </div>

      <div className="mt-7">
        <button onClick={onAdd} className="btn-gold">
          + Add your first product
        </button>
      </div>
    </div>
  );
}

function Hint({ icon, title, body }: { icon: "camera" | "tag" | "storefront"; title: string; body: string }) {
  const paths: Record<string, React.ReactNode> = {
    camera: <path d="M3 7h4l2-3h6l2 3h4v13H3V7zM12 11a4 4 0 100 8 4 4 0 000-8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
    tag: <path d="M3 12V3h9l9 9-9 9-9-9zM7.5 8.5a1 1 0 100-2 1 1 0 000 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
    storefront: <path d="M3 9l2-5h14l2 5M3 9v11h18V9M3 9h18M9 14h6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
  };
  return (
    <div className="rounded-xl bg-white border border-[color:var(--border)] p-4">
      <div className="h-9 w-9 rounded-lg bg-[color:var(--brand-cream)] inline-flex items-center justify-center text-[color:var(--brand-teal)] mb-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          {paths[icon]}
        </svg>
      </div>
      <div className="text-sm font-bold text-[color:var(--brand-navy)]">{title}</div>
      <div className="text-xs text-[color:var(--muted)] mt-0.5 leading-relaxed">{body}</div>
    </div>
  );
}

function Mini({ label, value, accent }: { label: string; value: string; accent?: "clay" }) {
  return (
    <div className="card !p-4">
      <div className="text-xs uppercase tracking-wider text-[color:var(--muted)]">{label}</div>
      <div className={`mt-1 text-xl font-bold ${accent === "clay" ? "text-[color:var(--brand-clay)]" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function ProductForm({
  initial,
  items,
  onSave,
  onCancel,
}: {
  initial: InventoryItem | null;
  items: InventoryItem[];
  onSave: (data: Omit<InventoryItem, "id" | "createdAt">) => void;
  onCancel: () => void;
}) {
  const isEdit = initial != null;
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "Electronics");
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");
  const [salePrice, setSalePrice] = useState(initial?.salePrice?.toString() ?? "");
  const [stock, setStock] = useState(initial?.stock?.toString() ?? "");
  const [reorderAt, setReorderAt] = useState(initial?.reorderAt?.toString() ?? "5");
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(", "));

  // Close the drawer on Escape (same as the View panel)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  // SKU is fully auto-managed. On edit, locked to the existing value. On new,
  // recomputed as the user changes category so the prefix matches.
  const [sku, setSku] = useState(
    initial?.sku ?? nextSkuFor(items, initial?.category ?? "Electronics")
  );
  useEffect(() => {
    if (!isEdit) {
      setSku(nextSkuFor(items, category));
    }
  }, [category, isEdit, items]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const priceNum = parseFloat(price) || 0;
    const saleNum = parseFloat(salePrice);
    onSave({
      sku,
      name,
      category,
      price: priceNum,
      salePrice: isFinite(saleNum) && saleNum > 0 && saleNum < priceNum ? saleNum : undefined,
      stock: parseInt(stock) || 0,
      reorderAt: parseInt(reorderAt) || 0,
      images: images.length > 0 ? images : undefined,
      description: description.trim() || undefined,
      tags:
        tagsInput
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean).length > 0
          ? tagsInput.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
          : undefined,
    });
  }

  const priceNum = parseFloat(price) || 0;
  const saleNum = parseFloat(salePrice);
  const discountPct =
    isFinite(saleNum) && saleNum > 0 && saleNum < priceNum
      ? Math.round((1 - saleNum / priceNum) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} aria-hidden />
      <form onSubmit={submit} className="relative h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[color:var(--border)] shrink-0">
          <h2 className="font-bold text-base text-[color:var(--brand-navy)]">{initial ? "Edit product" : "New product"}</h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="h-8 w-8 inline-flex items-center justify-center rounded-full text-[color:var(--muted)] hover:bg-[color:var(--brand-cream)] hover:text-[color:var(--brand-navy)] transition"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
      {/* Images */}
      <section className="border-b border-[color:var(--border)] pb-6">
        <ImageUploader value={images} onChange={setImages} />
      </section>

      {/* Identity */}
      <section className="grid sm:grid-cols-2 gap-3">
        <Field label="Product name" required className="sm:col-span-2">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="e.g. Wireless Earbuds Pro"
          />
        </Field>
        <Field
          label={
            <span className="flex items-center gap-1.5">
              SKU
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[color:var(--brand-navy)] text-[color:var(--brand-gold)]">
                Auto
              </span>
            </span>
          }
        >
          <div className="flex items-center gap-2 h-[42px] px-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--brand-cream)]/60 font-mono text-sm font-semibold text-[color:var(--brand-navy)]">
            {sku}
          </div>
          <p className="text-[10px] text-[color:var(--muted)] mt-1">
            {isEdit
              ? "Locked — changing a SKU breaks links to past receipts."
              : "Updates automatically when you change category."}
          </p>
        </Field>
        <Field label="Category">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
            <optgroup label="Building & Security">
              <option>Security Doors &amp; Gates</option>
              <option>Building Materials</option>
            </optgroup>
            <optgroup label="Machinery">
              <option>Agricultural Machinery</option>
              <option>Food Processing Machines</option>
            </optgroup>
            <optgroup label="Fashion & Accessories">
              <option>Bags &amp; Accessories</option>
              <option>Footwear</option>
              <option>Fashion</option>
            </optgroup>
            <optgroup label="Home & Living">
              <option>Furniture &amp; Bedding</option>
              <option>Home &amp; Cleaning</option>
              <option>Drinkware &amp; Tumblers</option>
              <option>Home</option>
            </optgroup>
            <optgroup label="Food & Grocery">
              <option>Food &amp; Grain</option>
              <option>Storage &amp; Packaging</option>
              <option>Supermarket</option>
            </optgroup>
            <optgroup label="Electronics">
              <option>Electronics &amp; Gadgets</option>
              <option>Electronics</option>
            </optgroup>
            <optgroup label="Other">
              <option>Beauty</option>
              <option>Sports &amp; Outdoors</option>
              <option>Baby &amp; Kids</option>
              <option>Other</option>
            </optgroup>
          </select>
        </Field>
      </section>

      {/* Description + tags */}
      <section className="grid sm:grid-cols-3 gap-3">
        <Field label="Description" className="sm:col-span-2">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Tell shoppers what this product is, what's special about it, materials, dimensions, anything you'd want them to know."
            className="input resize-y"
          />
          <p className="text-[10px] text-[color:var(--muted)] mt-1">
            {description.length} characters · shown on the product detail page
          </p>
        </Field>
        <Field label="Tags">
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="bluetooth, audio, premium"
            className="input"
          />
          <p className="text-[10px] text-[color:var(--muted)] mt-1">
            Comma-separated, lowercase. Helps shoppers find it via search.
          </p>
        </Field>
      </section>

      {/* Pricing & stock */}
      <section className="grid sm:grid-cols-4 gap-3">
        <Field label="Price (GHS)" required>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="input"
            placeholder="0.00"
          />
        </Field>
        <Field label="Sale price (optional)">
          <input
            type="number"
            step="0.01"
            min="0"
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
            className="input"
            placeholder="Leave blank for none"
          />
          {discountPct > 0 && (
            <p className="text-[10px] text-[color:var(--brand-clay)] font-semibold mt-1">
              Customers save {discountPct}%
            </p>
          )}
        </Field>
        <Field label="Stock on hand" required>
          <input
            required
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="input"
            placeholder="0"
          />
        </Field>
        <Field label="Reorder at" required>
          <input
            required
            type="number"
            min="0"
            value={reorderAt}
            onChange={(e) => setReorderAt(e.target.value)}
            className="input"
          />
        </Field>
      </section>

        </div>

        {/* Footer (sticky) */}
        <div className="flex gap-2 justify-end px-5 py-3 border-t border-[color:var(--border)] shrink-0">
          <button type="button" onClick={onCancel} className="btn-outline text-sm">
            Cancel
          </button>
          <button className="btn-gold text-sm">
            {initial ? "Save changes" : "Add product"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
  className,
  required,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="block text-sm font-medium mb-1.5">
        {label} {required && <span className="text-[color:var(--brand-clay)]">*</span>}
      </span>
      {children}
    </label>
  );
}

// ---------- Product preview drawer (slides in from the right) ----------

function ProductViewPanel({
  item,
  onClose,
  onEdit,
}: {
  item: InventoryItem;
  onClose: () => void;
  onEdit: () => void;
}) {
  const [activeImg, setActiveImg] = useState(0);
  const images = item.images ?? [];

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onSale = item.salePrice != null && item.salePrice < item.price;
  const stock =
    item.stock === 0
      ? { label: "Out of stock", cls: "badge-red" }
      : item.stock <= item.reorderAt
      ? { label: "Low stock", cls: "badge-amber" }
      : { label: "In stock", cls: "badge-green" };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[color:var(--border)] shrink-0">
          <h2 className="font-bold text-base text-[color:var(--brand-navy)]">Product preview</h2>
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="h-8 w-8 inline-flex items-center justify-center rounded-full text-[color:var(--muted)] hover:bg-[color:var(--brand-cream)] hover:text-[color:var(--brand-navy)] transition"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Images */}
          {images.length > 0 ? (
            <div>
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[color:var(--brand-cream)] border border-[color:var(--border)]">
                <Image src={images[activeImg]} alt={item.name} fill sizes="420px" className="object-contain" unoptimized />
              </div>
              {images.length > 1 && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {images.map((src, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImg(idx)}
                      className={`relative h-14 w-14 rounded-lg overflow-hidden border-2 transition ${
                        idx === activeImg ? "border-[color:var(--brand-navy)]" : "border-transparent hover:border-[color:var(--border)]"
                      }`}
                    >
                      <Image src={src} alt="" fill sizes="56px" className="object-cover" unoptimized />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-square w-full rounded-xl bg-[color:var(--brand-cream)] border border-[color:var(--border)] flex items-center justify-center text-sm text-[color:var(--muted)]">
              No images
            </div>
          )}

          {/* Identity */}
          <div>
            <h3 className="font-bold text-lg text-[color:var(--brand-navy)] leading-snug">{item.name}</h3>
            <div className="text-xs text-[color:var(--muted)] mt-0.5">{item.sku}</div>
            <span className="inline-block mt-2 badge bg-[color:var(--brand-cream)] text-[color:var(--brand-navy)]">{item.category}</span>
          </div>

          {/* Price */}
          {item.price === 0 ? (
            <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm px-3 py-2 font-medium">
              ⚠ Needs pricing — set a price using Edit so customers don&apos;t see GH₵0.
            </div>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[color:var(--brand-navy)]">{formatGHS(item.salePrice ?? item.price)}</span>
              {onSale && <span className="text-sm line-through text-[color:var(--muted)]">{formatGHS(item.price)}</span>}
            </div>
          )}

          {/* Stock */}
          <div className="flex items-center gap-2">
            <span className={`badge ${stock.cls}`}>{stock.label}</span>
            <span className="text-sm text-[color:var(--muted)]">{item.stock} unit{item.stock === 1 ? "" : "s"} in stock</span>
          </div>

          {/* Description */}
          {item.description && (
            <div>
              <div className="text-[11px] uppercase tracking-wide text-[color:var(--muted)] font-bold mb-1">Description</div>
              <p className="text-sm leading-relaxed text-[color:var(--brand-navy)] whitespace-pre-wrap">{item.description}</p>
            </div>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((t) => (
                <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-[color:var(--brand-cream)] text-[color:var(--muted)]">#{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-3 border-t border-[color:var(--border)] shrink-0">
          <button onClick={onEdit} className="btn-gold flex-1 justify-center">Edit product</button>
          <a
            href={`/products/${item.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline text-sm whitespace-nowrap"
            title="Open the live storefront page in a new tab"
          >
            Open on store ↗
          </a>
        </div>
      </div>
    </div>
  );
}

// ---------- Lightweight loading drawer shown while the edit form fetches images ----------

function FormLoadingDrawer({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[color:var(--border)] shrink-0">
          <h2 className="font-bold text-base text-[color:var(--brand-navy)]">Loading product…</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 inline-flex items-center justify-center rounded-full text-[color:var(--muted)] hover:bg-[color:var(--brand-cream)] hover:text-[color:var(--brand-navy)] transition"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[color:var(--muted)]">
          <div className="h-8 w-8 rounded-full border-2 border-[color:var(--brand-navy)] border-t-transparent animate-spin" />
          <p className="text-sm">Loading product details…</p>
        </div>
      </div>
    </div>
  );
}
