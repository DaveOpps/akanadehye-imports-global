"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "./CartContext";
import MegaMenu from "./MegaMenu";
import FeaturedDropdown from "./FeaturedDropdown";

const EXTRA_LINKS = [
  { label: "Returns", href: "/returns" },
  { label: "Deals", href: "/products?sort=discountPercentage&order=desc" },
  { label: "Help Center", href: "/help" },
];

// Isolated component so useSearchParams() is inside a Suspense boundary.
function NavSearch() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");

  useEffect(() => {
    setQ(sp.get("q") ?? "");
  }, [sp]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/products?q=${encodeURIComponent(term)}` : "/products");
  }

  return (
    <form onSubmit={submitSearch} className="flex-1 min-w-0 max-w-xs lg:max-w-sm" role="search">
      <div className="relative flex items-center">
        <svg
          aria-hidden="true"
          className="absolute left-3 text-[color:var(--muted)] shrink-0"
          width="15"
          height="15"
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
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products..."
          aria-label="Search"
          className="w-full pl-8 pr-4 py-2 rounded-full bg-[color:var(--brand-cream)] border border-[color:var(--border)] text-sm focus:outline-2 focus:outline-[color:var(--brand-navy)] focus:bg-white transition"
        />
      </div>
    </form>
  );
}

export default function Navbar() {
  const { count } = useCart();
  const { data: session } = useSession();
  const customerName = session?.user?.name ?? null;
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isCustomer = role === "customer";
  const isAdmin = role === "admin" || role === "super_admin";

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!isCustomer) return;
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setUnread((d.notifications ?? []).filter((n: { read: boolean }) => !n.read).length))
      .catch(() => {});
  }, [isCustomer]);

  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node))
        setAccountOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setAccountOpen(false);
        setDrawerOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-[color:var(--border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-3 lg:px-8 flex items-center gap-2 lg:gap-3 h-14 lg:h-16">

          {/* Mobile hamburger */}
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open categories"
            className="lg:hidden p-2 -ml-1 rounded hover:bg-[color:var(--brand-cream)] transition"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--brand-navy)] text-[color:var(--brand-gold)] font-bold text-lg">
              A
            </span>
            <span className="hidden sm:inline font-bold text-lg tracking-tight text-[color:var(--brand-navy)]">
              Akanadehye
            </span>
          </Link>

          {/* Desktop inline nav links */}
          <nav aria-label="Site navigation" className="hidden lg:flex items-center gap-0.5 shrink-0">

            <Link
              href="/"
              className="px-3 py-2 text-sm font-medium text-[color:var(--brand-navy)] hover:bg-[color:var(--brand-cream)] rounded transition"
            >
              Home
            </Link>

            {/* Categories ▼ — opens MegaMenu */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[color:var(--brand-navy)] hover:bg-[color:var(--brand-cream)] rounded transition"
            >
              Categories
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Featured ▼ — mega dropdown */}
            <FeaturedDropdown />

            {EXTRA_LINKS.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="px-3 py-2 text-sm font-medium text-[color:var(--brand-navy)] hover:bg-[color:var(--brand-cream)] rounded transition"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          {/* Search — fills remaining space */}
          <Suspense fallback={
            <div className="flex-1 min-w-0 max-w-xs lg:max-w-sm">
              <div className="w-full h-9 rounded-full bg-[color:var(--brand-cream)] border border-[color:var(--border)]" />
            </div>
          }>
            <NavSearch />
          </Suspense>

          {/* Right actions */}
          <div className="flex items-center gap-0.5 shrink-0">

            {/* Notifications bell — customers only */}
            {isCustomer && (
              <Link
                href="/account"
                aria-label="Notifications"
                className="relative inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-[color:var(--brand-cream)] transition text-[color:var(--brand-navy)]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {unread > 0 && (
                  <span className="absolute top-0.5 right-0.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-[color:var(--brand-clay)] text-white text-[9px] font-bold leading-none">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            )}

            {/* Wishlist */}
            <Link
              href="/products"
              aria-label="Wishlist"
              className="inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-[color:var(--brand-cream)] transition text-[color:var(--brand-navy)]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-[color:var(--brand-cream)] transition"
              aria-label="Cart"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6zM3 6h18M16 10a4 4 0 11-8 0"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
              {count > 0 && (
                <span className="absolute top-0.5 right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[color:var(--brand-clay)] text-white text-[9px] font-bold leading-none">
                  {count}
                </span>
              )}
            </Link>

            {/* Auth buttons — sign in / sign up when guest, greeting when logged in */}
            {isCustomer ? (
              <span className="hidden md:inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--brand-navy)] px-3 py-1.5">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {customerName?.split(" ")[0] ?? "Account"}
              </span>
            ) : !isAdmin ? (
              <>
                <Link
                  href="/register"
                  className="hidden md:inline-flex items-center px-3 py-1.5 text-sm font-semibold text-[color:var(--brand-navy)] hover:text-[color:var(--brand-clay)] transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="hidden md:inline-flex items-center px-4 py-1.5 rounded-lg bg-[color:var(--brand-navy)] text-white text-sm font-bold hover:bg-[color:var(--brand-navy-soft)] transition"
                >
                  Sign Up
                </Link>
              </>
            ) : null}

            {/* Account dropdown */}
            <div ref={accountRef} className="relative">
              <button
                onClick={() => setAccountOpen((o) => !o)}
                aria-expanded={accountOpen}
                aria-haspopup="true"
                className="inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-[color:var(--brand-cream)] transition"
                aria-label="My account"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {accountOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[color:var(--border)] bg-white shadow-xl overflow-hidden">
                  {isCustomer ? (
                    <>
                      <div className="px-4 py-3 border-b border-[color:var(--border)]">
                        <div className="text-xs text-[color:var(--muted)]">Signed in as</div>
                        <div className="font-semibold text-sm text-[color:var(--brand-navy)] truncate">{customerName}</div>
                      </div>
                      <Link href="/account" onClick={() => setAccountOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-[color:var(--brand-cream)]">My account</Link>
                      <Link href="/orders" onClick={() => setAccountOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-[color:var(--brand-cream)]">My orders</Link>
                      <Link href="/cart" onClick={() => setAccountOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-[color:var(--brand-cream)]">My cart</Link>
                      <div className="border-t border-[color:var(--border)]" />
                      <button
                        onClick={() => { setAccountOpen(false); signOut({ callbackUrl: "/" }); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        Sign out
                      </button>
                    </>
                  ) : isAdmin ? (
                    <>
                      <div className="px-4 py-3 border-b border-[color:var(--border)]">
                        <div className="text-xs text-[color:var(--muted)]">Signed in as admin</div>
                        <div className="font-semibold text-sm text-[color:var(--brand-navy)] truncate">{session?.user?.email}</div>
                      </div>
                      <Link href="/admin" onClick={() => setAccountOpen(false)} className="block px-4 py-2.5 text-sm font-semibold text-[color:var(--brand-navy)] hover:bg-[color:var(--brand-cream)]">Merchant dashboard →</Link>
                      <div className="border-t border-[color:var(--border)]" />
                      <button
                        onClick={() => { setAccountOpen(false); signOut({ callbackUrl: "/" }); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="md:hidden">
                        <Link href="/register" onClick={() => setAccountOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-[color:var(--brand-cream)]">Sign in</Link>
                        <Link href="/register" onClick={() => setAccountOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-[color:var(--brand-cream)]">Create account</Link>
                        <div className="border-t border-[color:var(--border)]" />
                      </div>
                      <Link href="/orders" onClick={() => setAccountOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-[color:var(--brand-cream)]">My orders</Link>
                      <Link href="/cart" onClick={() => setAccountOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-[color:var(--brand-cream)]">My cart</Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {drawerOpen && <MegaMenu onClose={() => setDrawerOpen(false)} />}
    </>
  );
}
