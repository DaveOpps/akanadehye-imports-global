import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { hit } from "@/lib/rateLimit";
import { sendOrderNotification } from "@/lib/notify";
import { addWorkingDays, formatEtaDate, PREORDER_LEAD_WORKING_DAYS } from "@/lib/dates";

const PAYMENT_METHODS = ["mobile-money", "card", "bank-transfer"] as const;
const PAYMENT_LABELS: Record<(typeof PAYMENT_METHODS)[number], string> = {
  "mobile-money": "Mobile Money",
  card: "Card",
  "bank-transfer": "Bank Transfer",
};

const createSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().min(1).max(999).default(1),
  paymentMethod: z.enum(PAYMENT_METHODS),
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

// POST /api/preorders — public: create a pre-order. Full (100%) payment is
// required to secure it; no payment gateway is wired up yet, so — same as
// checkout Orders elsewhere in this app — we capture the chosen method and
// staff confirm once the money is actually received.
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
  const { itemId, quantity, paymentMethod, customerName, customerEmail, customerPhone, note } = parsed.data;

  // Snapshot price/name from the DB — never trust the client for these.
  const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
  if (!item) {
    return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
  }
  if (!item.preorderable) {
    return NextResponse.json({ ok: false, error: "This product is not open for pre-order." }, { status: 400 });
  }

  const unitPrice = item.salePrice ?? item.price;
  const total = unitPrice * quantity;

  // Every pre-order gets a concrete promised date: the admin's own ETA if set,
  // otherwise our standard lead time counted from today.
  const expectedArrival = item.expectedArrival ?? addWorkingDays(new Date(), PREORDER_LEAD_WORKING_DAYS);

  const baseData = {
    itemId: item.id,
    itemName: item.name,
    itemSku: item.sku,
    quantity,
    unitPrice,
    expectedArrival,
    customerName,
    customerEmail,
    customerPhone: customerPhone || null,
    note: note || null,
    paymentMethod,
    paymentStatus: "awaiting_payment",
  };

  let created;
  try {
    created = await prisma.preOrder.create({
      data: { number: await nextPreOrderNumber(), ...baseData },
    });
  } catch {
    // Unique-number collision under concurrency — retry once with a random ref.
    created = await prisma.preOrder.create({
      data: { number: `PRE-${Date.now().toString(36).toUpperCase().slice(-6)}`, ...baseData },
    });
  }

  // Fire-and-forget customer confirmation (stored in-app; emailed if Resend set).
  void sendOrderNotification({
    email: customerEmail,
    customerName,
    title: `Pre-order received — ${created.number}`,
    body: `Thanks ${customerName}! Your pre-order for ${quantity} × ${item.name} is reserved. Full payment of GHS ${total.toFixed(2)} via ${PAYMENT_LABELS[paymentMethod]} is required to secure it — our team will contact you shortly with payment details. Pre-orders take up to ${PREORDER_LEAD_WORKING_DAYS} working days — expected around ${formatEtaDate(expectedArrival)}. Quote reference ${created.number} when you pay.`,
    orderNumber: created.number,
  }).catch(() => {});

  return NextResponse.json({
    ok: true,
    preorder: {
      number: created.number,
      itemName: created.itemName,
      quantity: created.quantity,
      unitPrice: created.unitPrice,
      total,
      expectedArrival: created.expectedArrival,
      paymentMethod: created.paymentMethod,
      paymentStatus: created.paymentStatus,
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
