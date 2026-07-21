import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ProductCardProduct } from "@/components/product/product-card";
import type { ProductSearchParams } from "@/lib/validation/product-search";

export type SearchFilterOption = { name: string; slug: string };
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
  created_at: string;
  category: { slug: string } | null;
  brand: { name: string; slug: string } | null;
  product_offers: Array<{
    current_price: number;
    original_price: number | null;
    currency: string;
    availability: string | null;
    merchant_id: string;
    merchant: { name: string; slug: string } | null;
  }>;
};
type OptionRow = SearchFilterOption;
type QueryError = { code?: string; message?: string; details?: string; hint?: string };

const fallbackImage = "/products/aurora-headphones.svg";

function logSearchError(section: string, error: QueryError | null) {
  if (!error) return;
  console.error("Supabase product search query failed", {
    section,
    code: error.code ?? "unknown",
    message: error.message ?? "Unknown Supabase error",
    details: error.details ?? "not reported",
    hint: error.hint ?? "not reported",
  });
}

export async function searchProducts(filters: ProductSearchParams): Promise<ProductSearchResult> {
  const supabase = await createClient();
  const [productsResult, categoriesResult, brandsResult, merchantsResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, slug, primary_image_url, created_at, category:categories(slug), brand:brands(name, slug), product_offers(current_price, original_price, currency, availability, merchant_id, merchant:merchants(name, slug))")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("categories").select("name, slug").order("name").returns<OptionRow[]>(),
    supabase.from("brands").select("name, slug").order("name").returns<OptionRow[]>(),
    supabase.from("merchants").select("name, slug").order("name").returns<OptionRow[]>(),
  ]);

  logSearchError("products", productsResult.error);
  logSearchError("categories", categoriesResult.error);
  logSearchError("brands", brandsResult.error);
  logSearchError("merchants", merchantsResult.error);

  const query = filters.q.toLowerCase();
  const availability = filters.availability?.toLowerCase().replaceAll(" ", "_") ?? null;
  const matches = ((productsResult.data ?? []) as unknown as SearchRow[]).flatMap((product) => {
    const offers = product.product_offers;
    const cheapest = [...offers].sort((a, b) => Number(a.current_price) - Number(b.current_price))[0];
    const biggestDiscount = offers.reduce<number | null>((biggest, offer) => {
      const current = Number(offer.current_price);
      const original = offer.original_price === null ? null : Number(offer.original_price);
      return original && original > current
        ? Math.max(biggest ?? 0, ((original - current) / original) * 100)
        : biggest;
    }, null);
    const matchesQuery = !query || product.name.toLowerCase().includes(query) ||
      product.brand?.name.toLowerCase().includes(query) ||
      offers.some((offer) => offer.merchant?.name.toLowerCase().includes(query));
    const visible = matchesQuery &&
      (!filters.category || product.category?.slug === filters.category) &&
      (!filters.brand || product.brand?.slug === filters.brand) &&
      (!filters.merchant || offers.some((offer) => offer.merchant?.slug === filters.merchant)) &&
      (filters.minPrice === null || (cheapest && Number(cheapest.current_price) >= filters.minPrice)) &&
      (filters.maxPrice === null || (cheapest && Number(cheapest.current_price) <= filters.maxPrice)) &&
      (filters.minDiscount === null || (biggestDiscount ?? 0) >= filters.minDiscount) &&
      (!availability || offers.some((offer) => offer.availability?.toLowerCase().replaceAll(" ", "_") === availability)) &&
      (!filters.bestPriceOnly || new Set(offers.map((offer) => offer.merchant_id)).size > 1);
    return visible ? [{ product, cheapest, biggestDiscount }] : [];
  });

  matches.sort((left, right) => {
    if (filters.sort === "price_low") return Number(left.cheapest?.current_price ?? Infinity) - Number(right.cheapest?.current_price ?? Infinity);
    if (filters.sort === "price_high") return Number(right.cheapest?.current_price ?? -Infinity) - Number(left.cheapest?.current_price ?? -Infinity);
    if (filters.sort === "discount") return (right.biggestDiscount ?? -1) - (left.biggestDiscount ?? -1);
    if (filters.sort === "newest" || filters.sort === "popular") return right.product.created_at.localeCompare(left.product.created_at);
    return left.product.name.localeCompare(right.product.name);
  });

  return {
    products: productsResult.error ? [] : matches.slice(0, 48).map(({ product, cheapest, biggestDiscount }) => ({
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
      badge: biggestDiscount && biggestDiscount > 0 ? `${Math.round(biggestDiscount)}% off` : undefined,
    })),
    categories: categoriesResult.error ? [] : (categoriesResult.data ?? []),
    brands: brandsResult.error ? [] : (brandsResult.data ?? []),
    merchants: merchantsResult.error ? [] : (merchantsResult.data ?? []),
    hasError: Boolean(productsResult.error || categoriesResult.error || brandsResult.error || merchantsResult.error),
  };
}
