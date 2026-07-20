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
  product_offers: Array<{ current_price: number; currency: string; merchant_id: string }>;
};
type SearchRow = {
  id: string; name: string; slug: string; primary_image_url: string | null;
  brand_name: string | null; best_price: number; currency: string;
  store_count: number; biggest_discount: number | null;
};
type BrandRow = { id: string; name: string; slug: string; products: Array<{ count: number }> };
type CategoryRow = { id: string; name: string; slug: string; products: Array<{ count: number }> };

const fallbackImage = "/products/aurora-headphones.svg";
const emptyData: HomepageData = {
  featuredProducts: [], trendingProducts: [], latestProducts: [], bestDeals: [],
  popularBrands: [], featuredCategories: [], hasError: true,
};

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

function searchCard(product: SearchRow): ProductCardProduct {
  return {
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
    badge: product.biggest_discount && product.biggest_discount > 0
      ? `${Math.round(product.biggest_discount)}% off`
      : undefined,
  };
}

export async function getHomepageData(): Promise<HomepageData> {
  try {
    const supabase = await createClient();
    const productSelect = "id, name, slug, primary_image_url, brand:brands(name), product_offers(current_price, currency, merchant_id)";
    const [featured, trending, latest, deals, brands, categories] = await Promise.all([
      supabase.from("products").select(productSelect).eq("status", "published").eq("is_featured", true).order("updated_at", { ascending: false }).limit(4),
      supabase.from("products").select(productSelect).eq("status", "published").eq("is_trending", true).order("updated_at", { ascending: false }).limit(4),
      supabase.from("products").select(productSelect).eq("status", "published").order("created_at", { ascending: false }).limit(4),
      supabase.rpc("search_products", { p_sort: "discount", p_limit: 4 }),
      supabase.from("brands").select("id, name, slug, products(count)").eq("is_active", true).order("name").limit(100),
      supabase.from("categories").select("id, name, slug, products(count)").eq("is_active", true).order("display_order").order("name").limit(8),
    ]);

    const brandRows = (brands.data ?? []) as unknown as BrandRow[];
    return {
      featuredProducts: featured.error ? [] : ((featured.data ?? []) as unknown as ProductRow[]).map((product) => productCard(product, "Featured")),
      trendingProducts: trending.error ? [] : ((trending.data ?? []) as unknown as ProductRow[]).map((product) => productCard(product, "Trending")),
      latestProducts: latest.error ? [] : ((latest.data ?? []) as unknown as ProductRow[]).map((product) => productCard(product, "New")),
      bestDeals: deals.error ? [] : ((deals.data ?? []) as SearchRow[]).map(searchCard),
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
  } catch {
    return emptyData;
  }
}
