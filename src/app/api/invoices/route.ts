import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestUserId } from "@/lib/api-auth";

export async function GET() {
  const userId = await getRequestUserId();
  if (!userId) return NextResponse.json([], { status: 200 });

  const rows = await prisma.invoice.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      number: r.number,
      customerName: r.customerName,
      customerEmail: r.customerEmail ?? "",
      dueDate: r.dueDate.toISOString(),
      lines: JSON.parse(r.lines),
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

  const { id, number, customerName, customerEmail, dueDate, lines, status = "draft", notes } = body as Record<string, unknown>;

  if (!number || !customerName || !dueDate || !lines) {
    return NextResponse.json({ ok: false, error: "number, customerName, dueDate, lines required" }, { status: 400 });
  }

  const row = await prisma.invoice.create({
    data: {
      ...(id ? { id: String(id) } : {}),
      userId,
      number: String(number),
      customerName: String(customerName),
      customerEmail: customerEmail ? String(customerEmail) : null,
      dueDate: new Date(dueDate as string),
      lines: typeof lines === "string" ? lines : JSON.stringify(lines),
      status: String(status),
      notes: notes ? String(notes) : null,
    },
  });

  return NextResponse.json({
    ok: true,
    item: {
      ...row,
      createdAt: row.createdAt.toISOString(),
      dueDate: row.dueDate.toISOString(),
      lines: JSON.parse(row.lines),
      customerEmail: row.customerEmail ?? "",
      notes: row.notes ?? undefined,
    },
  });
}
