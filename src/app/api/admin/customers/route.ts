import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const CONFIRM_PHRASE = "DELETE ALL CUSTOMERS";

export async function GET() {
  try {
    const session = await auth();
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session?.user || role === "customer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Fetch all linked orders in one query, then aggregate in JS
    const emails = customers.map((c) => c.email);
    const orders = emails.length
      ? await prisma.order.findMany({
          where: { customerEmail: { in: emails } },
          select: { customerEmail: true, total: true },
        })
      : [];

    // Build per-email stats
    const statsMap = new Map<string, { count: number; spend: number }>();
    for (const o of orders) {
      if (!o.customerEmail) continue;
      const prev = statsMap.get(o.customerEmail) ?? { count: 0, spend: 0 };
      statsMap.set(o.customerEmail, { count: prev.count + 1, spend: prev.spend + o.total });
    }

    return NextResponse.json({
      customers: customers.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone ?? null,
        newsletterSubscribed: c.newsletterSubscribed,
        createdAt: c.createdAt.toISOString(),
        orderCount: statsMap.get(c.email)?.count ?? 0,
        totalSpend: statsMap.get(c.email)?.spend ?? 0,
      })),
    });
  } catch (err) {
    console.error("[/api/admin/customers]", err);
    return NextResponse.json({ error: "Server error", detail: String(err) }, { status: 500 });
  }
}

// DELETE /api/admin/customers — wipe ALL customer accounts (super_admin only).
// Orders and payments are untouched (Order.customerEmail is a plain string,
// not a foreign key) — this only removes storefront login accounts.
export async function DELETE(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role?: string; email?: string } | undefined;
  if (user?.role !== "super_admin") {
    return NextResponse.json({ error: "Only a super admin can clear all customers" }, { status: 403 });
  }

  let body: { confirm?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.confirm !== CONFIRM_PHRASE) {
    return NextResponse.json(
      { error: `Type "${CONFIRM_PHRASE}" exactly to confirm.` },
      { status: 400 }
    );
  }

  const count = await prisma.customer.count();
  await prisma.customer.deleteMany({});

  void logAudit({
    action: "DELETE",
    entity: "Customer",
    entityId: "ALL",
    entityName: `${count} customer account(s)`,
    actor: user.email ?? "super_admin",
  });

  return NextResponse.json({ ok: true, deleted: count });
}
