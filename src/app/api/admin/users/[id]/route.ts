import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

async function requireSuperAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const id   = (session?.user as { id?: string }   | undefined)?.id;
  if (!session?.user || role !== "super_admin") return null;
  return { session, callerId: id! };
}

type Params = Promise<{ id: string }>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const guard = await requireSuperAdmin();
  if (!guard) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { name, role, permissions, newPassword } = body as Record<string, string | undefined>;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Prevent removing the last super_admin
  if (role === "admin" && target.role === "super_admin") {
    const superCount = await prisma.user.count({ where: { role: "super_admin" } });
    if (superCount <= 1) {
      return NextResponse.json({ error: "Cannot demote the only super admin" }, { status: 400 });
    }
  }

  const data: Record<string, unknown> = {};
  if (name?.trim()) data.name = name.trim();
  if (role && ["admin", "super_admin"].includes(role)) {
    data.role = role;
    data.permissions = role === "super_admin" ? null : (permissions ?? target.permissions ?? "[]");
  } else if (permissions !== undefined) {
    data.permissions = permissions;
  }
  if (newPassword && newPassword.length >= 8) {
    data.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, role: true, permissions: true, createdAt: true },
  });

  return NextResponse.json({ user: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  const guard = await requireSuperAdmin();
  if (!guard) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (id === guard.callerId) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (target.role === "super_admin") {
    const superCount = await prisma.user.count({ where: { role: "super_admin" } });
    if (superCount <= 1) {
      return NextResponse.json({ error: "Cannot delete the only super admin" }, { status: 400 });
    }
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
