export type ProductReview = {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
  reviewerEmail?: string;
};

export type Product = {
  id: string | number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand?: string;
  sku?: string;
  tags?: string[];
  thumbnail: string;
  images: string[];
  reviews?: ProductReview[];
  warrantyInformation?: string;
  shippingInformation?: string;
  returnPolicy?: string;
  availabilityStatus?: string;
  minimumOrderQuantity?: number;
  preorderable?: boolean;
  /** True when stock is physically held here and ships at once. Everything
   *  else is imported to order, which is the common case. */
  stockedLocally?: boolean;
  expectedArrival?: string | null; // ISO date string, or null
};

export type ProductsResponse = {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
};

export type Category = { slug: string; name: string; url: string };

export function discountedPrice(
  p: Pick<Product, "price" | "discountPercentage">
): number {
  return p.discountPercentage > 0
    ? p.price * (1 - p.discountPercentage / 100)
    : p.price;
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * Akanadehye imports to order, so a product is a pre-order unless staff have
 * marked it as physically held here. Centralised so the card, the rail and
 * the product page all agree on what counts as "in stock".
 */
export function isPreOrder(p: Pick<Product, "stockedLocally">): boolean {
  return !p.stockedLocally;
}
