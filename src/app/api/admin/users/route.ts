import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

async function requireSuperAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "super_admin") return null;
  return session;
}

export async function GET() {
  if (!await requireSuperAdmin()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, role: true, permissions: true, createdAt: true },
  });
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { name, email, password, role = "admin", permissions } = body as Record<string, string>;

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "name, email and password are required" }, { status: 400 });
  }
  if (!["admin", "super_admin"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) return NextResponse.json({ error: "A user with that email already exists" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase().trim(),
      name: name.trim(),
      passwordHash,
      role,
      permissions: role === "super_admin" ? null : (permissions ?? "[]"),
    },
    select: { id: true, email: true, name: true, role: true, permissions: true, createdAt: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
