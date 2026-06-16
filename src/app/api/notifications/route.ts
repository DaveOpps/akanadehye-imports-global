import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.email || role !== "customer") {
    return NextResponse.json({ notifications: [] });
  }

  const notifications = await prisma.notification.findMany({
    where: { email: session.user.email },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json({
    notifications: notifications.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      read: n.read,
      orderId: n.orderId,
      orderNumber: n.orderNumber,
      createdAt: n.createdAt.toISOString(),
    })),
  });
}

// Mark all as read
export async function PATCH() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.email || role !== "customer") {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  await prisma.notification.updateMany({
    where: { email: session.user.email, read: false },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
