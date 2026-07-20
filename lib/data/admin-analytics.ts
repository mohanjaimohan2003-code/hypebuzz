import "server-only";

import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export type AnalyticsRanking = { id: string | null; name: string; clicks: number };
export type RecentAffiliateClick = {
  id: string;
  clickedAt: string;
  deviceType: string;
  sourcePage: string | null;
  productName: string;
  merchantName: string;
};
export type AdminAnalyticsData = {
  totalClicks: number;
  clicksToday: number;
  clicksLast7Days: number;
  topProducts: AnalyticsRanking[];
  topMerchants: AnalyticsRanking[];
  recentClicks: RecentAffiliateClick[];
  hasError: boolean;
};

type SummaryRow = {
  total_clicks?: number;
  clicks_today?: number;
  clicks_last_7_days?: number;
  top_products?: Array<{ product_id: string | null; product_name: string; click_count: number }>;
  top_merchants?: Array<{ merchant_id: string | null; merchant_name: string; click_count: number }>;
};

type RecentRow = {
  id: string;
  clicked_at: string;
  device_type: string | null;
  source_page: string | null;
  product: { name: string } | null;
  merchant: { name: string } | null;
};

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getAdminAnalytics(): Promise<AdminAnalyticsData> {
  const access = await getAdminAccess();
  if (access.status === "unauthenticated") redirect("/admin/login");
  if (access.status === "denied") redirect("/admin/access-denied");

  const supabase = await createClient();
  const [summaryResult, recentResult] = await Promise.all([
    supabase.rpc("get_affiliate_click_summary"),
    supabase
      .from("affiliate_clicks")
      .select("id, clicked_at, device_type, source_page, product:products(name), merchant:merchants(name)")
      .order("clicked_at", { ascending: false })
      .limit(20),
  ]);

  const summary = summaryResult.error || !summaryResult.data
    ? {}
    : summaryResult.data as SummaryRow;
  const recent = recentResult.error ? [] : recentResult.data as unknown as RecentRow[];

  return {
    totalClicks: numberValue(summary.total_clicks),
    clicksToday: numberValue(summary.clicks_today),
    clicksLast7Days: numberValue(summary.clicks_last_7_days),
    topProducts: (summary.top_products ?? []).map((item) => ({ id: item.product_id, name: item.product_name, clicks: numberValue(item.click_count) })),
    topMerchants: (summary.top_merchants ?? []).map((item) => ({ id: item.merchant_id, name: item.merchant_name, clicks: numberValue(item.click_count) })),
    recentClicks: recent.map((click) => ({
      id: click.id,
      clickedAt: click.clicked_at,
      deviceType: click.device_type ?? "unknown",
      sourcePage: click.source_page,
      productName: click.product?.name ?? "Deleted product",
      merchantName: click.merchant?.name ?? "Deleted merchant",
    })),
    hasError: Boolean(summaryResult.error || recentResult.error),
  };
}
