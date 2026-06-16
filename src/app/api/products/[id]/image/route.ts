import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const i = Number(new URL(req.url).searchParams.get("i") ?? "0");

  const item = await prisma.inventoryItem.findFirst({ where: { id } });
  if (!item?.images) return new NextResponse(null, { status: 404 });

  const images: string[] = JSON.parse(item.images);
  const dataUrl = images[i];
  if (!dataUrl) return new NextResponse(null, { status: 404 });

  const comma = dataUrl.indexOf(",");
  if (comma === -1) return new NextResponse(null, { status: 400 });

  const mimeMatch = dataUrl.slice(0, comma).match(/data:([^;]+);/);
  const mime = mimeMatch?.[1] ?? "image/jpeg";
  const buffer = Buffer.from(dataUrl.slice(comma + 1), "base64");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=604800, immutable",
    },
  });
}
