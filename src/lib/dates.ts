/** Standard pre-order fulfillment window, in working days (Mon–Fri). */
export const PREORDER_LEAD_WORKING_DAYS = 45;

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
