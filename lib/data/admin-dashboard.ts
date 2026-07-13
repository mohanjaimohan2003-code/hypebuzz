import "server-only";

import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { ProductStatus } from "@/lib/types/database";

export type AdminDashboardCounts = {
  totalProducts: number;
  publishedProducts: number;
  draftProducts: number;
  categories: number;
  brands: number;
  merchants: number;
  activeOffers: number;
};

export type AdminRecentProduct = {
  id: string;
  name: string;
  status: ProductStatus;
  createdAt: string;
};

export type AdminDashboardData = {
  counts: AdminDashboardCounts;
  recentProducts: AdminRecentProduct[];
  hasError: boolean;
};

type CountResult = {
  count: number | null;
  error: unknown;
};

type RecentProductRow = {
  id: string;
  name: string;
  status: ProductStatus;
  created_at: string;
};

function getSafeCount(result: CountResult) {
  return result.error ? 0 : (result.count ?? 0);
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const access = await getAdminAccess();

  if (access.status === "unauthenticated") redirect("/admin/login");
  if (access.status === "denied") redirect("/admin/access-denied");

  const supabase = await createClient();

  const [
    totalProductsResult,
    publishedProductsResult,
    draftProductsResult,
    categoriesResult,
    brandsResult,
    merchantsResult,
    activeOffersResult,
    recentProductsResult,
  ] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("status", "draft"),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("brands").select("id", { count: "exact", head: true }),
    supabase.from("merchants").select("id", { count: "exact", head: true }),
    supabase
      .from("product_offers")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("products")
      .select("id, name, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5)
      .returns<RecentProductRow[]>(),
  ]);

  const results = [
    totalProductsResult,
    publishedProductsResult,
    draftProductsResult,
    categoriesResult,
    brandsResult,
    merchantsResult,
    activeOffersResult,
    recentProductsResult,
  ];

  return {
    counts: {
      totalProducts: getSafeCount(totalProductsResult),
      publishedProducts: getSafeCount(publishedProductsResult),
      draftProducts: getSafeCount(draftProductsResult),
      categories: getSafeCount(categoriesResult),
      brands: getSafeCount(brandsResult),
      merchants: getSafeCount(merchantsResult),
      activeOffers: getSafeCount(activeOffersResult),
    },
    recentProducts: recentProductsResult.error
      ? []
      : (recentProductsResult.data ?? []).map((product) => ({
          id: product.id,
          name: product.name,
          status: product.status,
          createdAt: product.created_at,
        })),
    hasError: results.some((result) => Boolean(result.error)),
  };
}
