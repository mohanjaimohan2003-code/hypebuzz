import "server-only";

import { cache } from "react";
import type { ProductCardProduct } from "@/components/product/product-card";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/types/database";

export type PublicProductOffer = {
  id: string;
  currentPrice: number;
  originalPrice: number | null;
  currency: string;
  availability: string | null;
  lastCheckedAt: string | null;
  merchant: { name: string; slug: string; logoUrl: string | null };
  discount: number | null;
  isLowestPrice: boolean;
};

export type PublicProductDetail = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  imageUrl: string | null;
  specifications: Array<{ name: string; value: string }>;
  features: string[];
  brand: { name: string; slug: string } | null;
  category: { name: string; slug: string } | null;
  offers: PublicProductOffer[];
  lowestPrice: number | null;
  highestDiscount: number | null;
  currency: string;
  availability: string;
  updatedAt: string;
  relatedProducts: ProductCardProduct[];
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  primary_image_url: string | null;
  specifications: Json;
  brand_id: string | null;
  category_id: string | null;
  updated_at: string;
  brand: { name: string; slug: string } | null;
  category: { name: string; slug: string } | null;
  product_offers: Array<{
    id: string;
    current_price: number;
    original_price: number | null;
    currency: string;
    availability: string | null;
    last_checked_at: string | null;
    merchant: { name: string; slug: string; logo_url: string | null } | null;
  }>;
};

type RelatedRow = {
  id: string;
  name: string;
  slug: string;
  primary_image_url: string | null;
  brand: { name: string } | null;
  product_offers: Array<{ current_price: number; currency: string; merchant_id: string }>;
};

const fallbackImage = "/products/aurora-headphones.svg";

function readProductContent(value: Json) {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return { features: [], specifications: [] };
  }

  const features = Array.isArray(value.features)
    ? value.features.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  const specifications = Object.entries(value)
    .filter(([key]) => key !== "features")
    .flatMap(([name, item]) => {
      if (item === null || typeof item === "object") return [];
      return [{ name, value: String(item) }];
    });

  return { features, specifications };
}

function discountFor(currentPrice: number, originalPrice: number | null) {
  if (!originalPrice || originalPrice <= currentPrice) return null;
  return ((originalPrice - currentPrice) / originalPrice) * 100;
}

function isInStock(availability: string | null) {
  if (!availability) return false;
  const normalized = availability.toLowerCase();
  return normalized.includes("in stock") || normalized === "available";
}

export const getPublicProduct = cache(async (slug: string): Promise<PublicProductDetail | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, slug, short_description, description, primary_image_url, specifications, brand_id, category_id, updated_at, brand:brands(name, slug), category:categories(name, slug), product_offers(id, current_price, original_price, currency, availability, last_checked_at, merchant:merchants(name, slug, logo_url))")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  const product = data as unknown as ProductRow;
  const validOffers = product.product_offers.filter((offer) => offer.merchant);
  const lowestPrice = validOffers.length
    ? Math.min(...validOffers.map((offer) => Number(offer.current_price)))
    : null;
  const offers = validOffers
    .map((offer): PublicProductOffer => {
      const currentPrice = Number(offer.current_price);
      const originalPrice = offer.original_price === null ? null : Number(offer.original_price);
      return {
        id: offer.id,
        currentPrice,
        originalPrice,
        currency: offer.currency,
        availability: offer.availability,
        lastCheckedAt: offer.last_checked_at,
        merchant: {
          name: offer.merchant!.name,
          slug: offer.merchant!.slug,
          logoUrl: offer.merchant!.logo_url,
        },
        discount: discountFor(currentPrice, originalPrice),
        isLowestPrice: currentPrice === lowestPrice,
      };
    })
    .sort((a, b) => a.currentPrice - b.currentPrice);

  let relatedProducts: ProductCardProduct[] = [];
  if (product.category_id || product.brand_id) {
    let relatedQuery = supabase
      .from("products")
      .select("id, name, slug, primary_image_url, brand:brands(name), product_offers(current_price, currency, merchant_id)")
      .neq("id", product.id)
      .limit(8);
    const filters = [
      product.category_id ? `category_id.eq.${product.category_id}` : null,
      product.brand_id ? `brand_id.eq.${product.brand_id}` : null,
    ].filter(Boolean);
    relatedQuery = relatedQuery.or(filters.join(","));
    const relatedResult = await relatedQuery;
    if (!relatedResult.error) {
      relatedProducts = ((relatedResult.data ?? []) as unknown as RelatedRow[])
        .flatMap((related) => {
          if (!related.product_offers.length) return [];
          const cheapest = [...related.product_offers].sort((a, b) => Number(a.current_price) - Number(b.current_price))[0];
          return [{
            id: related.id,
            name: related.name,
            brand: related.brand?.name ?? "Independent brand",
            imageSrc: related.primary_image_url ?? fallbackImage,
            imageAlt: related.name,
            price: Number(cheapest.current_price),
            currency: cheapest.currency,
            storeCount: new Set(related.product_offers.map((offer) => offer.merchant_id)).size,
            productHref: `/products/${related.slug}`,
            dealsHref: `/products/${related.slug}#deals`,
          }];
        })
        .slice(0, 4);
    }
  }

  const content = readProductContent(product.specifications);
  const highestDiscount = offers.reduce<number | null>(
    (highest, offer) => offer.discount === null ? highest : Math.max(highest ?? 0, offer.discount),
    null,
  );

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.short_description,
    description: product.description,
    imageUrl: product.primary_image_url,
    specifications: content.specifications,
    features: content.features,
    brand: product.brand,
    category: product.category,
    offers,
    lowestPrice,
    highestDiscount,
    currency: offers[0]?.currency ?? "INR",
    availability: offers.some((offer) => isInStock(offer.availability))
      ? "Available"
      : offers[0]?.availability ?? "Availability unknown",
    updatedAt: offers.reduce(
      (latest, offer) => offer.lastCheckedAt && offer.lastCheckedAt > latest ? offer.lastCheckedAt : latest,
      product.updated_at,
    ),
    relatedProducts,
  };
});
