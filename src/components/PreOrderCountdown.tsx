"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  SHIPPING_SPEEDS,
  daysUntil,
  formatEtaDate,
  isShippingSpeed,
} from "@/lib/dates";
import type { SupportChannel } from "@/lib/support";

/**
 * Calendar-style countdown to a pre-order's expected arrival.
 *
 * The point is to keep the agreed timeline in front of the customer so the
 * wait is understood rather than discovered — and once the date passes, to
 * put support one click away instead of leaving them to chase.
 */
export default function PreOrderCountdown({
  expectedArrival,
  shippingMethod,
  placedAt,
  supportChannels,
  compact = false,
}: {
  expectedArrival: string | null;
  shippingMethod: string;
  placedAt?: string;
  supportChannels: SupportChannel[];
  compact?: boolean;
}) {
  // Rendered on the server first, so hold off on "today" until mounted to
  // avoid a hydration mismatch when the server and client straddle midnight.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    // Re-check hourly so a tab left open rolls over on its own.
    const t = setInterval(() => setNow(new Date()), 60 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const speed = isShippingSpeed(shippingMethod) ? SHIPPING_SPEEDS[shippingMethod] : null;

  if (!expectedArrival) {
    return (
      <div className="rounded-xl border border-[color:var(--border)] bg-white p-4 text-sm text-[color:var(--muted)]">
        We&apos;ll confirm your arrival date shortly
        {speed ? ` — ${speed.label.toLowerCase()} usually takes ${speed.short}.` : "."}
      </div>
    );
  }

  const due = new Date(expectedArrival);
  const remaining = now ? daysUntil(due, now) : null;
  const overdue = remaining !== null && remaining < 0;
  const arrivingToday = remaining === 0;

  // Progress along the agreed window, for the bar under the date.
  let pct: number | null = null;
  if (now && placedAt) {
    const start = new Date(placedAt).getTime();
    const end = due.getTime();
    if (end > start) {
      pct = Math.min(100, Math.max(0, ((now.getTime() - start) / (end - start)) * 100));
    }
  }

  const month = due.toLocaleDateString("en-GB", { month: "long" }).toUpperCase();
  const weekday = due.toLocaleDateString("en-GB", { weekday: "long" });

  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        overdue
          ? "border-[color:var(--brand-clay)] bg-[color:var(--brand-clay)]/5"
          : "border-[color:var(--border)] bg-white"
      }`}
    >
      <div className={`flex gap-4 p-4 ${compact ? "" : "sm:p-5"}`}>
        {/* Calendar tile */}
        <div className="shrink-0 w-[72px] rounded-lg overflow-hidden border border-[color:var(--border)] bg-white shadow-sm">
          <div
            className={`text-center text-[10px] font-bold tracking-widest text-white py-1 ${
              overdue ? "bg-[color:var(--brand-clay)]" : "bg-[color:var(--brand-navy)]"
            }`}
          >
            {month}
          </div>
          <div className="text-center py-1.5">
            <div className="text-2xl font-extrabold leading-none text-[color:var(--brand-navy)]">
              {due.getDate()}
            </div>
            <div className="text-[10px] text-[color:var(--muted)] mt-0.5">{weekday}</div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          {remaining === null ? (
            <div className="h-5 w-40 rounded bg-[color:var(--brand-cream)] animate-pulse" />
          ) : overdue ? (
            <div className="font-bold text-[color:var(--brand-clay)]">
              {Math.abs(remaining)} day{Math.abs(remaining) === 1 ? "" : "s"} past the expected date
            </div>
          ) : arrivingToday ? (
            <div className="font-bold text-[color:var(--brand-navy)]">Expected today</div>
          ) : (
            <div className="font-bold text-[color:var(--brand-navy)]">
              <span className="text-2xl">{remaining}</span>{" "}
              <span className="text-sm font-semibold">
                day{remaining === 1 ? "" : "s"} to go
              </span>
            </div>
          )}

          <div className="text-xs text-[color:var(--muted)] mt-1">
            Expected {formatEtaDate(due)}
            {speed ? ` · ${speed.label} (${speed.short})` : ""}
          </div>

          {pct !== null && !overdue && (
            <div className="mt-2.5 h-1.5 rounded-full bg-[color:var(--brand-cream)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[color:var(--brand-gold)] transition-[width] duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {overdue && (
        <div className="border-t border-[color:var(--brand-clay)]/30 bg-white px-4 py-3 sm:px-5">
          <p className="text-sm text-[color:var(--brand-navy)] font-medium">
            This is taking longer than expected — we&apos;re sorry.
          </p>
          <p className="text-xs text-[color:var(--muted)] mt-0.5">
            Shipping dates are estimates and can move with clearing. Get in touch and
            we&apos;ll tell you exactly where your order is.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {supportChannels.map((c) =>
              c.href.startsWith("/") ? (
                <Link
                  key={c.kind}
                  href={c.href}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border border-[color:var(--brand-navy)] text-[color:var(--brand-navy)] hover:bg-[color:var(--brand-navy)] hover:text-white transition"
                >
                  {c.label}
                </Link>
              ) : (
                <a
                  key={c.kind}
                  href={c.href}
                  target={c.kind === "whatsapp" ? "_blank" : undefined}
                  rel={c.kind === "whatsapp" ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-[color:var(--brand-navy)] text-white hover:opacity-90 transition"
                >
                  {c.label}
                </a>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
