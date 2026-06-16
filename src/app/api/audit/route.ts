import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/audit?entity=InventoryItem&entityId=&action=&limit=100&offset=0
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const entity = searchParams.get("entity") ?? "InventoryItem";
  const entityId = searchParams.get("entityId") ?? undefined;
  const action = searchParams.get("action") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? 100), 500);
  const offset = Number(searchParams.get("offset") ?? 0);

  try {
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          entity,
          ...(entityId ? { entityId } : {}),
          ...(action ? { action } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({
        where: {
          entity,
          ...(entityId ? { entityId } : {}),
          ...(action ? { action } : {}),
        },
      }),
    ]);

    return NextResponse.json({ logs, total });
  } catch {
    return NextResponse.json({ logs: [], total: 0 });
  }
}
