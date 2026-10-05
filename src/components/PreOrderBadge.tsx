import { SHIPPING_SPEEDS } from "@/lib/dates";

/**
 * Red pre-order tag shown on product imagery.
 *
 * Deliberately high-contrast: the business is a sourcing service, and the
 * single most common complaint is customers not realising an item has to be
 * imported until they're waiting on it. One component so the card, the rail
 * and the product page can't drift apart.
 */
export default function PreOrderBadge({ size = "md" }: { size?: "sm" | "md" }) {
  const sm = size === "sm";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md bg-[#dc2626] text-white font-extrabold uppercase tracking-wide leading-none shadow-md ring-1 ring-white/30 ${
        sm ? "px-1.5 py-1 text-[9px]" : "px-2 py-1.5 text-[10px]"
      }`}
    >
      <svg width={sm ? 9 : 11} height={sm ? 9 : 11} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" />
        <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Pre-order
    </span>
  );
}

/** Lead-time wording for the small meta line under a product title. */
export function preorderLeadLabel(): string {
  return `${SHIPPING_SPEEDS.air.workingDays}–${SHIPPING_SPEEDS.sea.workingDays} business days`;
}
