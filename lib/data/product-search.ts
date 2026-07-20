import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ProductCardProduct } from "@/components/product/product-card";
import type { ProductSearchParams } from "@/lib/validation/product-search";

export type SearchFilterOption = {
  name: string;
  slug: string;
};

export type ProductSearchResult = {
  products: ProductCardProduct[];
  categories: SearchFilterOption[];
  brands: SearchFilterOption[];
  merchants: SearchFilterOption[];
  hasError: boolean;
};

type SearchRow = {
  id: string;
  name: string;
  slug: string;
  primary_image_url: string | null;
  brand_name: string | null;
  best_price: number;
  currency: string;
  store_count: number;
  biggest_discount: number | null;
};

type OptionRow = { name: string; slug: string };

const fallbackImage = "/products/aurora-headphones.svg";

export async function searchProducts(
  filters: ProductSearchParams,
): Promise<ProductSearchResult> {
  const supabase = await createClient();
  const [productsResult, categoriesResult, brandsResult, merchantsResult] =
    await Promise.all([
      supabase.rpc("search_products", {
        p_query: filters.q || null,
        p_category_slug: filters.category || null,
        p_brand_slug: filters.brand || null,
        p_merchant_slug: filters.merchant || null,
        p_min_price: filters.minPrice,
        p_max_price: filters.maxPrice,
        p_min_discount: filters.minDiscount,
        p_availability: filters.availability,
        p_best_price_only: filters.bestPriceOnly,
        p_sort: filters.sort,
        p_limit: 48,
      }),
      supabase.from("categories").select("name, slug").order("display_order").order("name").returns<OptionRow[]>(),
      supabase.from("brands").select("name, slug").order("name").returns<OptionRow[]>(),
      supabase.from("merchants").select("name, slug").order("name").returns<OptionRow[]>(),
    ]);

  const rows = (productsResult.data ?? []) as SearchRow[];
  return {
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
    categories: categoriesResult.error ? [] : (categoriesResult.data ?? []),
    brands: brandsResult.error ? [] : (brandsResult.data ?? []),
    merchants: merchantsResult.error ? [] : (merchantsResult.data ?? []),
    hasError: Boolean(
      productsResult.error ||
        categoriesResult.error ||
        brandsResult.error ||
        merchantsResult.error,
    ),
  };
}
