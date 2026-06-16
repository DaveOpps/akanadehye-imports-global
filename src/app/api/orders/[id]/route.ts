import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendOrderNotification } from "@/lib/notify";

const STATUS_MESSAGES: Record<string, { title: string; body: string }> = {
  confirmed: {
    title: "Order confirmed ✅",
    body: "Great news! Your order has been confirmed and is being prepared.",
  },
  shipped: {
    title: "Your order is on its way 🚚",
    body: "Your order has been shipped and is heading your way.",
  },
  delivered: {
    title: "Order delivered 🎉",
    body: "Your order has been delivered. Enjoy your purchase!",
  },
  cancelled: {
    title: "Order cancelled",
    body: "Your order has been cancelled. Contact us if you have any questions.",
  },
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 }); }

  const data: Record<string, unknown> = {};
  const simple = ["status", "paymentReference", "couponCode", "shippingMethod", "paymentMethod"];
  for (const key of simple) { if (key in body) data[key] = body[key]; }
  if ("items" in body) data.items = typeof body.items === "string" ? body.items : JSON.stringify(body.items);
  if ("address" in body) data.address = typeof body.address === "string" ? body.address : JSON.stringify(body.address);

  if (Object.keys(data).length === 0) return NextResponse.json({ ok: false, error: "Nothing to update" }, { status: 400 });

  try {
    const row = await prisma.order.update({ where: { id }, data });

    // Fire notification when status changes to a notable state
    const newStatus = body.status as string | undefined;
    const msg = newStatus ? STATUS_MESSAGES[newStatus] : null;
    if (msg) {
      const address = JSON.parse(row.address) as { fullName?: string; email?: string };
      const recipientEmail = row.customerEmail ?? address.email;
      if (recipientEmail) {
        await sendOrderNotification({
          email: recipientEmail,
          title: msg.title,
          body: `${msg.body}\n\nOrder: ${row.number}`,
          orderId: row.id,
          orderNumber: row.number,
          customerName: address.fullName ?? "Customer",
          status: newStatus,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      item: {
        ...row,
        createdAt: row.createdAt.toISOString(),
        items: JSON.parse(row.items),
        address: JSON.parse(row.address),
        customerEmail: row.customerEmail ?? undefined,
        paymentReference: row.paymentReference ?? undefined,
        couponCode: row.couponCode ?? undefined,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.order.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
}
