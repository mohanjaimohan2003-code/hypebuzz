import type { MetadataRoute } from "next";
import { getActiveCategoriesForSitemap, getPublishedProductsForSitemap } from "@/lib/data/public-seo";
import { absoluteUrl } from "@/lib/seo/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([
    getActiveCategoriesForSitemap(),
    getPublishedProductsForSitemap(),
  ]);
  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/search"), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/mission"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/contact"), changeFrequency: "monthly", priority: 0.6 },
    ...[
      "/how-it-works", "/careers", "/guides", "/knowledge-hub", "/deal-insights", "/help", "/faq",
      "/report-information", "/suggest-product", "/affiliate-disclosure", "/privacy",
      "/terms", "/disclaimer", "/editorial-policy", "/accuracy-policy", "/cookies",
      "/accessibility", "/trademark-notice",
    ].map((pathname) => ({
      url: absoluteUrl(pathname),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...categories.map((category) => ({
      url: absoluteUrl(`/categories/${category.slug}`),
      lastModified: new Date(category.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: absoluteUrl(`/products/${product.slug}`),
      lastModified: new Date(product.updatedAt),
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
  ];
}
