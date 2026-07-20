import "server-only";

import { createClient } from "@/lib/supabase/server";

export type SitemapProduct = { slug: string; updatedAt: string };
export type SitemapCategory = { slug: string; updatedAt: string };
type SitemapProductRow = { slug: string; updated_at: string };

export async function getPublishedProductsForSitemap(): Promise<SitemapProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("slug, updated_at")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .returns<SitemapProductRow[]>();

  if (error) return [];
  return (data ?? []).map((product) => ({ slug: product.slug, updatedAt: product.updated_at }));
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
