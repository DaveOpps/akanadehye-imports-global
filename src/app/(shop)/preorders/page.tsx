import type { Metadata } from "next";
import { supportChannels } from "@/lib/support";
import { SHIPPING_SPEEDS } from "@/lib/dates";
import PreOrderTracker from "@/components/PreOrderTracker";

export const metadata: Metadata = {
  title: "Track your pre-order | Akanadehye Imports",
  description: "See where your pre-order is and when it's expected to arrive.",
};

export default function TrackPreOrderPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 lg:px-8 py-10 lg:py-14">
      <h1 className="text-2xl md:text-3xl font-bold text-[color:var(--brand-navy)]">
        Track your pre-order
      </h1>
      <p className="mt-2 text-sm text-[color:var(--muted)] leading-relaxed">
        Enter the order number from your confirmation along with the email you used.
        We&apos;ll show you the expected arrival date and how long is left.
      </p>

      <div className="mt-5 rounded-xl bg-[color:var(--brand-cream)]/70 border border-[color:var(--border)] p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-[color:var(--brand-navy)]">
          Delivery windows
        </div>
        <ul className="mt-2 space-y-1 text-sm text-[color:var(--muted)]">
          <li>
            <strong className="text-[color:var(--brand-navy)]">{SHIPPING_SPEEDS.air.label}</strong>{" "}
            — {SHIPPING_SPEEDS.air.short} from payment
          </li>
          <li>
            <strong className="text-[color:var(--brand-navy)]">{SHIPPING_SPEEDS.sea.label}</strong>{" "}
            — {SHIPPING_SPEEDS.sea.short} from payment
          </li>
        </ul>
      </div>

      <div className="mt-6">
        <PreOrderTracker supportChannels={supportChannels()} />
      </div>
    </div>
  );
}
