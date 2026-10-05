/**
 * Pre-orders ship one of two ways, and the lead times are very different.
 * The customer picks at reservation time and the countdown runs from that
 * choice, so the figures live here rather than being written into copy.
 */
export const SHIPPING_SPEEDS = {
  air: {
    label: "Air freight",
    workingDays: 5,
    short: "5 business days",
    blurb: "Fastest. Best for small, urgent or high-value items.",
  },
  sea: {
    label: "Sea freight",
    workingDays: 45,
    short: "45 business days",
    blurb: "Most economical. Standard for bulky items and machinery.",
  },
} as const;

export type ShippingSpeed = keyof typeof SHIPPING_SPEEDS;

export const SHIPPING_SPEED_KEYS = Object.keys(SHIPPING_SPEEDS) as ShippingSpeed[];

export function isShippingSpeed(v: unknown): v is ShippingSpeed {
  return typeof v === "string" && v in SHIPPING_SPEEDS;
}

export function leadWorkingDays(speed: ShippingSpeed): number {
  return SHIPPING_SPEEDS[speed].workingDays;
}

/**
 * Standard (sea) pre-order window. Kept as the default because sea was the
 * only option before air was offered, so existing rows mean sea.
 */
export const PREORDER_LEAD_WORKING_DAYS = SHIPPING_SPEEDS.sea.workingDays;

/**
 * Whole days from now until `due`, counting calendar days (not working days)
 * because that is what a customer watching a countdown actually experiences.
 * Negative once the date has passed.
 */
export function daysUntil(due: Date | string, from: Date = new Date()): number {
  const target = typeof due === "string" ? new Date(due) : due;
  const a = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  const b = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((a - b) / 86_400_000);
}

/**
 * Add `days` working days (Mon–Fri) to `start`. Doesn't account for public
 * holidays — it's an estimate communicated to customers, not a hard SLA.
 */
export function addWorkingDays(start: Date, days: number): Date {
  const d = new Date(start);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay(); // 0 = Sun, 6 = Sat
    if (day !== 0 && day !== 6) added++;
  }
  return d;
}

export function formatEtaDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
