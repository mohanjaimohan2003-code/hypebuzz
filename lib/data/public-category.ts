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
  created_at: string;
  is_featured: boolean;
  is_trending: boolean;
  brand: { name: string; slug: string } | null;
  product_offers: Array<{
    current_price: number;
    original_price: number | null;
    currency: string;
    availability: string | null;
    merchant_id: string;
    merchant: { slug: string } | null;
  }>;
};

const fallbackImage = "/products/aurora-headphones.svg";

type PublicQueryError = { code?: string; message?: string; details?: string; hint?: string };

function logCategoryQueryError(section: string, error: PublicQueryError | null) {
  if (!error) return;
  console.error("Supabase category query failed", {
    section,
    code: error.code ?? "unknown",
    message: error.message ?? "Unknown Supabase error",
    details: error.details ?? "not reported",
    hint: error.hint ?? "not reported",
  });
}

async function runCategoryQuery<T extends { data: unknown; error: PublicQueryError | null }>(section: string, query: PromiseLike<T>) {
  try {
    const result = await query;
    logCategoryQueryError(section, result.error);
    return result;
  } catch (error) {
    const queryError = { message: error instanceof Error ? error.message : String(error), details: "The query threw before Supabase returned a response." };
    logCategoryQueryError(section, queryError);
    return { data: null, error: queryError };
  }
}

export const getPublicCategory = cache(async (slug: string) => {
  const definition = getPublicCategoryDefinition(slug);
  const registryCategory: PublicCategory | null = definition
    ? {
        id: null,
        name: definition.name,
        slug: definition.slug,
        description: definition.description,
      }
    : null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle<CategoryRow>();

  logCategoryQueryError("category", error);
  if (error || !data) return registryCategory;

  return {
    id: data.id,
    name: data.name || registryCategory?.name || slug,
    slug: data.slug,
    description: data.description?.trim() || registryCategory?.description || "",
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
  if (!category.id) {
    return { category, products: [], totalCount: 0, brands: [], merchants: [], hasError: false };
  }

  const [productsResult, brandsResult, merchantsResult] = await Promise.all([
    runCategoryQuery("products", supabase
      .from("products")
      .select("id, name, slug, primary_image_url, created_at, is_featured, is_trending, brand:brands(name, slug), product_offers(current_price, original_price, currency, availability, merchant_id, merchant:merchants(slug))")
      .eq("status", "published")
      .eq("category_id", category.id)
      .order("created_at", { ascending: false })
      .limit(100)),
    runCategoryQuery("brands", supabase.from("brands").select("name, slug").order("name").returns<OptionRow[]>()),
    runCategoryQuery("merchants", supabase.from("merchants").select("name, slug").order("name").returns<OptionRow[]>()),
  ]);

  const normalizedAvailability = filters.availability?.toLowerCase().replaceAll(" ", "_") ?? null;
  const rows = ((productsResult.data ?? []) as unknown as ProductRow[])
    .flatMap((product) => {
      const offers = product.product_offers;
      const cheapest = [...offers].sort((a, b) => Number(a.current_price) - Number(b.current_price))[0];
      const biggestDiscount = offers.reduce<number | null>((biggest, offer) => {
        const current = Number(offer.current_price);
        const original = offer.original_price === null ? null : Number(offer.original_price);
        if (!original || original <= current) return biggest;
        return Math.max(biggest ?? 0, ((original - current) / original) * 100);
      }, null);
      const matches =
        (!filters.q || product.name.toLowerCase().includes(filters.q.toLowerCase()) || product.brand?.name.toLowerCase().includes(filters.q.toLowerCase())) &&
        (!filters.brand || product.brand?.slug === filters.brand) &&
        (!filters.merchant || offers.some((offer) => offer.merchant?.slug === filters.merchant)) &&
        (filters.minPrice === null || (cheapest && Number(cheapest.current_price) >= filters.minPrice)) &&
        (filters.maxPrice === null || (cheapest && Number(cheapest.current_price) <= filters.maxPrice)) &&
        (filters.minDiscount === null || (biggestDiscount ?? 0) >= filters.minDiscount) &&
        (!normalizedAvailability || offers.some((offer) => offer.availability?.toLowerCase().replaceAll(" ", "_") === normalizedAvailability)) &&
        (!filters.bestPriceOnly || new Set(offers.map((offer) => offer.merchant_id)).size > 1) &&
        (!filters.featured || product.is_featured) &&
        (!filters.trending || product.is_trending);

      return matches ? [{ product, cheapest, biggestDiscount }] : [];
    });

  rows.sort((left, right) => {
    if (filters.sort === "price_low") return Number(left.cheapest?.current_price ?? Infinity) - Number(right.cheapest?.current_price ?? Infinity);
    if (filters.sort === "price_high") return Number(right.cheapest?.current_price ?? -Infinity) - Number(left.cheapest?.current_price ?? -Infinity);
    if (filters.sort === "discount") return (right.biggestDiscount ?? -1) - (left.biggestDiscount ?? -1);
    if (filters.sort === "newest" || filters.sort === "popular") return right.product.created_at.localeCompare(left.product.created_at);
    return left.product.name.localeCompare(right.product.name);
  });

  const totalCount = rows.length;
  return {
    category,
    products: productsResult.error
      ? []
      : rows.slice(0, 48).map(({ product, cheapest, biggestDiscount }) => ({
          id: product.id,
          name: product.name,
          brand: product.brand?.name ?? "Independent brand",
          imageSrc: product.primary_image_url ?? fallbackImage,
          imageAlt: product.name,
          price: cheapest ? Number(cheapest.current_price) : undefined,
          currency: cheapest?.currency,
          storeCount: new Set(product.product_offers.map((offer) => offer.merchant_id)).size,
          productHref: `/products/${product.slug}`,
          dealsHref: `/products/${product.slug}#deals`,
          badge:
            biggestDiscount && biggestDiscount > 0
              ? `${Math.round(biggestDiscount)}% off`
              : undefined,
        })),
    totalCount: productsResult.error ? 0 : totalCount,
    brands: brandsResult.error ? [] : (brandsResult.data ?? []),
    merchants: merchantsResult.error ? [] : (merchantsResult.data ?? []),
    hasError: Boolean(productsResult.error || brandsResult.error || merchantsResult.error),
  };
}
