import "server-only";

import { createClient } from "@/lib/supabase/server";

export type SitemapProduct = { slug: string; updatedAt: string; imageUrl: string };
export type SitemapCategory = { slug: string; updatedAt: string };
export type SitemapGuide = { slug: string; updatedAt: string };
type SitemapProductRow = { slug: string; updated_at: string; primary_image_url?: string | null };

function crawlableImageUrl(value: string | null | undefined) {
  if (!value?.trim()) return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch { return null; }
}

export async function getPublishedProductsForSitemap(): Promise<SitemapProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("slug, updated_at, primary_image_url")
    .eq("status", "published")
    .not("primary_image_url", "is", null)
    .neq("primary_image_url", "")
    .order("updated_at", { ascending: false })
    .returns<SitemapProductRow[]>();

  if (error) return [];
  return (data ?? []).flatMap((product) => {
    const imageUrl = crawlableImageUrl(product.primary_image_url);
    return imageUrl ? [{ slug: product.slug, updatedAt: product.updated_at, imageUrl }] : [];
  });
}

export async function getPublishedGuidesForSitemap(): Promise<SitemapGuide[]> {
  const supabase = await createClient(); const { data, error } = await supabase.from("knowledge_hub_items").select("slug, updated_at").eq("status", "published").order("updated_at", { ascending: false }).returns<SitemapProductRow[]>();
  if (error) return []; return (data ?? []).map((guide) => ({ slug: guide.slug, updatedAt: guide.updated_at }));
}

export async function getActiveCategoriesForSitemap(): Promise<SitemapCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("slug, updated_at")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .returns<SitemapProductRow[]>();

  if (error) return [];
  return (data ?? []).map((category) => ({ slug: category.slug, updatedAt: category.updated_at }));
}
