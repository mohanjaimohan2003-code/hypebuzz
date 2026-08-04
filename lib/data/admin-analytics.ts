import "server-only";

import { redirect } from "next/navigation";
import type { AnalyticsDateRange } from "@/lib/analytics/date-range";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export type AnalyticsRanking = { id: string | null; name: string; clicks: number; share: number };
export type ProductRanking = AnalyticsRanking & { category: string };
export type TrendPoint = { label: string; clicks: number };
export type Breakdown = { name: string; clicks: number; share: number };
export type AnalyticsQueryError = { section: "dashboard" | "recent"; code: string; message: string; details: string | null; hint: string | null };
export type RecentAffiliateClick = { id: string; clickedAt: string; deviceType: string; sourcePage: string | null; productName: string; merchantName: string };

export type AdminAnalyticsData = {
  totalClicks: number;
  previousTotalClicks: number | null;
  changePercent: number | null;
  activeProducts: number;
  activeMerchants: number;
  averageClicksPerDay: number;
  topProducts: ProductRanking[];
  topMerchants: AnalyticsRanking[];
  topCategories: AnalyticsRanking[];
  devices: Breakdown[];
  sources: Breakdown[];
  trend: TrendPoint[];
  recentClicks: RecentAffiliateClick[];
  errors: AnalyticsQueryError[];
};

type DashboardRow = {
  total_clicks?: number; previous_total_clicks?: number; active_products?: number; active_merchants?: number; represented_days?: number;
  top_products?: Array<{ product_id: string | null; product_name: string; category_name: string; click_count: number }>;
  top_merchants?: Array<{ merchant_id: string | null; merchant_name: string; click_count: number }>;
  top_categories?: Array<{ category_id: string | null; category_name: string; click_count: number }>;
  devices?: Array<{ device_name: string; click_count: number }>;
  sources?: Array<{ source_name: string; click_count: number }>;
  trend?: Array<{ bucket_label: string; click_count: number }>;
};

type RecentRow = { id: string; clicked_at: string; device_type: string | null; source_page: string | null; product: { name: string } | null; merchant: { name: string } | null };

function numberValue(value: unknown) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
function share(clicks: number, total: number) { return total > 0 ? Number(((clicks / total) * 100).toFixed(1)) : 0; }

function queryError(section: AnalyticsQueryError["section"], error: { code?: string; message?: string; details?: string | null; hint?: string | null } | null): AnalyticsQueryError | null {
  if (!error) return null;
  const result = { section, code: error.code ?? "unknown", message: error.message ?? "Unknown analytics query error", details: error.details ?? null, hint: error.hint ?? null };
  console.error("Admin analytics query failed", result);
  return result;
}

export async function getAdminAnalytics(range: AnalyticsDateRange): Promise<AdminAnalyticsData> {
  const access = await getAdminAccess();
  if (access.status === "unauthenticated") redirect("/admin/login");
  if (access.status === "denied") redirect("/admin/access-denied");

  const supabase = await createClient();
  let recentQuery = supabase.from("affiliate_clicks")
    .select("id, clicked_at, device_type, source_page, product:products(name), merchant:merchants(name)")
    .order("clicked_at", { ascending: false }).limit(20);
  if (range.start) recentQuery = recentQuery.gte("clicked_at", range.start);
  if (range.end) recentQuery = recentQuery.lt("clicked_at", range.end);

  const [dashboardResult, recentResult] = await Promise.all([
    supabase.rpc("get_admin_analytics_dashboard", {
      p_start_at: range.start, p_end_at: range.end,
      p_previous_start_at: range.comparisonStart, p_previous_end_at: range.comparisonEnd,
      p_bucket: range.granularity,
    }),
    recentQuery,
  ]);
  const dashboard = dashboardResult.error || !dashboardResult.data ? {} : dashboardResult.data as DashboardRow;
  const total = numberValue(dashboard.total_clicks);
  const previous = range.comparisonStart ? numberValue(dashboard.previous_total_clicks) : null;
  const representedDays = range.calendarDays ?? Math.max(1, numberValue(dashboard.represented_days));
  const ranking = (id: string | null, name: string, clicks: unknown): AnalyticsRanking => {
    const count = numberValue(clicks); return { id, name, clicks: count, share: share(count, total) };
  };

  return {
    totalClicks: total,
    previousTotalClicks: previous,
    changePercent: previous === null || previous === 0 ? null : Number((((total - previous) / previous) * 100).toFixed(1)),
    activeProducts: numberValue(dashboard.active_products),
    activeMerchants: numberValue(dashboard.active_merchants),
    averageClicksPerDay: representedDays > 0 ? Number((total / representedDays).toFixed(1)) : 0,
    topProducts: (dashboard.top_products ?? []).map((item) => ({ ...ranking(item.product_id, item.product_name, item.click_count), category: item.category_name })),
    topMerchants: (dashboard.top_merchants ?? []).map((item) => ranking(item.merchant_id, item.merchant_name, item.click_count)),
    topCategories: (dashboard.top_categories ?? []).map((item) => ranking(item.category_id, item.category_name, item.click_count)),
    devices: (dashboard.devices ?? []).map((item) => ({ name: item.device_name, clicks: numberValue(item.click_count), share: share(numberValue(item.click_count), total) })),
    sources: (dashboard.sources ?? []).map((item) => ({ name: item.source_name, clicks: numberValue(item.click_count), share: share(numberValue(item.click_count), total) })),
    trend: (dashboard.trend ?? []).map((item) => ({ label: item.bucket_label, clicks: numberValue(item.click_count) })),
    recentClicks: (recentResult.error ? [] : recentResult.data as unknown as RecentRow[]).map((click) => ({ id: click.id, clickedAt: click.clicked_at, deviceType: click.device_type ?? "unknown", sourcePage: click.source_page, productName: click.product?.name ?? "Unknown product", merchantName: click.merchant?.name ?? "Unknown merchant" })),
    errors: [queryError("dashboard", dashboardResult.error), queryError("recent", recentResult.error)].filter((error): error is AnalyticsQueryError => Boolean(error)),
  };
}
