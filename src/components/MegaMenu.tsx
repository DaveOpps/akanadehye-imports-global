"use client";

import Link from "next/link";
import { useState } from "react";
import { UMBRELLA_CATEGORIES, type UmbrellaCategory } from "@/lib/storefront-categories";
import { CategoryIcon } from "./CategoryRail";

export default function MegaMenu({ onClose }: { onClose: () => void }) {
  const [active, setActive] = useState<UmbrellaCategory>(UMBRELLA_CATEGORIES[0]);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <button
        onClick={onClose}
        aria-label="Close menu"
        className="flex-1 bg-black/40 backdrop-blur-sm"
      />

      {/* Panel */}
      <aside className="w-full lg:w-[860px] max-w-[95vw] bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-4 bg-[color:var(--brand-navy)] text-white shrink-0">
          <div>
            <div className="font-bold">Browse categories</div>
            <div className="text-xs text-white/70">{UMBRELLA_CATEGORIES.length} departments</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="inline-flex items-center justify-center h-8 w-8 rounded hover:bg-white/10"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left rail of umbrella categories */}
          <nav className="w-full lg:w-72 shrink-0 overflow-y-auto bg-[color:var(--brand-cream)]/40 border-r border-[color:var(--border)]">
            <ul className="py-2">
              {UMBRELLA_CATEGORIES.map((u) => {
                const isActive = active.label === u.label;
                const isMobileExpanded = mobileExpanded === u.label;
                return (
                  <li key={u.label}>
                    <button
                      onMouseEnter={() => setActive(u)}
                      onClick={() =>
                        setMobileExpanded(isMobileExpanded ? null : u.label)
                      }
                      className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left transition ${
                        isActive
                          ? "bg-white text-[color:var(--brand-navy)] font-semibold"
                          : "hover:bg-white/60 text-[color:var(--brand-navy)]"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition ${
                            isActive
                              ? "bg-[color:var(--brand-navy)] text-[color:var(--brand-gold)]"
                              : "bg-white text-[color:var(--brand-navy)]"
                          }`}
                        >
                          <CategoryIcon name={u.icon} />
                        </span>
                        <span className="text-sm">{u.label}</span>
                      </span>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        className={`shrink-0 text-[color:var(--muted)] transition ${
                          isMobileExpanded ? "rotate-90 lg:rotate-0" : ""
                        }`}
                      >
                        <path
                          d="M9 6l6 6-6 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>

                    {/* Mobile-only expanded inline panel */}
                    {isMobileExpanded && (
                      <div className="lg:hidden px-4 pb-4 pt-2 bg-white">
                        <SubgroupsList umbrella={u} onClose={onClose} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Desktop subgroups panel */}
          <section className="hidden lg:flex flex-col flex-1 overflow-y-auto p-6">
            <header className="mb-5 flex items-end justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-[color:var(--brand-navy)]">
                  {active.label}
                </h2>
                {active.blurb && (
                  <p className="text-sm text-[color:var(--muted)] mt-1 max-w-md">
                    {active.blurb}
                  </p>
                )}
              </div>
              <Link
                href={`/products?category=${active.primarySlug}`}
                onClick={onClose}
                className="text-sm font-bold text-[color:var(--brand-navy)] hover:text-[color:var(--brand-clay)]"
              >
                Shop {active.label.toLowerCase()} →
              </Link>
            </header>

            <SubgroupsList umbrella={active} onClose={onClose} />
          </section>
        </div>
      </aside>
    </div>
  );
}

function SubgroupsList({
  umbrella,
  onClose,
}: {
  umbrella: UmbrellaCategory;
  onClose: () => void;
}) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
      {umbrella.groups.map((group) => (
        <div key={group.title}>
          <h3 className="text-[11px] uppercase tracking-[0.1em] font-bold text-[color:var(--brand-navy)] border-b border-[color:var(--border)] pb-2 mb-2">
            {group.title}
          </h3>
          <ul className="space-y-1">
            {group.items.map((item) => (
              <li key={`${group.title}-${item.label}-${item.slug}`}>
                <Link
                  href={`/products?category=${item.slug}`}
                  onClick={onClose}
                  className="block py-1 text-sm text-[color:var(--brand-navy)]/85 hover:text-[color:var(--brand-clay)] transition"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
