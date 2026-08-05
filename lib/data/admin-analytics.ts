import "server-only";

import { redirect } from "next/navigation";
import type { AnalyticsDateRange, AnalyticsSectionKey, AnalyticsSectionRanges } from "@/lib/analytics/date-range";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export type AnalyticsRanking = { id: string | null; name: string; clicks: number; share: number };
export type ProductRanking = AnalyticsRanking & { category: string };
export type TrendPoint = { label: string; clicks: number };
export type Breakdown = { name: string; clicks: number; share: number };
export type AnalyticsQueryError = { section: "dashboard" | "recent" | AnalyticsSectionKey; code: string; message: string; details: string | null; hint: string | null };
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
  sectionTotals?: Record<AnalyticsSectionKey, number>;
  insightBasis?: { totalClicks: number; changePercent: number | null; topProducts: ProductRanking[]; topMerchants: AnalyticsRanking[]; topCategories: AnalyticsRanking[]; devices: Breakdown[]; sources: Breakdown[]; trend: TrendPoint[] };
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

async function dashboardFor(supabase: Awaited<ReturnType<typeof createClient>>, range: AnalyticsDateRange) {
  return supabase.rpc("get_admin_analytics_dashboard", {
    p_start_at: range.start, p_end_at: range.end,
    p_previous_start_at: range.comparisonStart, p_previous_end_at: range.comparisonEnd,
    p_bucket: range.granularity,
  });
}

export async function getAdminAnalytics(range: AnalyticsDateRange, sectionRanges: AnalyticsSectionRanges): Promise<AdminAnalyticsData> {
  const access = await getAdminAccess();
  if (access.status === "unauthenticated") redirect("/admin/login");
  if (access.status === "denied") redirect("/admin/access-denied");

  const supabase = await createClient();
  const recentRange = sectionRanges.recent;
  let recentQuery = supabase.from("affiliate_clicks")
    .select("id, clicked_at, device_type, source_page, product:products(name), merchant:merchants(name)")
    .order("clicked_at", { ascending: false }).limit(20);
  if (recentRange.start) recentQuery = recentQuery.gte("clicked_at", recentRange.start);
  if (recentRange.end) recentQuery = recentQuery.lt("clicked_at", recentRange.end);

  const unique = new Map<string, { range: AnalyticsDateRange; keys: AnalyticsSectionKey[] }>();
  for (const [key, sectionRange] of Object.entries(sectionRanges) as [AnalyticsSectionKey, AnalyticsDateRange][]) {
    if (key === "recent") continue;
    const signature = [sectionRange.start, sectionRange.end, sectionRange.comparisonStart, sectionRange.granularity].join("|");
    const existing = unique.get(signature);
    if (existing) existing.keys.push(key); else unique.set(signature, { range: sectionRange, keys: [key] });
  }
  const requests = [...unique.values()];
  const [globalResult, recentResult, ...dashboardResults] = await Promise.all([dashboardFor(supabase, range), recentQuery, ...requests.map((request) => dashboardFor(supabase, request.range))]);
  const bySection = {} as Record<Exclude<AnalyticsSectionKey, "recent">, DashboardRow>;
  const errors: AnalyticsQueryError[] = [];
  requests.forEach((request, index) => {
    const result = dashboardResults[index];
    for (const key of request.keys) {
      bySection[key as Exclude<AnalyticsSectionKey, "recent">] = result.error || !result.data ? {} : result.data as DashboardRow;
      const error = queryError(key, result.error); if (error) errors.push(error);
    }
  });
  const dashboard = globalResult.error || !globalResult.data ? {} : globalResult.data as DashboardRow;
  const globalError = queryError("dashboard", globalResult.error); if (globalError) errors.push(globalError);
  const total = numberValue(dashboard.total_clicks);
  const previous = range.comparisonStart ? numberValue(dashboard.previous_total_clicks) : null;
  const representedDays = range.calendarDays ?? Math.max(1, numberValue(dashboard.represented_days));
  const ranking = (id: string | null, name: string, clicks: unknown): AnalyticsRanking => {
    const count = numberValue(clicks); return { id, name, clicks: count, share: share(count, total) };
  };
  const insightDashboard = bySection.insights;
  const insightTotal = numberValue(insightDashboard.total_clicks);
  const insightRank = (id: string | null, name: string, clicks: unknown) => ({ id, name, clicks: numberValue(clicks), share: share(numberValue(clicks), insightTotal) });
  const insightPrevious = numberValue(insightDashboard.previous_total_clicks);

  return {
    totalClicks: total,
    previousTotalClicks: previous,
    changePercent: previous === null || previous === 0 ? null : Number((((total - previous) / previous) * 100).toFixed(1)),
    activeProducts: numberValue(dashboard.active_products),
    activeMerchants: numberValue(dashboard.active_merchants),
    averageClicksPerDay: representedDays > 0 ? Number((total / representedDays).toFixed(1)) : 0,
    topProducts: (bySection.products.top_products ?? []).map((item) => ({ ...ranking(item.product_id, item.product_name, item.click_count), share: share(numberValue(item.click_count), numberValue(bySection.products.total_clicks)), category: item.category_name })),
    topMerchants: (bySection.merchants.top_merchants ?? []).map((item) => ({ ...ranking(item.merchant_id, item.merchant_name, item.click_count), share: share(numberValue(item.click_count), numberValue(bySection.merchants.total_clicks)) })),
    topCategories: (bySection.categories.top_categories ?? []).map((item) => ({ ...ranking(item.category_id, item.category_name, item.click_count), share: share(numberValue(item.click_count), numberValue(bySection.categories.total_clicks)) })),
    devices: (bySection.devices.devices ?? []).map((item) => ({ name: item.device_name, clicks: numberValue(item.click_count), share: share(numberValue(item.click_count), numberValue(bySection.devices.total_clicks)) })),
    sources: (bySection.sources.sources ?? []).map((item) => ({ name: item.source_name, clicks: numberValue(item.click_count), share: share(numberValue(item.click_count), numberValue(bySection.sources.total_clicks)) })),
    trend: (bySection.trend.trend ?? []).map((item) => ({ label: item.bucket_label, clicks: numberValue(item.click_count) })),
    recentClicks: (recentResult.error ? [] : recentResult.data as unknown as RecentRow[]).map((click) => ({ id: click.id, clickedAt: click.clicked_at, deviceType: click.device_type ?? "unknown", sourcePage: click.source_page, productName: click.product?.name ?? "Unknown product", merchantName: click.merchant?.name ?? "Unknown merchant" })),
    errors: [...errors, queryError("recent", recentResult.error)].filter((error): error is AnalyticsQueryError => Boolean(error)),
    sectionTotals: Object.fromEntries(Object.entries(sectionRanges).map(([key]) => [key, key === "recent" ? (recentResult.error ? 0 : recentResult.data.length) : numberValue(bySection[key as Exclude<AnalyticsSectionKey, "recent">]?.total_clicks)])) as Record<AnalyticsSectionKey, number>,
    insightBasis: {
      totalClicks: insightTotal,
      changePercent: sectionRanges.insights.comparisonStart && insightPrevious > 0 ? Number((((insightTotal - insightPrevious) / insightPrevious) * 100).toFixed(1)) : null,
      topProducts: (insightDashboard.top_products ?? []).map((item) => ({ ...insightRank(item.product_id, item.product_name, item.click_count), category: item.category_name })),
      topMerchants: (insightDashboard.top_merchants ?? []).map((item) => insightRank(item.merchant_id, item.merchant_name, item.click_count)),
      topCategories: (insightDashboard.top_categories ?? []).map((item) => insightRank(item.category_id, item.category_name, item.click_count)),
      devices: (insightDashboard.devices ?? []).map((item) => ({ name: item.device_name, clicks: numberValue(item.click_count), share: share(numberValue(item.click_count), insightTotal) })),
      sources: (insightDashboard.sources ?? []).map((item) => ({ name: item.source_name, clicks: numberValue(item.click_count), share: share(numberValue(item.click_count), insightTotal) })),
      trend: (insightDashboard.trend ?? []).map((item) => ({ label: item.bucket_label, clicks: numberValue(item.click_count) })),
    },
  };
}
