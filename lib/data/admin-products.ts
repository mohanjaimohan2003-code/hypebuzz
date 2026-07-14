import "server-only";

import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { Product, ProductStatus } from "@/lib/types/database";
import { isUuid } from "@/lib/validation/product";

export type AdminProductStatusFilter = "all" | ProductStatus;

export type AdminCategoryOption = {
  id: string;
  name: string;
  isActive: boolean;
};

export type AdminProductListItem = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  categoryName: string | null;
  status: ProductStatus;
  isFeatured: boolean;
  createdAt: string;
};

export type AdminProductEditorProduct = Pick<
  Product,
  | "id"
  | "name"
  | "slug"
  | "short_description"
  | "category_id"
  | "primary_image_url"
  | "is_featured"
  | "is_trending"
  | "status"
>;

type ProductListRow = {
  id: string;
  name: string;
  slug: string;
  primary_image_url: string | null;
  status: ProductStatus;
  is_featured: boolean;
  created_at: string;
  category: { name: string } | null;
};

async function requireAdmin() {
  const access = await getAdminAccess();
  if (access.status === "unauthenticated") redirect("/admin/login");
  if (access.status === "denied") redirect("/admin/access-denied");
}

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

export function parseProductStatusFilter(value: string | undefined): AdminProductStatusFilter {
  return value === "draft" || value === "published" || value === "archived"
    ? value
    : "all";
}

export async function getAdminProducts({
  search,
  status,
}: {
  search: string;
  status: AdminProductStatusFilter;
}) {
  await requireAdmin();
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("id, name, slug, primary_image_url, status, is_featured, created_at, category:categories(name)")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("name", `%${escapeLikePattern(search.slice(0, 100))}%`);
  }

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query.returns<ProductListRow[]>();

  return {
    products: error
      ? []
      : (data ?? []).map((product): AdminProductListItem => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          imageUrl: product.primary_image_url,
          categoryName: product.category?.name ?? null,
          status: product.status,
          isFeatured: product.is_featured,
          createdAt: product.created_at,
        })),
    hasError: Boolean(error),
  };
}

export async function getAdminCategoryOptions(): Promise<{
  categories: AdminCategoryOption[];
  hasError: boolean;
}> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, is_active")
    .order("name")
    .returns<Array<{ id: string; name: string; is_active: boolean }>>();

  return {
    categories: error
      ? []
      : (data ?? []).map((category) => ({
          id: category.id,
          name: category.name,
          isActive: category.is_active,
        })),
    hasError: Boolean(error),
  };
}

export async function getAdminProductEditorData(productId: string) {
  await requireAdmin();

  if (!isUuid(productId)) {
    return { product: null, categories: [], hasError: false };
  }

  const supabase = await createClient();
  const [productResult, categoryResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, slug, short_description, category_id, primary_image_url, is_featured, is_trending, status")
      .eq("id", productId)
      .maybeSingle<AdminProductEditorProduct>(),
    supabase
      .from("categories")
      .select("id, name, is_active")
      .order("name")
      .returns<Array<{ id: string; name: string; is_active: boolean }>>(),
  ]);

  return {
    product: productResult.error ? null : productResult.data,
    categories: categoryResult.error
      ? []
      : (categoryResult.data ?? []).map((category) => ({
          id: category.id,
          name: category.name,
          isActive: category.is_active,
        })),
    hasError: Boolean(productResult.error || categoryResult.error),
  };
}
