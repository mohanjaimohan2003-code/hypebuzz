import type { Metadata } from "next";
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";
import { AnalyticsPeriodFilter } from "@/components/admin/analytics-period-filter";
import { analyticsSectionKeys, parseAnalyticsDateRange, parseAnalyticsSectionRanges } from "@/lib/analytics/date-range";
import { getAdminAnalytics } from "@/lib/data/admin-analytics";

export const metadata: Metadata = { title: "Analytics | HypeBuzz Admin" };

export default async function AdminAnalyticsPage({ searchParams }: PageProps<"/admin/analytics">) {
  const query = await searchParams;
  const range = parseAnalyticsDateRange(query);
  const { ranges, overrides } = parseAnalyticsSectionRanges(query, range);
  const analytics = await getAdminAnalytics(range, ranges);
  const preserved = Object.fromEntries(Object.entries(query).flatMap(([key, value]) => typeof value === "string" ? [[key, value]] : []));
  const localParams = Object.fromEntries(Object.entries(preserved).filter(([key]) => analyticsSectionKeys.some((section) => key.startsWith(section))));
  const rangeErrors = Object.entries(overrides).filter(([, value]) => value?.error);
  return <div>
    <header><p className="text-sm font-semibold text-[#7C3AED]">Performance overview</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">Analytics</h1><p className="mt-3 max-w-2xl text-base leading-7 text-[#6B7280]">Real tracked outbound engagement, organized for faster business decisions.</p></header>
    <AnalyticsPeriodFilter preserved={localParams} range={range}/>
    {range.error ? <div className="mt-4 rounded-[10px] border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-sm font-medium text-[#92400E]" role="alert">{range.error} No analytics were queried outside the invalid range.</div> : null}
    {rangeErrors.length ? <div className="mt-4 rounded-[10px] border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-sm font-medium text-[#92400E]" role="alert">Invalid local range: {rangeErrors.map(([key, value]) => `${key} (${value?.error})`).join(", ")}</div> : null}
    {analytics.errors.length ? <div className="mt-4 rounded-[10px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#991B1B]" role="alert">Some analytics could not be loaded. Failed sections: {analytics.errors.map((error) => error.section).join(", ")}. Check the server log for the exact Supabase error.</div> : null}
    <AnalyticsDashboard analytics={analytics} overrides={overrides} preserved={preserved} ranges={ranges}/>
  </div>;
}
