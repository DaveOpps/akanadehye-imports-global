import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/products", "/cart"],
        disallow: ["/admin/", "/checkout/", "/api/", "/orders"],
      },
    ],
    sitemap: "https://akanadehye.com/sitemap.xml",
  };
}
