import "server-only";

import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types/database";
import { isCategoryUuid } from "@/lib/validation/category";

export type AdminCategoryListItem = Pick<
  Category,
  | "id"
  | "name"
  | "slug"
  | "is_active"
  | "updated_at"
> & { productCount: number };

export type AdminCategoryEditorCategory = Pick<
  Category,
  | "id"
  | "name"
  | "slug"
  | "description"
  | "image_url"
  | "is_active"
>;

type CategoryListRow = Pick<
  Category,
  | "id"
  | "name"
  | "slug"
  | "is_active"
  | "updated_at"
> & { products: Array<{ count: number }> };

export type CategoryStatusFilter = "all" | "active" | "inactive";

type CategoryQueryError = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

function logCategoryQueryError(
  operation: string,
  error: CategoryQueryError | null,
  httpStatus?: number,
) {
  if (!error) return;
  console.error("Admin category query failed", {
    operation,
    code: error.code ?? "unknown",
    message: error.message ?? "Unknown database error",
    details: error.details ?? null,
    hint: error.hint ?? null,
    httpStatus: httpStatus ?? null,
  });
}

export function parseCategoryStatusFilter(
  value: string | undefined,
): CategoryStatusFilter {
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

export async function getAdminCategories({
  search,
  status,
}: {
  search: string;
  status: CategoryStatusFilter;
}) {
  await requireAdmin();
  const supabase = await createClient();
  let query = supabase
    .from("categories")
    .select("id, name, slug, is_active, updated_at, products(count)")
    .order("name", { ascending: true });

  if (search) {
    query = query.ilike("name", `%${escapeLikePattern(search.slice(0, 100))}%`);
  }

  if (status !== "all") {
    query = query.eq("is_active", status === "active");
  }

  const { data, error, status: httpStatus } = await query.returns<CategoryListRow[]>();
  logCategoryQueryError("list", error, httpStatus);

  return {
    categories: error
      ? []
      : (data ?? []).map(
          (category): AdminCategoryListItem => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            is_active: category.is_active,
            updated_at: category.updated_at,
            productCount: category.products[0]?.count ?? 0,
          }),
        ),
    hasError: Boolean(error),
  };
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

  logCategoryQueryError("get", error);

  return { category: error ? null : data, hasError: Boolean(error) };
}
