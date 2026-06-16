import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/shop-products";
import { UMBRELLA_CATEGORIES } from "@/lib/storefront-categories";

const BASE_URL = "https://akanadehye.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/cart`, lastModified: now, changeFrequency: "never", priority: 0.3 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = UMBRELLA_CATEGORIES.map((u) => ({
    url: `${BASE_URL}/categories/${u.primarySlug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const { products } = await getProducts({ limit: 50 });
    productRoutes = products.map((p) => ({
      url: `${BASE_URL}/products/${p.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // Fail open
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
