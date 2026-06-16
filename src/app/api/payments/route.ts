import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestUserId } from "@/lib/api-auth";

export async function GET() {
  const userId = await getRequestUserId();
  if (!userId) return NextResponse.json([], { status: 200 });

  const rows = await prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      customer: r.customer,
      amount: r.amount,
      currency: r.currency,
      method: r.method,
      reference: r.reference,
      status: r.status,
      note: r.note ?? undefined,
    }))
  );
}

export async function POST(req: NextRequest) {
  const userId = await getRequestUserId();
  if (!userId) return NextResponse.json({ ok: false, error: "No user" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 }); }

  const { id, customer, amount, currency = "GHS", method, reference, status = "succeeded", note } = body as Record<string, unknown>;

  if (!customer || amount == null || !method || !reference) {
    return NextResponse.json({ ok: false, error: "customer, amount, method, reference required" }, { status: 400 });
  }

  const row = await prisma.payment.create({
    data: {
      ...(id ? { id: String(id) } : {}),
      userId,
      customer: String(customer),
      amount: Number(amount),
      currency: String(currency),
      method: String(method),
      reference: String(reference),
      status: String(status),
      note: note ? String(note) : null,
    },
  });

  return NextResponse.json({
    ok: true,
    item: { ...row, createdAt: row.createdAt.toISOString(), note: row.note ?? undefined },
  });
}
