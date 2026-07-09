import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

// Live USD->GHS rate, cached in-memory for an hour so we don't hammer the
// provider on every keystroke. Falls back to the last good value (or a
// sensible default) if the provider is briefly unreachable.
type FxCache = { rate: number; asOf: string; fetchedAt: number };
let cache: FxCache | null = null;
const TTL_MS = 60 * 60 * 1000;
const FALLBACK_RATE = 15.5;

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || role === "customer") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  if (cache && now - cache.fetchedAt < TTL_MS) {
    return NextResponse.json({ ok: true, rate: cache.rate, asOf: cache.asOf, source: "open.er-api.com", cached: true });
  }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" });
    const data = (await res.json()) as {
      result?: string;
      rates?: Record<string, number>;
      time_last_update_utc?: string;
    };
    const rate = data.rates?.GHS;
    if (data.result === "success" && typeof rate === "number" && rate > 0) {
      cache = { rate, asOf: data.time_last_update_utc ?? new Date().toUTCString(), fetchedAt: now };
      return NextResponse.json({ ok: true, rate, asOf: cache.asOf, source: "open.er-api.com" });
    }
    throw new Error("Unexpected FX response");
  } catch {
    // Serve stale cache if we have it, else the fallback default.
    if (cache) {
      return NextResponse.json({ ok: true, rate: cache.rate, asOf: cache.asOf, source: "open.er-api.com", stale: true });
    }
    return NextResponse.json({ ok: true, rate: FALLBACK_RATE, asOf: null, source: "fallback", stale: true });
  }
}
