import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// DELETE /api/admin/tax-calculator/:id — super_admin: remove a saved estimate
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "super_admin") {
    return NextResponse.json({ ok: false, error: "Restricted to the super admin." }, { status: 403 });
  }
  const { id } = await params;
  try {
    await prisma.taxEstimate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Estimate not found" }, { status: 404 });
  }
}
