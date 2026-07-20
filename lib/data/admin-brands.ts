import "server-only";

import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { Brand } from "@/lib/types/database";
import { isBrandUuid } from "@/lib/validation/brand";

export type AdminBrandListItem = Pick<
  Brand,
  "id" | "name" | "slug" | "logo_url" | "is_active" | "updated_at"
> & { productCount: number };

export type AdminBrandEditorBrand = Pick<
  Brand,
  | "id"
  | "name"
  | "slug"
  | "description"
  | "logo_url"
  | "website_url"
  | "is_active"
>;

type BrandListRow = Pick<
  Brand,
  "id" | "name" | "slug" | "logo_url" | "is_active" | "updated_at"
> & { products: Array<{ count: number }> };

export type BrandStatusFilter = "all" | "active" | "inactive";

export function parseBrandStatusFilter(
  value: string | undefined,
): BrandStatusFilter {
  return value === "active" || value === "inactive" ? value : "all";
}

async function requireAdmin() {
  const access = await getAdminAccess();
  if (access.status === "unauthenticated") redirect("/admin/login");
  if (access.status === "denied") redirect("/admin/access-denied");
}

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

export async function getAdminBrands({
  search,
  status,
}: {
  search: string;
  status: BrandStatusFilter;
}) {
  await requireAdmin();
  const supabase = await createClient();
  let query = supabase
    .from("brands")
    .select("id, name, slug, logo_url, is_active, updated_at, products(count)")
    .order("name", { ascending: true });

  if (search) {
    query = query.ilike("name", `%${escapeLikePattern(search.slice(0, 100))}%`);
  }

  if (status !== "all") {
    query = query.eq("is_active", status === "active");
  }

  const { data, error } = await query.returns<BrandListRow[]>();
  return {
    brands: error
      ? []
      : (data ?? []).map(
          (brand): AdminBrandListItem => ({
            id: brand.id,
            name: brand.name,
            slug: brand.slug,
            logo_url: brand.logo_url,
            is_active: brand.is_active,
            updated_at: brand.updated_at,
            productCount: brand.products[0]?.count ?? 0,
          }),
        ),
    hasError: Boolean(error),
  };
}

export async function getAdminBrand(brandId: string) {
  await requireAdmin();
  if (!isBrandUuid(brandId)) return { brand: null, hasError: false };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brands")
    .select("id, name, slug, description, logo_url, website_url, is_active")
    .eq("id", brandId)
    .maybeSingle<AdminBrandEditorBrand>();

  return { brand: error ? null : data, hasError: Boolean(error) };
}
