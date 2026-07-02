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
