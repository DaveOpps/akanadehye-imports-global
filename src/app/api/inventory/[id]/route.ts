import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

// GET /api/inventory/:id — fetch a single item with full base64 images (used by edit form)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const item = await prisma.inventoryItem.findUniqueOrThrow({ where: { id } });
    return NextResponse.json({
      id: item.id,
      sku: item.sku,
      name: item.name,
      category: item.category,
      price: item.price,
      salePrice: item.salePrice,
      stock: item.stock,
      reorderAt: item.reorderAt,
      description: item.description,
      preorderable: item.preorderable,
      expectedArrival: item.expectedArrival,
      tags: item.tags ? JSON.parse(item.tags) : [],
      images: item.images ? JSON.parse(item.images) : [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
}

// PATCH /api/inventory/:id — update fields on an inventory item
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const allowed = ["name", "category", "price", "salePrice", "stock", "reorderAt", "description", "images", "tags", "preorderable", "expectedArrival"];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) {
      if (key === "images" || key === "tags") {
        data[key] = body[key] != null ? JSON.stringify(body[key]) : null;
      } else if (key === "expectedArrival") {
        data[key] = body[key] ? new Date(String(body[key])) : null;
      } else if (key === "preorderable") {
        data[key] = Boolean(body[key]);
      } else {
        data[key] = body[key];
      }
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: false, error: "No updatable fields provided" }, { status: 400 });
  }

  try {
    const current = await prisma.inventoryItem.findUnique({ where: { id } });
    const item = await prisma.inventoryItem.update({ where: { id }, data });

    // Determine if this is a stock-only adjustment or a full edit
    const changedKeys = Object.keys(data).filter((k) => k !== "images" && k !== "tags");
    const isStockOnly = changedKeys.length === 1 && changedKeys[0] === "stock";

    const auditBefore: Record<string, unknown> = {};
    const auditAfter: Record<string, unknown> = {};
    for (const key of changedKeys) {
      auditBefore[key] = (current as Record<string, unknown> | null)?.[key];
      auditAfter[key] = (item as Record<string, unknown>)[key];
    }
    if ("images" in data) { auditBefore.images = "(previous)"; auditAfter.images = "(updated)"; }
    if ("tags" in data) {
      auditBefore.tags = current?.tags ? JSON.parse(current.tags) : [];
      auditAfter.tags = item.tags ? JSON.parse(item.tags) : [];
    }

    void logAudit({
      action: isStockOnly ? "STOCK_ADJUST" : "UPDATE",
      entity: "InventoryItem",
      entityId: id,
      entityName: item.name,
      entitySku: item.sku,
      before: auditBefore,
      after: auditAfter,
    });

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${id}`);
    return NextResponse.json({ ok: true, item });
  } catch {
    return NextResponse.json({ ok: false, error: "Item not found" }, { status: 404 });
  }
}

// DELETE /api/inventory/:id
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const current = await prisma.inventoryItem.findUnique({ where: { id } });
    await prisma.inventoryItem.delete({ where: { id } });
    void logAudit({
      action: "DELETE",
      entity: "InventoryItem",
      entityId: id,
      entityName: current?.name,
      entitySku: current?.sku,
      before: current
        ? {
            name: current.name,
            sku: current.sku,
            category: current.category,
            price: current.price,
            salePrice: current.salePrice,
            stock: current.stock,
          }
        : null,
    });
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${id}`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Item not found" }, { status: 404 });
  }
}
