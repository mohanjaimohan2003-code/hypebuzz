import "server-only";

import { cache } from "react";
import type { ProductCardProduct } from "@/components/product/product-card";
import { createClient } from "@/lib/supabase/server";
import type { CategoryProductParams } from "@/lib/validation/category-products";
import type { SearchFilterOption } from "@/lib/data/product-search";
import { getPublicCategoryDefinition, publicCategories } from "@/lib/data/public-categories";

export type PublicCategory = {
  id: string | null;
  name: string;
  slug: string;
  description: string;
};

export type PublicNavigationCategory = Pick<PublicCategory, "name" | "slug">;

export type PublicCategoryResult = {
  category: PublicCategory | null;
  products: ProductCardProduct[];
  totalCount: number;
  brands: SearchFilterOption[];
  merchants: SearchFilterOption[];
  hasError: boolean;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};
type OptionRow = SearchFilterOption;
type ProductRow = {
  id: string;
  name: string;
  slug: string;
  primary_image_url: string | null;
  brand_name: string | null;
  best_price: number;
  currency: string;
  store_count: number;
  biggest_discount: number | null;
  total_count: number;
};

const fallbackImage = "/products/aurora-headphones.svg";

export const getPublicCategory = cache(async (slug: string) => {
  const definition = getPublicCategoryDefinition(slug);
  if (!definition) return null;

  const registryCategory: PublicCategory = {
    id: null,
    name: definition.name,
    slug: definition.slug,
    description: definition.description,
  };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle<CategoryRow>();

  if (error || !data) return registryCategory;

  return {
    id: data.id,
    name: data.name || registryCategory.name,
    slug: registryCategory.slug,
    description: data.description?.trim() || registryCategory.description,
  };
});

export const getPublicNavigationCategories = cache(async () => {
  return publicCategories.map(({ name, slug }) => ({ name, slug }));
});

export async function getPublicCategoryProducts(
  category: PublicCategory,
  filters: CategoryProductParams,
): Promise<PublicCategoryResult> {
  const supabase = await createClient();
  const [productsResult, brandsResult, merchantsResult] = await Promise.all([
    supabase.rpc("search_category_products", {
      p_category_slug: category.slug,
      p_query: filters.q || null,
      p_brand_slug: filters.brand || null,
      p_merchant_slug: filters.merchant || null,
      p_min_price: filters.minPrice,
      p_max_price: filters.maxPrice,
      p_min_discount: filters.minDiscount,
      p_availability: filters.availability,
      p_best_price_only: filters.bestPriceOnly,
      p_featured: filters.featured,
      p_trending: filters.trending,
      p_sort: filters.sort,
      p_limit: 48,
    }),
    supabase.from("brands").select("name, slug").order("name").returns<OptionRow[]>(),
    supabase.from("merchants").select("name, slug").order("name").returns<OptionRow[]>(),
  ]);

  const rows = (productsResult.data ?? []) as ProductRow[];
  return {
    category,
    products: productsResult.error
      ? []
      : rows.map((product) => ({
          id: product.id,
          name: product.name,
          brand: product.brand_name ?? "Independent brand",
          imageSrc: product.primary_image_url ?? fallbackImage,
          imageAlt: product.name,
          price: Number(product.best_price),
          currency: product.currency,
          storeCount: Number(product.store_count),
          productHref: `/products/${product.slug}`,
          dealsHref: `/products/${product.slug}#deals`,
          badge:
            product.biggest_discount && product.biggest_discount > 0
              ? `${Math.round(product.biggest_discount)}% off`
              : undefined,
        })),
    totalCount: productsResult.error ? 0 : Number(rows[0]?.total_count ?? 0),
    brands: brandsResult.error ? [] : (brandsResult.data ?? []),
    merchants: merchantsResult.error ? [] : (merchantsResult.data ?? []),
    hasError: Boolean(productsResult.error || brandsResult.error || merchantsResult.error),
  };
}
