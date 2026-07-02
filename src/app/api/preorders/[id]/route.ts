import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

const STATUSES = ["pending", "confirmed", "arrived", "fulfilled", "cancelled"] as const;

// PATCH /api/preorders/:id — admin: update reservation status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || role === "customer") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.status || !STATUSES.includes(body.status as (typeof STATUSES)[number])) {
    return NextResponse.json(
      { ok: false, error: `status must be one of: ${STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.preOrder.update({
      where: { id },
      data: { status: body.status },
    });
    return NextResponse.json({ ok: true, preorder: updated });
  } catch {
    return NextResponse.json({ ok: false, error: "Pre-order not found" }, { status: 404 });
  }
}

// DELETE /api/preorders/:id — admin: remove a reservation
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || role === "customer") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await prisma.preOrder.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Pre-order not found" }, { status: 404 });
  }
}
