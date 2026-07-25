import "server-only";

import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { Product, ProductImage, ProductStatus } from "@/lib/types/database";
import { isUuid } from "@/lib/validation/product";

export type AdminProductStatusFilter = "all" | ProductStatus;

export type AdminCategoryOption = {
  id: string;
  name: string;
  isActive: boolean;
};
export type AdminMerchantOption = { id: string; name: string; isActive: boolean };

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
export type AdminPrimaryOffer = {
  id: string; merchant_id: string; affiliate_url: string; current_price: number;
  original_price: number | null; currency: string; availability: string | null; is_active: boolean;
};

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
  merchants: AdminMerchantOption[];
  hasError: boolean;
}> {
  await requireAdmin();
  const supabase = await createClient();
  const [categoryResult, merchantResult] = await Promise.all([
    supabase.from("categories").select("id, name, is_active").order("name").returns<Array<{ id: string; name: string; is_active: boolean }>>(),
    supabase.from("merchants").select("id, name, is_active").order("name").returns<Array<{ id: string; name: string; is_active: boolean }>>(),
  ]);

  return {
    categories: categoryResult.error
      ? []
      : (categoryResult.data ?? []).map((category) => ({
          id: category.id,
          name: category.name,
          isActive: category.is_active,
        })),
    merchants: merchantResult.error ? [] : (merchantResult.data ?? []).map((merchant) => ({ id: merchant.id, name: merchant.name, isActive: merchant.is_active })),
    hasError: Boolean(categoryResult.error || merchantResult.error),
  };
}

export async function getAdminProductEditorData(productId: string) {
  await requireAdmin();

  if (!isUuid(productId)) {
    return { product: null, categories: [], hasError: false };
  }

  const supabase = await createClient();
  const [productResult, categoryResult, merchantResult, offerResult, imagesResult] = await Promise.all([
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
    supabase.from("merchants").select("id, name, is_active").order("name").returns<Array<{ id: string; name: string; is_active: boolean }>>(),
    supabase.from("product_offers").select("id, merchant_id, affiliate_url, current_price, original_price, currency, availability, is_active").eq("product_id", productId).order("is_active", { ascending: false }).order("current_price").limit(1).maybeSingle<AdminPrimaryOffer>(),
    supabase.from("product_images").select("*").eq("product_id", productId).order("sort_order").returns<ProductImage[]>(),
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
    merchants: merchantResult.error ? [] : (merchantResult.data ?? []).map((merchant) => ({ id: merchant.id, name: merchant.name, isActive: merchant.is_active })),
    offer: offerResult.error ? null : offerResult.data,
    images: imagesResult.error ? [] : (imagesResult.data ?? []).map(image => ({ id: image.id, imageUrl: image.image_url, sourceType: image.source_type, isPrimary: image.is_primary, sortOrder: image.sort_order })),
    hasError: Boolean(productResult.error || categoryResult.error || merchantResult.error || offerResult.error || imagesResult.error),
  };
}
