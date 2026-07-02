"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useOrders } from "@/lib/orders";
import { hasPermission, type Permission } from "@/lib/permissions";

type Item = {
  href: string;
  label: string;
  icon: string;
  permission?: Permission;
  superAdminOnly?: boolean;
};
type Section = { label: string; items: Item[] };

const SECTIONS: Section[] = [
  {
    label: "Run shop",
    items: [
      { href: "/admin",            label: "Overview",   icon: "grid",      permission: "overview"  },
      { href: "/admin/inventory",  label: "Inventory",  icon: "box",       permission: "inventory" },
      { href: "/admin/orders",     label: "Orders",     icon: "orders",    permission: "orders"    },
      { href: "/admin/preorders",  label: "Pre-orders", icon: "preorder",  permission: "orders"    },
      { href: "/admin/customers",  label: "Customers",  icon: "customers", permission: "customers" },
      { href: "/admin/sourcing",   label: "Sourcing",   icon: "globe",     permission: "sourcing"  },
    ],
  },
  {
    label: "Get paid",
    items: [
      { href: "/admin/payments", label: "Payments", icon: "receipt", permission: "payments" },
      { href: "/admin/invoices", label: "Invoices",  icon: "send",    permission: "invoices" },
    ],
  },
  {
    label: "Engage",
    items: [
      { href: "/admin/chatbots",          label: "Chatbots",   icon: "chat",    permission: "chatbots" },
      { href: "/admin/chatbots/whatsapp", label: "WhatsApp",   icon: "whatsapp",permission: "chatbots" },
      { href: "/admin/chatbots/telegram", label: "Telegram",   icon: "telegram",permission: "chatbots" },
      { href: "/admin/chatbots/persona",  label: "Persona",    icon: "persona", permission: "chatbots" },
      { href: "/admin/chatbots/test",     label: "Test chat",  icon: "play",    permission: "chatbots" },
      { href: "/admin/chatbots/rate-limits", label: "Rate limits", icon: "gauge", permission: "chatbots" },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/admin/finance", label: "Finance Hub", icon: "finance", permission: "finance" },
    ],
  },
  {
    label: "Grow",
    items: [
      { href: "/admin/insights", label: "Insights", icon: "chart", permission: "insights" },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/admin/users",    label: "Team & Privileges", icon: "users",    superAdminOnly: true },
      { href: "/admin/settings", label: "Settings",          icon: "settings", permission: "settings" },
    ],
  },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { items: orderItems } = useOrders();
  const { data: session } = useSession();
  const pendingCount = orderItems.filter((o) => o.status === "pending").length;

  const role = (session?.user as { role?: string } | undefined)?.role ?? "";
  const rawPerms = (session?.user as { permissions?: string | null } | undefined)?.permissions ?? null;
  const isSuperAdmin = role === "super_admin";

  function canSee(item: Item): boolean {
    if (item.superAdminOnly) return isSuperAdmin;
    if (!item.permission) return true;
    return hasPermission(role, rawPerms, item.permission);
  }

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    if (href === "/admin/chatbots") return pathname === "/admin/chatbots";
    return pathname.startsWith(href);
  }

  return (
    <div className="max-w-7xl mx-auto px-5 lg:px-8 py-8 lg:py-10">
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="border border-[color:var(--border)] rounded-xl bg-white overflow-hidden">
            <div className="px-4 py-3 bg-[color:var(--brand-cream)] border-b border-[color:var(--border)]">
              <div className="text-xs uppercase tracking-wider text-[color:var(--muted)] font-semibold">
                Admin Dashboard
              </div>
              {isSuperAdmin && (
                <div className="mt-0.5 text-[10px] text-amber-600 font-bold flex items-center gap-1">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  Super Admin
                </div>
              )}
            </div>

            <nav className="p-2 space-y-4">
              {SECTIONS.map((section) => {
                const visible = section.items.filter(canSee);
                if (visible.length === 0) return null;
                return (
                  <div key={section.label}>
                    <div className="px-3 pt-2 pb-1.5 text-[10px] uppercase tracking-[0.1em] text-[color:var(--muted)] font-bold">
                      {section.label}
                    </div>
                    <div className="space-y-0.5">
                      {visible.map((n) => {
                        const active = isActive(n.href);
                        return (
                          <Link
                            key={n.href}
                            href={n.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                              active
                                ? "bg-[color:var(--brand-navy)] text-white shadow-sm"
                                : "text-[color:var(--brand-navy)] hover:bg-[color:var(--brand-cream)]"
                            }`}
                          >
                            <Icon name={n.icon} />
                            {n.label}
                            {n.href === "/admin/orders" && pendingCount > 0 && (
                              <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[color:var(--brand-clay)] text-white text-[10px] font-bold px-1 leading-none">
                                {pendingCount > 9 ? "9+" : pendingCount}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>

            <div className="border-t border-[color:var(--border)] px-4 py-3">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[color:var(--muted)] hover:text-[color:var(--brand-navy)] transition"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                View storefront
              </Link>
            </div>
          </div>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    grid:     <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
    pos:      <path d="M7 2h10a2 2 0 012 2v16a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2zM8 6h8M8 10h8M11 18h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    receipt:  <path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2zM9 7h6M9 11h6M9 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    box:      <path d="M3 8l9-5 9 5v8l-9 5-9-5V8zM3 8l9 5m0 0l9-5m-9 5v9" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
    chart:    <path d="M4 4v16h16M8 16V11M12 16V7M16 16v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    send:     <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    globe:    <path d="M12 22a10 10 0 100-20 10 10 0 000 20zM2 12h20M12 2a14 14 0 010 20M12 2a14 14 0 000 20" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
    wallet:   <path d="M3 8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8zM17 12h.01M3 8V6a2 2 0 012-2h12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />,
    chat:     <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
    orders:   <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    settings: <path d="M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    whatsapp: <path d="M20.52 3.48A11.85 11.85 0 0012.04 0C5.5 0 .2 5.3.2 11.85c0 2.09.55 4.13 1.6 5.93L0 24l6.36-1.67a11.83 11.83 0 005.68 1.45h.01c6.54 0 11.84-5.3 11.84-11.85a11.8 11.8 0 00-3.37-8.45z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
    telegram: <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.24 3.64 11.95c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.7L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" fill="currentColor" />,
    customers: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></>,
    persona:  <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    play:     <path d="M8 5v14l11-7z" fill="currentColor" />,
    gauge:    <><path d="M12 14l4-4M21 12a9 9 0 10-18 0 9 9 0 0018 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 12h2M19 12h2M12 3v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>,
    preorder: <><rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M3 9h18M8 2v4M16 2v4M9 15l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></>,
    finance:  <><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" strokeWidth="2" /><path d="M12 6v2M12 16v2M8.5 9.5A3 3 0 0112 8a3 3 0 013 3c0 2-3 2.5-3 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></>,
    users:    <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="19" cy="7" r="0" fill="currentColor"/><path d="M19 5v4M17 7h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>,
  };
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none">{paths[name]}</svg>;
}
