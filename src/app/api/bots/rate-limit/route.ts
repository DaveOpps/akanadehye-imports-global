import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRateLimitStats } from "@/lib/rateLimit";

/**
 * Live rate-limit metrics for the admin monitoring dashboard.
 * Admin-only — customers and unauthenticated callers get 401.
 */
export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || role === "customer") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, ...getRateLimitStats() });
}
