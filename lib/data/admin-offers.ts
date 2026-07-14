import "server-only";

import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { ProductOffer, ProductStatus } from "@/lib/types/database";
import {
  isOfferStockStatus,
  isOfferUuid,
  type OfferStockStatus,
} from "@/lib/validation/offer";

export type AdminOfferOption = {
  id: string;
  name: string;
  detail?: string;
};

export type AdminOfferListItem = {
  id: string;
  productName: string;
  merchantName: string;
  affiliateUrl: string;
  currentPrice: number;
  originalPrice: number | null;
  currency: string;
  stockStatus: OfferStockStatus | null;
  isActive: boolean;
  updatedAt: string;
};

export type AdminOfferEditorOffer = Pick<
  ProductOffer,
  | "id"
  | "product_id"
  | "merchant_id"
  | "affiliate_url"
  | "current_price"
  | "original_price"
  | "currency"
  | "availability"
  | "coupon_note"
  | "is_active"
>;

type OfferListRow = {
  id: string;
  affiliate_url: string;
  current_price: number;
  original_price: number | null;
  currency: string;
  availability: string | null;
  is_active: boolean;
  updated_at: string;
  product: { name: string } | null;
  merchant: { name: string } | null;
};

async function requireAdmin() {
  const access = await getAdminAccess();
  if (access.status === "unauthenticated") redirect("/admin/login");
  if (access.status === "denied") redirect("/admin/access-denied");
}

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

export function parseMerchantFilter(value: string | undefined) {
  return value && isOfferUuid(value) ? value : "all";
}

export type OfferActiveFilter = "all" | "active" | "inactive";

export function parseOfferActiveFilter(
  value: string | undefined,
): OfferActiveFilter {
  return value === "active" || value === "inactive" ? value : "all";
}

async function getOfferOptions() {
  const supabase = await createClient();
  const [productsResult, merchantsResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, status")
      .order("name")
      .returns<Array<{ id: string; name: string; status: ProductStatus }>>(),
    supabase
      .from("merchants")
      .select("id, name, is_active")
      .order("name")
      .returns<Array<{ id: string; name: string; is_active: boolean }>>(),
  ]);

  return {
    products: productsResult.error
      ? []
      : (productsResult.data ?? []).map((product) => ({
          id: product.id,
          name: product.name,
          detail: product.status === "published" ? undefined : product.status,
        })),
    merchants: merchantsResult.error
      ? []
      : (merchantsResult.data ?? []).map((merchant) => ({
          id: merchant.id,
          name: merchant.name,
          detail: merchant.is_active ? undefined : "inactive",
        })),
    hasError: Boolean(productsResult.error || merchantsResult.error),
  };
}

export async function getAdminOfferOptions() {
  await requireAdmin();
  return getOfferOptions();
}

export async function getAdminOffers({
  search,
  merchantId,
  activeStatus,
}: {
  search: string;
  merchantId: string;
  activeStatus: OfferActiveFilter;
}) {
  await requireAdmin();
  const supabase = await createClient();
  const optionsPromise = getOfferOptions();
  let matchingProductIds: string[] | null = null;

  if (search) {
    const productResult = await supabase
      .from("products")
      .select("id")
      .ilike("name", `%${escapeLikePattern(search.slice(0, 100))}%`)
      .returns<Array<{ id: string }>>();

    if (productResult.error) {
      const options = await optionsPromise;
      return { offers: [], ...options, hasError: true };
    }
    matchingProductIds = (productResult.data ?? []).map((product) => product.id);
  }

  let offerResult: { data: OfferListRow[] | null; error: unknown } = { data: [], error: null };
  if (matchingProductIds === null || matchingProductIds.length > 0) {
    let query = supabase
      .from("product_offers")
      .select("id, affiliate_url, current_price, original_price, currency, availability, is_active, updated_at, product:products(name), merchant:merchants(name)")
      .order("updated_at", { ascending: false });
    if (matchingProductIds) query = query.in("product_id", matchingProductIds);
    if (merchantId !== "all") query = query.eq("merchant_id", merchantId);
    if (activeStatus !== "all") {
      query = query.eq("is_active", activeStatus === "active");
    }
    offerResult = await query.returns<OfferListRow[]>();
  }

  const options = await optionsPromise;
  return {
    offers: offerResult.error
      ? []
      : (offerResult.data ?? []).map((offer): AdminOfferListItem => ({
          id: offer.id,
          productName: offer.product?.name ?? "Unknown product",
          merchantName: offer.merchant?.name ?? "Unknown merchant",
          affiliateUrl: offer.affiliate_url,
          currentPrice: Number(offer.current_price),
          originalPrice: offer.original_price === null ? null : Number(offer.original_price),
          currency: offer.currency,
          stockStatus: offer.availability && isOfferStockStatus(offer.availability) ? offer.availability : null,
          isActive: offer.is_active,
          updatedAt: offer.updated_at,
        })),
    ...options,
    hasError: Boolean(offerResult.error || options.hasError),
  };
}

export async function getAdminOfferEditorData(offerId: string) {
  await requireAdmin();
  if (!isOfferUuid(offerId)) {
    return { offer: null, products: [], merchants: [], hasError: false };
  }

  const supabase = await createClient();
  const [offerResult, options] = await Promise.all([
    supabase
      .from("product_offers")
      .select("id, product_id, merchant_id, affiliate_url, current_price, original_price, currency, availability, coupon_note, is_active")
      .eq("id", offerId)
      .maybeSingle<AdminOfferEditorOffer>(),
    getOfferOptions(),
  ]);

  return {
    offer: offerResult.error ? null : offerResult.data,
    products: options.products,
    merchants: options.merchants,
    hasError: Boolean(offerResult.error || options.hasError),
  };
}
