import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 }); }

  const data: Record<string, unknown> = {};
  if ("customerName" in body) data.customerName = body.customerName;
  if ("customerEmail" in body) data.customerEmail = body.customerEmail;
  if ("dueDate" in body) data.dueDate = new Date(body.dueDate as string);
  if ("lines" in body) data.lines = typeof body.lines === "string" ? body.lines : JSON.stringify(body.lines);
  if ("status" in body) data.status = body.status;
  if ("notes" in body) data.notes = body.notes;
  if ("number" in body) data.number = body.number;

  if (Object.keys(data).length === 0) return NextResponse.json({ ok: false, error: "Nothing to update" }, { status: 400 });

  try {
    const row = await prisma.invoice.update({ where: { id }, data });
    return NextResponse.json({
      ok: true,
      item: {
        ...row,
        createdAt: row.createdAt.toISOString(),
        dueDate: row.dueDate.toISOString(),
        lines: JSON.parse(row.lines),
        customerEmail: row.customerEmail ?? "",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.invoice.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
}
