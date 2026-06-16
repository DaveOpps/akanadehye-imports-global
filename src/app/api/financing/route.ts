import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestUserId } from "@/lib/api-auth";

export async function GET() {
  const userId = await getRequestUserId();
  if (!userId) return NextResponse.json([], { status: 200 });

  const rows = await prisma.financingApplication.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      amount: r.amount,
      termMonths: r.termMonths,
      purpose: r.purpose,
      status: r.status,
    }))
  );
}

export async function POST(req: NextRequest) {
  const userId = await getRequestUserId();
  if (!userId) return NextResponse.json({ ok: false, error: "No user" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 }); }

  const { id, amount, termMonths, purpose, status = "submitted" } = body as Record<string, unknown>;

  if (amount == null || termMonths == null || !purpose) {
    return NextResponse.json({ ok: false, error: "amount, termMonths, purpose required" }, { status: 400 });
  }

  const row = await prisma.financingApplication.create({
    data: {
      ...(id ? { id: String(id) } : {}),
      userId,
      amount: Number(amount),
      termMonths: Number(termMonths),
      purpose: String(purpose),
      status: String(status),
    },
  });

  return NextResponse.json({
    ok: true,
    item: { ...row, createdAt: row.createdAt.toISOString() },
  });
}
