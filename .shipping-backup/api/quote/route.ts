import { NextRequest, NextResponse } from "next/server";

type QuoteRequest = {
  mode: "Ocean" | "Air" | "Road";
  service?: string;
  originCity: string;
  originCountry: string;
  destCity: string;
  destCountry: string;
  weightKg: number;
  volumeCbm?: number;
  pieces: number;
  cargoType: string;
  description?: string;
  pickupReady?: string;
  incoterm?: string;
  insurance?: boolean;
  contactName: string;
  contactCompany?: string;
  contactEmail: string;
  contactPhone: string;
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<QuoteRequest>;

  const required: (keyof QuoteRequest)[] = [
    "mode",
    "originCity",
    "originCountry",
    "destCity",
    "destCountry",
    "weightKg",
    "pieces",
    "cargoType",
    "contactName",
    "contactEmail",
    "contactPhone",
  ];
  const missing = required.filter((k) => !body[k] && body[k] !== 0);
  if (missing.length) {
    return NextResponse.json(
      { error: `Missing fields: ${missing.join(", ")}` },
      { status: 400 },
    );
  }

  // Simple indicative estimate — production would call a real rating engine
  const weight = Number(body.weightKg);
  const ratePerKg = body.mode === "Air" ? 6.4 : body.mode === "Road" ? 1.2 : 0.85;
  const baseFee = body.mode === "Air" ? 180 : 320;
  const estimate = Math.round(baseFee + weight * ratePerKg);

  const ref = `AKQ-${Date.now().toString().slice(-7)}`;
  const eta =
    body.mode === "Air"
      ? "3–6 days"
      : body.mode === "Road"
        ? "5–10 days"
        : "21–38 days";

  console.log("[quote]", ref, body); // would persist to DB / send to ops in production

  return NextResponse.json({
    reference: ref,
    estimateUSD: estimate,
    estimatedTransit: eta,
    nextSteps:
      "Our trade desk will email a final quote with all-in pricing within 24 hours.",
  });
}
