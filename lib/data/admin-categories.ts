import "server-only";

import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types/database";
import { isCategoryUuid } from "@/lib/validation/category";

export type AdminCategoryListItem = Pick<
  Category,
  "id" | "name" | "slug" | "description" | "is_active" | "created_at"
>;

export type AdminCategoryEditorCategory = Pick<
  Category,
  "id" | "name" | "slug" | "description" | "image_url" | "is_active"
>;

async function requireAdmin() {
  const access = await getAdminAccess();
  if (access.status === "unauthenticated") redirect("/admin/login");
  if (access.status === "denied") redirect("/admin/access-denied");
}

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

export async function getAdminCategories(search: string) {
  await requireAdmin();
  const supabase = await createClient();
  let query = supabase
    .from("categories")
    .select("id, name, slug, description, is_active, created_at")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("name", `%${escapeLikePattern(search.slice(0, 100))}%`);
  }

  const { data, error } = await query.returns<AdminCategoryListItem[]>();

  return { categories: error ? [] : (data ?? []), hasError: Boolean(error) };
}

export async function getAdminCategory(categoryId: string) {
  await requireAdmin();

  if (!isCategoryUuid(categoryId)) {
    return { category: null, hasError: false };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_url, is_active")
    .eq("id", categoryId)
    .maybeSingle<AdminCategoryEditorCategory>();

  return { category: error ? null : data, hasError: Boolean(error) };
}
