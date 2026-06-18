"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useOrders } from "@/lib/orders";
import { useInventory } from "@/lib/store";

export default function DashboardTopBar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { items: orderItems } = useOrders();
  const { items: invItems } = useInventory();
  const pendingOrders = orderItems.filter((o) => o.status === "pending").length;
  const lowStockCount = invItems.filter((i) => i.stock <= i.reorderAt).length;
  const alertCount = pendingOrders + lowStockCount;

  const name = session?.user?.name ?? "Admin";
  const email = session?.user?.email ?? "";
  const displayUser = { name, email, initial: name.charAt(0).toUpperCase() };

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[color:var(--brand-navy)] text-white border-b border-black/10">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Brand + merchant badge */}
        <Link href="/admin" className="flex items-center gap-2.5 shrink-0">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--brand-gold)] text-[color:var(--brand-navy)] font-bold text-base">
            A
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-bold tracking-tight">Akanadehye</span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] uppercase tracking-widest font-bold bg-[color:var(--brand-gold)]/20 text-[color:var(--brand-gold)] border border-[color:var(--brand-gold)]/40">
              Merchant
            </span>
          </div>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-1 lg:gap-2">
          <Link
            href="/"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-white/10 transition"
            title="Go to the public storefront"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 11l9-8 9 8v10a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1V11z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
            View storefront
          </Link>

          {/* Notifications */}
          <button
            aria-label="Notifications"
            className="relative inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-white/10 transition"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9zM13.7 21a2 2 0 01-3.4 0"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {alertCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-[color:var(--brand-clay)] text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            ) : (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[color:var(--brand-gold)]" />
            )}
          </button>

          {/* User menu */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-haspopup="true"
              className="inline-flex items-center gap-2 px-1.5 py-1.5 rounded-full hover:bg-white/10 transition"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[color:var(--brand-gold)] to-[color:var(--brand-clay)] text-white font-bold text-sm">
                {displayUser.initial}
              </span>
              <span className="hidden md:inline text-sm font-medium">{displayUser.name}</span>
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                className={`hidden md:block transition ${menuOpen ? "rotate-180" : ""}`}
              >
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white text-[color:var(--brand-navy)] shadow-xl overflow-hidden">
                <div className="px-4 py-3 bg-[color:var(--brand-cream)] border-b border-[color:var(--border)]">
                  <div className="font-semibold text-sm">{displayUser.name}</div>
                  <div className="text-xs text-[color:var(--muted)] truncate">{displayUser.email}</div>
                </div>
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm hover:bg-[color:var(--brand-cream)]"
                >
                  Dashboard overview
                </Link>
                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  className="block md:hidden px-4 py-2.5 text-sm hover:bg-[color:var(--brand-cream)]"
                >
                  View storefront
                </Link>
                <div className="border-t border-[color:var(--border)]" />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    signOut({ callbackUrl: "/login" });
                  }}
                  className="block w-full text-left px-4 py-2.5 text-sm text-[color:var(--brand-clay)] hover:bg-[color:var(--brand-cream)] font-semibold"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
