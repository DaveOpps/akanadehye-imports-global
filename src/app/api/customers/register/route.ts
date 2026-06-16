import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 }); }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").toLowerCase().trim();
  const password = String(body.password ?? "");
  const newsletterSubscribed = body.newsletterSubscribed !== false;
  const phone = body.phone ? String(body.phone).trim() : undefined;

  if (!name || !email || !password) {
    return NextResponse.json({ ok: false, error: "Name, email and password are required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ ok: false, error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ ok: false, error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const customer = await prisma.customer.create({
    data: { name, email, passwordHash, newsletterSubscribed, phone },
  });

  return NextResponse.json({ ok: true, id: customer.id, email: customer.email, name: customer.name });
}
