import { NextRequest, NextResponse } from "next/server";
import { findShipment } from "@/lib/shipments";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json(
      { error: "Missing tracking number" },
      { status: 400 },
    );
  }
  const shipment = findShipment(code);
  if (!shipment) {
    return NextResponse.json(
      { error: `No shipment found for ${code}` },
      { status: 404 },
    );
  }
  return NextResponse.json({ shipment });
}
