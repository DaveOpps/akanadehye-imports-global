import "server-only";
import { prisma } from "@/lib/db";
import type { Product, ProductsResponse } from "@/lib/products";
import type { InventoryItem } from "@prisma/client";

function categoryToSlug(cat: string): string {
  return cat.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// URL slug → inventory category string(s)
const SLUG_CATEGORIES: Record<string, string[]> = {
  "security-doors-gates":    ["Security Doors & Gates"],
  "entry-doors":             ["Security Doors & Gates"],
  "steel-doors":             ["Security Doors & Gates"],
  "iron-gates":              ["Security Doors & Gates"],
  "building-materials":      ["Building Materials"],
  "floor-coatings":          ["Building Materials"],
  "construction-supplies":   ["Building Materials"],
  "waterproofing":           ["Building Materials"],
  "agricultural-machinery":  ["Agricultural Machinery"],
  "corn-shellers":           ["Agricultural Machinery"],
  "grain-mills":             ["Agricultural Machinery"],
  "farm-equipment":          ["Agricultural Machinery"],
  "food-processing-machines":["Food Processing Machines"],
  "noodle-machines":         ["Food Processing Machines"],
  "packaging-machines":      ["Food Processing Machines"],
  "sealing-machines":        ["Food Processing Machines"],
  "furniture-bedding":       ["Furniture & Bedding"],
  "home-cleaning":           ["Home & Cleaning"],
  "drinkware-tumblers":      ["Drinkware & Tumblers"],
  "bags-accessories":        ["Bags & Accessories"],
  "footwear":                ["Footwear"],
  "childrens-wear":          ["Children's Wear"],
  "electronics-gadgets":     ["Electronics & Gadgets"],
  "smart-accessories":       ["Electronics & Gadgets"],
  "rgb-wireless":            ["Electronics & Gadgets"],
  "storage-packaging":       ["Storage & Packaging"],
  "food-grain":              ["Food & Grain"],
  "rice-grains":             ["Food & Grain"],
  "appliances":              ["Appliances"],
  "air-fryers":              ["Appliances"],
  "water-dispensers":        ["Appliances"],
  "small-appliances":        ["Appliances"],
  "beauty":                  ["Health & Beauty"],
  "health-beauty":           ["Health & Beauty"],
  "nail-care":               ["Health & Beauty"],
  "body-care":               ["Health & Beauty"],
  // Umbrella slugs → multiple categories
  "building-security":  ["Security Doors & Gates", "Building Materials"],
  "machinery-equipment":["Agricultural Machinery", "Food Processing Machines"],
};

function itemToProduct(item: InventoryItem): Product {
  const rawImages: string[] = item.images ? JSON.parse(item.images) : [];
  const tags: string[] = item.tags ? JSON.parse(item.tags) : [];

  const listPrice = item.price;
  const salePrice = item.salePrice;
  const discountPct =
    salePrice !== null && salePrice < listPrice
      ? Math.round((1 - salePrice / listPrice) * 100)
      : 0;

  const thumbnail =
    rawImages.length > 0
      ? `/api/products/${item.id}/image?i=0`
      : "/placeholder.png";
  const images =
    rawImages.length > 0
      ? rawImages.map((_, i) => `/api/products/${item.id}/image?i=${i}`)
      : ["/placeholder.png"];

  return {
    id: item.id,
    title: item.name,
    description: item.description ?? "",
    category: categoryToSlug(item.category),
    price: listPrice,
    discountPercentage: discountPct,
    rating: 5.0,
    stock: item.stock,
    sku: item.sku,
    brand: "Akanadehye Imports",
    tags,
    thumbnail,
    images,
    reviews: [],
    availabilityStatus: item.stock > 0 ? "In Stock" : "Out of Stock",
    preorderable: item.preorderable,
    expectedArrival: item.expectedArrival ? item.expectedArrival.toISOString() : null,
  };
}

export async function getProducts(
  opts: {
    category?: string;
    limit?: number;
    skip?: number;
    sort?: string;
    order?: "asc" | "desc";
    q?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
  } = {}
): Promise<ProductsResponse> {
  const {
    category,
    limit = 50,
    skip = 0,
    sort,
    order = "asc",
    q,
    minPrice,
    maxPrice,
  } = opts;

  const categoryFilter = category
    ? (SLUG_CATEGORIES[category] ?? null)
    : null;

  const baseWhere = {
    ...(categoryFilter ? { category: { in: categoryFilter } } : {}),
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
  };

  const orderBy =
    sort === "price"
      ? { price: order === "desc" ? ("desc" as const) : ("asc" as const) }
      : sort === "title"
      ? { name: order === "desc" ? ("desc" as const) : ("asc" as const) }
      : { updatedAt: "desc" as const };

  let items = await prisma.inventoryItem.findMany({
    where: baseWhere,
    orderBy,
  });

  // Apply price filter in-process so sale prices are respected
  if (minPrice !== undefined || maxPrice !== undefined) {
    items = items.filter((item) => {
      const effective = item.salePrice ?? item.price;
      if (minPrice !== undefined && effective < minPrice) return false;
      if (maxPrice !== undefined && effective > maxPrice) return false;
      return true;
    });
  }

  const total = items.length;
  const page = items.slice(skip, skip + limit);

  return { products: page.map(itemToProduct), total, skip, limit };
}

export async function getProduct(id: string | number): Promise<Product | null> {
  const item = await prisma.inventoryItem.findFirst({
    where: { id: String(id) },
  });
  return item ? itemToProduct(item) : null;
}

export async function getRelatedProducts(
  categorySlug: string,
  excludeId: string | number,
  limit = 4
): Promise<Product[]> {
  const categories = SLUG_CATEGORIES[categorySlug];
  if (!categories) return [];

  const items = await prisma.inventoryItem.findMany({
    where: {
      category: { in: categories },
      NOT: { id: String(excludeId) },
    },
    take: limit,
    orderBy: { updatedAt: "desc" },
  });
  return items.map(itemToProduct);
}
