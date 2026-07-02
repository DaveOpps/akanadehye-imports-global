import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { hit } from "@/lib/rateLimit";
import { sendOrderNotification } from "@/lib/notify";

const createSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().min(1).max(999).default(1),
  customerName: z.string().min(1).max(120),
  customerEmail: z.string().email().max(200),
  customerPhone: z.string().max(40).optional(),
  note: z.string().max(1000).optional(),
});

/** Sequential human reference PRE-00001, with a random fallback on collision. */
async function nextPreOrderNumber(): Promise<string> {
  const count = await prisma.preOrder.count();
  return `PRE-${String(count + 1).padStart(5, "0")}`;
}

// POST /api/preorders — public: create a reservation (reserve now, pay on arrival)
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "anon";
  const rl = hit(`preorder:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many pre-orders in a short time. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { itemId, quantity, customerName, customerEmail, customerPhone, note } = parsed.data;

  // Snapshot price/name from the DB — never trust the client for these.
  const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
  if (!item) {
    return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
  }
  if (!item.preorderable) {
    return NextResponse.json({ ok: false, error: "This product is not open for pre-order." }, { status: 400 });
  }

  const unitPrice = item.salePrice ?? item.price;

  let created;
  try {
    created = await prisma.preOrder.create({
      data: {
        number: await nextPreOrderNumber(),
        itemId: item.id,
        itemName: item.name,
        itemSku: item.sku,
        quantity,
        unitPrice,
        expectedArrival: item.expectedArrival,
        customerName,
        customerEmail,
        customerPhone: customerPhone || null,
        note: note || null,
      },
    });
  } catch {
    // Unique-number collision under concurrency — retry once with a random ref.
    created = await prisma.preOrder.create({
      data: {
        number: `PRE-${Date.now().toString(36).toUpperCase().slice(-6)}`,
        itemId: item.id,
        itemName: item.name,
        itemSku: item.sku,
        quantity,
        unitPrice,
        expectedArrival: item.expectedArrival,
        customerName,
        customerEmail,
        customerPhone: customerPhone || null,
        note: note || null,
      },
    });
  }

  // Fire-and-forget customer confirmation (stored in-app; emailed if Resend set).
  const eta = item.expectedArrival
    ? ` Expected around ${item.expectedArrival.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.`
    : "";
  void sendOrderNotification({
    email: customerEmail,
    customerName,
    title: `Pre-order received — ${created.number}`,
    body: `Thanks ${customerName}! We've reserved ${quantity} × ${item.name} for you. No payment is needed now — we'll contact you to confirm and invoice when it arrives.${eta}`,
    orderNumber: created.number,
  }).catch(() => {});

  return NextResponse.json({
    ok: true,
    preorder: {
      number: created.number,
      itemName: created.itemName,
      quantity: created.quantity,
      unitPrice: created.unitPrice,
      expectedArrival: created.expectedArrival,
    },
  });
}

// GET /api/preorders — admin: list all reservations
export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || role === "customer") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const preorders = await prisma.preOrder.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ ok: true, preorders });
}
