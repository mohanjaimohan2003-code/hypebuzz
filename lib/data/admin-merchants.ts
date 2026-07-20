import "server-only";

import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { Merchant } from "@/lib/types/database";
import { isMerchantUuid } from "@/lib/validation/merchant";

export type MerchantStatusFilter = "all" | "active" | "inactive";

export type AdminMerchantListItem = Pick<
  Merchant,
  | "id"
  | "name"
  | "slug"
  | "logo_url"
  | "website_url"
  | "affiliate_network"
  | "is_active"
  | "updated_at"
> & { offerCount: number };

export type AdminMerchantEditorMerchant = Pick<
  Merchant,
  | "id"
  | "name"
  | "slug"
  | "logo_url"
  | "website_url"
  | "affiliate_network"
  | "affiliate_tracking_parameter"
  | "is_active"
>;

type MerchantListRow = Pick<
  Merchant,
  | "id"
  | "name"
  | "slug"
  | "logo_url"
  | "website_url"
  | "affiliate_network"
  | "is_active"
  | "updated_at"
> & { product_offers: Array<{ count: number }> };

async function requireAdmin() {
  const access = await getAdminAccess();
  if (access.status === "unauthenticated") redirect("/admin/login");
  if (access.status === "denied") redirect("/admin/access-denied");
}

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

export function parseMerchantStatusFilter(
  value: string | undefined,
): MerchantStatusFilter {
  return value === "active" || value === "inactive" ? value : "all";
}

export async function getAdminMerchants({
  search,
  status,
}: {
  search: string;
  status: MerchantStatusFilter;
}) {
  await requireAdmin();
  const supabase = await createClient();
  let query = supabase
    .from("merchants")
    .select(
      "id, name, slug, logo_url, website_url, affiliate_network, is_active, updated_at, product_offers(count)",
    )
    .order("name", { ascending: true });

  if (search) {
    query = query.ilike(
      "name",
      `%${escapeLikePattern(search.slice(0, 100))}%`,
    );
  }

  if (status !== "all") {
    query = query.eq("is_active", status === "active");
  }

  const { data, error } = await query.returns<MerchantListRow[]>();
  return {
    merchants: error
      ? []
      : (data ?? []).map(
          (merchant): AdminMerchantListItem => ({
            id: merchant.id,
            name: merchant.name,
            slug: merchant.slug,
            logo_url: merchant.logo_url,
            website_url: merchant.website_url,
            affiliate_network: merchant.affiliate_network,
            is_active: merchant.is_active,
            updated_at: merchant.updated_at,
            offerCount: merchant.product_offers[0]?.count ?? 0,
          }),
        ),
    hasError: Boolean(error),
  };
}

export async function getAdminMerchant(merchantId: string) {
  await requireAdmin();
  if (!isMerchantUuid(merchantId)) {
    return { merchant: null, hasError: false };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("merchants")
    .select(
      "id, name, slug, logo_url, website_url, affiliate_network, affiliate_tracking_parameter, is_active",
    )
    .eq("id", merchantId)
    .maybeSingle<AdminMerchantEditorMerchant>();

  return { merchant: error ? null : data, hasError: Boolean(error) };
}
