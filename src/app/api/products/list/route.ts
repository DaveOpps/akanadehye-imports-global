import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/shop-products";

// GET /api/products/list?category=...&q=...&sort=...&order=...&skip=...&limit=...&minPrice=...&maxPrice=...&minRating=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const sort = searchParams.get("sort") ?? undefined;
  const order = (searchParams.get("order") as "asc" | "desc") || undefined;
  const skip = Number(searchParams.get("skip") ?? 0);
  const limit = Number(searchParams.get("limit") ?? 24);
  const minPrice = searchParams.get("minPrice")
    ? Number(searchParams.get("minPrice"))
    : undefined;
  const maxPrice = searchParams.get("maxPrice")
    ? Number(searchParams.get("maxPrice"))
    : undefined;
  const minRating = searchParams.get("minRating")
    ? Number(searchParams.get("minRating"))
    : undefined;

  try {
    const data = await getProducts({
      category,
      q,
      sort,
      order,
      skip,
      limit,
      minPrice,
      maxPrice,
      minRating,
    });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
