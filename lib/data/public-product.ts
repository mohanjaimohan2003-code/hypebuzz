import "server-only";

import { cache } from "react";
import type { ProductCardProduct } from "@/components/product/product-card";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/types/database";
import { discountPercent, savingsAmount, sortPublicOffers } from "@/lib/offers/price-comparison";
import { isDatabaseOfferEligibleForPublication, isDatabaseOfferPubliclyVisible } from "@/lib/offers/publication-contract";

export type PublicProductOffer = {
  id: string;
  currentPrice: number;
  originalPrice: number | null;
  currency: string;
  availability: string | null;
  lastCheckedAt: string | null;
  merchant: { name: string; slug: string; logoUrl: string | null };
  discount: number | null;
  savings: number | null;
  isLowestPrice: boolean;
  couponCode: string | null;
  shippingNote: string | null;
  offerTitle: string | null;
};

export type PublicProductDetail = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  imageUrl: string | null;
  images: Array<{ id: string; imageUrl: string; altText: string | null }>;
  specifications: Array<{ name: string; value: string }>;
  features: string[];
  brand: { name: string; slug: string } | null;
  category: { name: string; slug: string } | null;
  offers: PublicProductOffer[];
  lowestPrice: number | null;
  highestDiscount: number | null;
  highestPrice: number | null;
  maximumSavings: number | null;
  activeMerchantCount: number;
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
  highlights: Json;
  seo_title: string | null;
  seo_description: string | null;
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
    coupon_note: string | null;
    shipping_note: string | null;
    offer_title: string | null;
    affiliate_url: string;
    is_active: boolean;
    merchant: { name: string; slug: string; logo_url: string | null; is_active: boolean } | null;
  }>;
};

type RelatedRow = {
  id: string;
  name: string;
  slug: string;
  primary_image_url: string | null;
  brand: { name: string } | null;
  product_offers: Array<{
    current_price: number; original_price: number | null; currency: string;
    merchant_id: string; affiliate_url: string; availability: string | null;
    is_active: boolean; merchant: { is_active: boolean } | null;
  }>;
};

const fallbackImage = "/products/aurora-headphones.svg";

function logProductQueryError(section: string, error: { code?: string; message?: string; details?: string; hint?: string } | null) {
  if (!error) return;
  console.error("Supabase product detail query failed", {
    section, code: error.code ?? "unknown", message: error.message ?? "Unknown Supabase error",
    details: error.details ?? "not reported", hint: error.hint ?? "not reported",
  });
}

function readProductContent(highlightsValue: Json, value: Json) {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return { features: Array.isArray(highlightsValue) ? highlightsValue.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [], specifications: [] };
  }

  const dedicatedHighlights = Array.isArray(highlightsValue)
    ? highlightsValue.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  const legacyFeatures = Array.isArray(value.features)
    ? value.features.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  const specifications = Object.entries(value)
    .filter(([key]) => key !== "features")
    .flatMap(([name, item]) => {
      if (item === null || typeof item === "object") return [];
      return [{ name, value: String(item) }];
    });

  return { features: dedicatedHighlights.length ? dedicatedHighlights : legacyFeatures, specifications };
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
    .select("id, name, slug, short_description, description, highlights, specifications, seo_title, seo_description, primary_image_url, brand_id, category_id, updated_at, brand:brands(name, slug), category:categories!inner(name, slug), product_offers(id, current_price, original_price, currency, availability, affiliate_url, is_active, last_checked_at, coupon_note, shipping_note, offer_title, merchant:merchants(name, slug, logo_url, is_active))")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  logProductQueryError("product", error);
  if (error || !data) return null;
  const product = data as unknown as ProductRow;
  if (!product.category) return null;
  const imageResult = await supabase.from("product_images").select("id, image_url, alt_text, is_primary, sort_order").eq("product_id",product.id).order("is_primary",{ascending:false}).order("sort_order").returns<Array<{id:string;image_url:string;alt_text:string|null;is_primary:boolean;sort_order:number}>>();
  const validOffers = product.product_offers.filter(isDatabaseOfferPubliclyVisible);
  const eligibleOfferRows = validOffers.filter(isDatabaseOfferEligibleForPublication);
  const lowestPrice = eligibleOfferRows.length
    ? Math.min(...eligibleOfferRows.map((offer) => Number(offer.current_price)))
    : null;
  const offers = sortPublicOffers(validOffers
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
        discount: discountPercent(currentPrice, originalPrice),
        savings: savingsAmount(currentPrice, originalPrice),
        isLowestPrice: isDatabaseOfferEligibleForPublication(offer) && currentPrice === lowestPrice,
        couponCode: offer.coupon_note,
        shippingNote: offer.shipping_note,
        offerTitle: offer.offer_title,
      };
    }));

  let relatedProducts: ProductCardProduct[] = [];
  if (product.category_id || product.brand_id) {
    let relatedQuery = supabase
      .from("products")
      .select("id, name, slug, primary_image_url, brand:brands(name), category:categories!inner(id), product_offers(current_price, original_price, currency, merchant_id, affiliate_url, availability, is_active, merchant:merchants(is_active))")
      .neq("id", product.id)
      .eq("status", "published")
      .limit(8);
    const filters = [
      product.category_id ? `category_id.eq.${product.category_id}` : null,
      product.brand_id ? `brand_id.eq.${product.brand_id}` : null,
    ].filter(Boolean);
    relatedQuery = relatedQuery.or(filters.join(","));
    const relatedResult = await relatedQuery;
    logProductQueryError("related products", relatedResult.error);
    if (!relatedResult.error) {
      relatedProducts = ((relatedResult.data ?? []) as unknown as RelatedRow[])
        .flatMap((related) => {
          const eligibleOffers = related.product_offers.filter(isDatabaseOfferEligibleForPublication);
          if (!eligibleOffers.length) return [];
          const cheapest = [...eligibleOffers].sort((a, b) => Number(a.current_price) - Number(b.current_price))[0];
          return [{
            id: related.id,
            name: related.name,
            brand: related.brand?.name ?? "Independent brand",
            imageSrc: related.primary_image_url ?? fallbackImage,
            imageAlt: related.name,
            price: Number(cheapest.current_price),
            currency: cheapest.currency,
            storeCount: new Set(eligibleOffers.map((offer) => offer.merchant_id)).size,
            productHref: `/products/${related.slug}`,
            dealsHref: `/products/${related.slug}#compare-prices`,
          }];
        })
        .slice(0, 4);
    }
  }

  const content = readProductContent(product.highlights, product.specifications);
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
    seoTitle: product.seo_title,
    seoDescription: product.seo_description,
    imageUrl: product.primary_image_url,
    images: imageResult.error ? (product.primary_image_url ? [{id:"primary",imageUrl:product.primary_image_url,altText:product.name}]:[]) : (imageResult.data??[]).map(image=>({id:image.id,imageUrl:image.image_url,altText:image.alt_text})),
    specifications: content.specifications,
    features: content.features,
    brand: product.brand,
    category: product.category,
    offers,
    lowestPrice,
    highestDiscount,
    highestPrice: offers.length ? Math.max(...offers.map((offer) => offer.currentPrice)) : null,
    maximumSavings: offers.reduce<number | null>((maximum, offer) => offer.savings === null ? maximum : Math.max(maximum ?? 0, offer.savings), null),
    activeMerchantCount: new Set(offers.map((offer) => offer.merchant.slug)).size,
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
