import "server-only";

import type { ProductCardProduct } from "@/components/product/product-card";
import { createClient } from "@/lib/supabase/server";

export type HomepageBrand = { id: string; name: string; slug: string; productCount: number };
export type HomepageCategory = { id: string; name: string; slug: string; productCount: number };
export type HomepageData = {
  featuredProducts: ProductCardProduct[];
  trendingProducts: ProductCardProduct[];
  latestProducts: ProductCardProduct[];
  bestDeals: ProductCardProduct[];
  popularBrands: HomepageBrand[];
  featuredCategories: HomepageCategory[];
  hasError: boolean;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  primary_image_url: string | null;
  brand: { name: string } | null;
  product_offers: Array<{
    current_price: number;
    original_price?: number | null;
    currency: string;
    merchant_id: string;
  }>;
};
type BrandRow = { id: string; name: string; slug: string; products: Array<{ count: number }> };
type CategoryRow = { id: string; name: string; slug: string; products: Array<{ count: number }> };

const fallbackImage = "/products/aurora-headphones.svg";
type HomepageQueryError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

function logHomepageQueryError(section: string, error: HomepageQueryError | null) {
  if (!error) return;
  console.error("Supabase homepage query failed", {
    section,
    code: error.code ?? "unknown",
    message: error.message ?? "Unknown Supabase error",
    details: error.details ?? "not reported",
    hint: error.hint ?? "not reported",
  });
}

async function runHomepageQuery<T extends { data: unknown; error: HomepageQueryError | null }>(
  section: string,
  query: PromiseLike<T>,
): Promise<T | { data: null; error: HomepageQueryError }> {
  try {
    const result = await query;
    logHomepageQueryError(section, result.error);
    return result;
  } catch (error) {
    const queryError: HomepageQueryError = {
      message: error instanceof Error ? error.message : String(error),
      details: "The query threw before Supabase returned a response.",
    };
    logHomepageQueryError(section, queryError);
    return { data: null, error: queryError };
  }
}

function productCard(product: ProductRow, badge?: string): ProductCardProduct {
  const cheapest = [...product.product_offers].sort(
    (left, right) => Number(left.current_price) - Number(right.current_price),
  )[0];
  return {
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
    badge,
  };
}

function dealCards(products: ProductRow[]) {
  return products
    .flatMap((product) => {
      const discounts = product.product_offers.flatMap((offer) => {
        const current = Number(offer.current_price);
        const original = offer.original_price === null || offer.original_price === undefined
          ? null
          : Number(offer.original_price);
        return original && original > current ? [((original - current) / original) * 100] : [];
      });
      if (!discounts.length) return [];
      const biggestDiscount = Math.max(...discounts);
      return [{ product: productCard(product, `${Math.round(biggestDiscount)}% off`), biggestDiscount }];
    })
    .sort((left, right) => right.biggestDiscount - left.biggestDiscount)
    .slice(0, 4)
    .map(({ product }) => product);
}

export async function getHomepageData(): Promise<HomepageData> {
  const supabase = await createClient();
  const productSelect = "id, name, slug, primary_image_url, brand:brands(name), product_offers(current_price, currency, merchant_id)";
  const [featured, trending, latest, deals, brands, categories] = await Promise.all([
    runHomepageQuery("featured products", supabase.from("products").select(productSelect).eq("status", "published").eq("is_featured", true).order("updated_at", { ascending: false }).limit(4)),
    runHomepageQuery("trending products", supabase.from("products").select(productSelect).eq("status", "published").eq("is_trending", true).order("updated_at", { ascending: false }).limit(4)),
    runHomepageQuery("latest products", supabase.from("products").select(productSelect).eq("status", "published").order("created_at", { ascending: false }).limit(4)),
    runHomepageQuery("best deals", supabase.from("products").select("id, name, slug, primary_image_url, brand:brands(name), product_offers(current_price, original_price, currency, merchant_id)").eq("status", "published").order("updated_at", { ascending: false }).limit(100)),
    runHomepageQuery("popular brands", supabase.from("brands").select("id, name, slug, products(count)").eq("is_active", true).order("name").limit(100)),
    runHomepageQuery("featured categories", supabase.from("categories").select("id, name, slug, products(count)").eq("is_active", true).order("name").limit(8)),
  ]);

  const brandRows = (brands.data ?? []) as unknown as BrandRow[];
  return {
      featuredProducts: featured.error ? [] : ((featured.data ?? []) as unknown as ProductRow[]).map((product) => productCard(product, "Featured")),
      trendingProducts: trending.error ? [] : ((trending.data ?? []) as unknown as ProductRow[]).map((product) => productCard(product, "Trending")),
      latestProducts: latest.error ? [] : ((latest.data ?? []) as unknown as ProductRow[]).map((product) => productCard(product, "New")),
      bestDeals: deals.error ? [] : dealCards((deals.data ?? []) as unknown as ProductRow[]),
      popularBrands: brands.error ? [] : brandRows
        .map((brand) => ({ id: brand.id, name: brand.name, slug: brand.slug, productCount: brand.products[0]?.count ?? 0 }))
        .sort((left, right) => right.productCount - left.productCount || left.name.localeCompare(right.name))
        .slice(0, 8),
      featuredCategories: categories.error ? [] : ((categories.data ?? []) as unknown as CategoryRow[]).map((category) => ({
        id: category.id, name: category.name, slug: category.slug,
        productCount: category.products[0]?.count ?? 0,
      })),
      hasError: [featured, trending, latest, deals, brands, categories].some((result) => Boolean(result.error)),
  };
}

export async function getTrendingProducts(): Promise<{
  products: ProductCardProduct[];
  hasError: boolean;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, slug, primary_image_url, brand:brands(name), product_offers(current_price, currency, merchant_id)")
    .eq("status", "published")
    .eq("is_trending", true)
    .order("updated_at", { ascending: false })
    .limit(48);

  logHomepageQueryError("trending page products", error);

  return {
    products: error
      ? []
      : ((data ?? []) as unknown as ProductRow[]).map((product) => productCard(product, "Trending")),
    hasError: Boolean(error),
  };
}
