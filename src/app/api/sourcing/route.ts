import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestUserId } from "@/lib/api-auth";

export async function GET() {
  const userId = await getRequestUserId();
  if (!userId) return NextResponse.json([], { status: 200 });

  const rows = await prisma.sourcingOrder.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      productLink: r.productLink ?? "",
      productName: r.productName,
      quantity: r.quantity,
      estCostUsd: r.estCostUsd,
      fxRate: r.fxRate,
      status: r.status,
      notes: r.notes ?? undefined,
    }))
  );
}

export async function POST(req: NextRequest) {
  const userId = await getRequestUserId();
  if (!userId) return NextResponse.json({ ok: false, error: "No user" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 }); }

  const { id, productLink, productName, quantity, estCostUsd, fxRate = 15.2, status = "requested", notes } = body as Record<string, unknown>;

  if (!productName || quantity == null || estCostUsd == null) {
    return NextResponse.json({ ok: false, error: "productName, quantity, estCostUsd required" }, { status: 400 });
  }

  const row = await prisma.sourcingOrder.create({
    data: {
      ...(id ? { id: String(id) } : {}),
      userId,
      productLink: productLink ? String(productLink) : null,
      productName: String(productName),
      quantity: Number(quantity),
      estCostUsd: Number(estCostUsd),
      fxRate: Number(fxRate),
      status: String(status),
      notes: notes ? String(notes) : null,
    },
  });

  return NextResponse.json({
    ok: true,
    item: {
      ...row,
      createdAt: row.createdAt.toISOString(),
      productLink: row.productLink ?? "",
      notes: row.notes ?? undefined,
    },
  });
}
