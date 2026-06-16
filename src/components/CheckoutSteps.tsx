"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const STEPS = [
  { href: "/checkout/address", label: "Address" },
  { href: "/checkout/payment", label: "Shipping & Payment" },
  { href: "/checkout/review", label: "Review" },
];

export default function CheckoutSteps() {
  const pathname = usePathname();
  const activeIdx = Math.max(0, STEPS.findIndex((s) => pathname.startsWith(s.href)));

  return (
    <nav aria-label="Checkout progress" className="flex items-center gap-3">
      {STEPS.map((s, i) => {
        const done = i < activeIdx;
        const active = i === activeIdx;
        return (
          <div key={s.href} className="flex items-center gap-3 flex-1">
            <Link
              href={done ? s.href : "#"}
              onClick={(e) => !done && e.preventDefault()}
              className={`flex items-center gap-2 ${done ? "cursor-pointer" : "cursor-default"}`}
            >
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm transition ${
                  done
                    ? "bg-[color:var(--brand-teal)] text-white"
                    : active
                    ? "bg-[color:var(--brand-navy)] text-white"
                    : "bg-[color:var(--brand-cream)] text-[color:var(--muted)]"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={`text-sm font-semibold hidden sm:inline ${
                  active ? "text-[color:var(--brand-navy)]" : "text-[color:var(--muted)]"
                }`}
              >
                {s.label}
              </span>
            </Link>
            {i < STEPS.length - 1 && (
              <span className={`flex-1 h-px ${done ? "bg-[color:var(--brand-teal)]" : "bg-[color:var(--border)]"}`} />
            )}
          </div>
        );
      })}
    </nav>
  );
}
