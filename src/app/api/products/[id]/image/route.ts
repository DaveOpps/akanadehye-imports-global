import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getObject } from "@/lib/bucket";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const i = Number(new URL(req.url).searchParams.get("i") ?? "0");
  if (!Number.isInteger(i) || i < 0) return new NextResponse(null, { status: 400 });

  // Only the images column — the row is small now that it holds object keys
  // rather than base64 photo data.
  const item = await prisma.inventoryItem.findFirst({
    where: { id },
    select: { images: true },
  });
  if (!item?.images) return new NextResponse(null, { status: 404 });

  let entries: string[];
  try { entries = JSON.parse(item.images); } catch { return new NextResponse(null, { status: 500 }); }
  const entry = entries[i];
  if (typeof entry !== "string") return new NextResponse(null, { status: 404 });

  const headers = { "Cache-Control": "public, max-age=604800, immutable" };

  // Bucket object key — the normal case after the image migration.
  if (!entry.startsWith("data:") && !entry.startsWith("http")) {
    const obj = await getObject(entry);
    if (!obj) return new NextResponse(null, { status: 404 });
    return new NextResponse(obj.body, {
      headers: { ...headers, "Content-Type": obj.contentType },
    });
  }

  // A row that still carries an inline data URI (not yet migrated).
  if (entry.startsWith("data:")) {
    const comma = entry.indexOf(",");
    if (comma === -1) return new NextResponse(null, { status: 400 });
    const mime = entry.slice(0, comma).match(/data:([^;]+)/)?.[1] ?? "image/jpeg";
    return new NextResponse(Buffer.from(entry.slice(comma + 1), "base64"), {
      headers: { ...headers, "Content-Type": mime },
    });
  }

  // An absolute URL pointing somewhere else — hand the caller straight there.
  return NextResponse.redirect(entry);
}
