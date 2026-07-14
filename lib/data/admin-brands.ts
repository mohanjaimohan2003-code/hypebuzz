import "server-only";

import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { Brand } from "@/lib/types/database";
import { isBrandUuid } from "@/lib/validation/brand";

export type AdminBrandListItem = Pick<
  Brand,
  "id" | "name" | "slug" | "logo_url" | "is_active" | "created_at"
>;

export type AdminBrandEditorBrand = Pick<
  Brand,
  "id" | "name" | "slug" | "logo_url" | "is_active"
>;

async function requireAdmin() {
  const access = await getAdminAccess();
  if (access.status === "unauthenticated") redirect("/admin/login");
  if (access.status === "denied") redirect("/admin/access-denied");
}

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

export async function getAdminBrands(search: string) {
  await requireAdmin();
  const supabase = await createClient();
  let query = supabase
    .from("brands")
    .select("id, name, slug, logo_url, is_active, created_at")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("name", `%${escapeLikePattern(search.slice(0, 100))}%`);
  }

  const { data, error } = await query.returns<AdminBrandListItem[]>();
  return { brands: error ? [] : (data ?? []), hasError: Boolean(error) };
}

export async function getAdminBrand(brandId: string) {
  await requireAdmin();
  if (!isBrandUuid(brandId)) return { brand: null, hasError: false };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brands")
    .select("id, name, slug, logo_url, is_active")
    .eq("id", brandId)
    .maybeSingle<AdminBrandEditorBrand>();

  return { brand: error ? null : data, hasError: Boolean(error) };
}
