import type { MetadataRoute } from "next";
import { getActiveCategoriesForSitemap, getPublishedGuidesForSitemap, getPublishedProductsForSitemap } from "@/lib/data/public-seo";
import { absoluteUrl } from "@/lib/seo/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products, guides] = await Promise.all([
    getActiveCategoriesForSitemap(),
    getPublishedProductsForSitemap(),
    getPublishedGuidesForSitemap(),
  ]);
  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/search"), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/trending"), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/compare"), changeFrequency: "weekly", priority: 0.7 },
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
      images: [new URL(product.imageUrl, absoluteUrl("/")).toString()],
      lastModified: new Date(product.updatedAt),
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    ...guides.map((guide) => ({ url: absoluteUrl(`/knowledge-hub/${guide.slug}`), lastModified: new Date(guide.updatedAt), changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
