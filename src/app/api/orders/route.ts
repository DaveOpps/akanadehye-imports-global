import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestUserId, getCustomerEmail } from "@/lib/api-auth";

export async function GET() {
  const userId = await getRequestUserId();
  if (!userId) return NextResponse.json([], { status: 200 });

  const rows = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      number: r.number,
      status: r.status,
      items: JSON.parse(r.items),
      subtotal: r.subtotal,
      shipping: r.shipping,
      tax: r.tax,
      discount: r.discount,
      total: r.total,
      address: JSON.parse(r.address),
      shippingMethod: r.shippingMethod,
      paymentMethod: r.paymentMethod,
      customerEmail: r.customerEmail ?? undefined,
      paymentReference: r.paymentReference ?? undefined,
      couponCode: r.couponCode ?? undefined,
    }))
  );
}

export async function POST(req: NextRequest) {
  const userId = await getRequestUserId();
  const customerEmail = await getCustomerEmail();
  if (!userId) return NextResponse.json({ ok: false, error: "No user" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 }); }

  const {
    id, number, status = "pending", items, subtotal, shipping = 0, tax = 0,
    discount = 0, total, address, shippingMethod, paymentMethod,
    paymentReference, couponCode,
  } = body as Record<string, unknown>;

  if (!number || !items || subtotal == null || total == null || !address || !shippingMethod || !paymentMethod) {
    return NextResponse.json({ ok: false, error: "Required order fields missing" }, { status: 400 });
  }

  const row = await prisma.order.create({
    data: {
      ...(id ? { id: String(id) } : {}),
      userId,
      customerEmail: customerEmail ?? (body.customerEmail ? String(body.customerEmail) : null),
      number: String(number),
      status: String(status),
      items: typeof items === "string" ? items : JSON.stringify(items),
      subtotal: Number(subtotal),
      shipping: Number(shipping),
      tax: Number(tax),
      discount: Number(discount),
      total: Number(total),
      address: typeof address === "string" ? address : JSON.stringify(address),
      shippingMethod: String(shippingMethod),
      paymentMethod: String(paymentMethod),
      paymentReference: paymentReference ? String(paymentReference) : null,
      couponCode: couponCode ? String(couponCode) : null,
    },
  });

  return NextResponse.json({
    ok: true,
    item: {
      ...row,
      createdAt: row.createdAt.toISOString(),
      items: JSON.parse(row.items),
      address: JSON.parse(row.address),
      paymentReference: row.paymentReference ?? undefined,
      couponCode: row.couponCode ?? undefined,
    },
  });
}
