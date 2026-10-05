import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Guard for admin-only write endpoints.
 *
 * The inventory create/update/delete routes shipped with no authentication at
 * all — an unauthenticated PATCH from the open internet could change any
 * product's price, stock or images, and DELETE could empty the catalogue.
 *
 * Returns a 401 response to hand straight back, or null when the caller is
 * staff and the handler should continue.
 */
export async function requireStaff(): Promise<NextResponse | null> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || role === "customer") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
