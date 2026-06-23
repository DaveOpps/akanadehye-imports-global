import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

// GET /api/inventory?q=&category=&limit=&userId=
// Public read — used by bot brain to show merchant products.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase() ?? "";
  const category = searchParams.get("category") ?? "";
  // Cap high enough for the full admin catalogue (list returns thumbnail URLs,
  // not base64, so the payload stays small). The bot brain still passes small limits.
  const limit = Math.min(Number(searchParams.get("limit") ?? 10), 1000);
  const userId = searchParams.get("userId") ?? undefined;

  const items = await prisma.inventoryItem.findMany({
    where: {
      ...(userId ? { userId } : {}),
      ...(category ? { category: { contains: category, mode: "insensitive" as const } } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { description: { contains: q, mode: "insensitive" as const } },
              { tags: { contains: q, mode: "insensitive" as const } },
              { category: { contains: q, mode: "insensitive" as const } },
              { sku: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  return NextResponse.json({
    total: items.length,
    items: items.map((i) => ({
      id: i.id,
      sku: i.sku,
      name: i.name,
      category: i.category,
      price: i.price,
      salePrice: i.salePrice,
      stock: i.stock,
      reorderAt: i.reorderAt,
      description: i.description,
      tags: i.tags ? (JSON.parse(i.tags) as string[]) : [],
      // Return thumbnail URL only (not full base64) to keep the list response small.
      // The admin edit form fetches the full item via /api/inventory/:id
      images: i.images
        ? (JSON.parse(i.images) as string[]).map((_, idx) => `/api/products/${i.id}/image?i=${idx}`)
        : [],
      updatedAt: i.updatedAt,
    })),
  });
}

// POST /api/inventory  — create a new inventory item
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const userId = (body.userId as string | undefined) ?? (await getAdminUserId());
  if (!userId) return NextResponse.json({ ok: false, error: "No user" }, { status: 400 });

  const {
    id,
    sku,
    name,
    category,
    price,
    salePrice,
    stock,
    reorderAt = 5,
    description,
    images,
    tags,
  } = body as Record<string, unknown>;

  if (!sku || !name || !category || price == null || stock == null) {
    return NextResponse.json({ ok: false, error: "sku, name, category, price, stock required" }, { status: 400 });
  }

  try {
    const item = await prisma.inventoryItem.create({
      data: {
        ...(id ? { id: String(id) } : {}),
        userId,
        sku: String(sku),
        name: String(name),
        category: String(category),
        price: Number(price),
        salePrice: salePrice != null ? Number(salePrice) : null,
        stock: Number(stock),
        reorderAt: Number(reorderAt),
        description: description ? String(description) : null,
        images: images ? JSON.stringify(images) : null,
        tags: tags ? JSON.stringify(tags) : null,
      },
    });
    revalidatePath("/");
    revalidatePath("/products");
    void logAudit({
      action: "CREATE",
      entity: "InventoryItem",
      entityId: item.id,
      entityName: item.name,
      entitySku: item.sku,
      after: {
        name: item.name,
        sku: item.sku,
        category: item.category,
        price: item.price,
        salePrice: item.salePrice,
        stock: item.stock,
        reorderAt: item.reorderAt,
      },
    });
    return NextResponse.json({ ok: true, item });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ ok: false, error: "SKU already exists" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

async function getAdminUserId(): Promise<string | null> {
  const user = await prisma.user.findFirst({ where: { email: "admin@akanadehye.com" } });
  return user?.id ?? null;
}
