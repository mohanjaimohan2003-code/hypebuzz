import type { Metadata } from "next";
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";
import { AnalyticsPeriodFilter } from "@/components/admin/analytics-period-filter";
import { parseAnalyticsDateRange } from "@/lib/analytics/date-range";
import { getAdminAnalytics } from "@/lib/data/admin-analytics";

export const metadata: Metadata = { title: "Analytics | HypeBuzz Admin" };

export default async function AdminAnalyticsPage({ searchParams }: PageProps<"/admin/analytics">) {
  const range = parseAnalyticsDateRange(await searchParams);
  const analytics = await getAdminAnalytics(range);
  return <div><header><p className="text-sm font-semibold text-[#2563EB]">Performance overview</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">Analytics</h1><p className="mt-3 max-w-2xl text-base leading-7 text-[#6B7280]">Track performance and make data-driven decisions.</p></header><AnalyticsPeriodFilter range={range}/>{range.error ? <div className="mt-4 rounded-[10px] border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-sm font-medium text-[#92400E]" role="alert">{range.error} No analytics were queried outside the invalid range.</div> : null}{analytics.errors.length ? <div className="mt-4 rounded-[10px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#991B1B]" role="alert">Some analytics could not be loaded for this period. Failed sections: {analytics.errors.map((error) => error.section).join(", ")}. Check the server log for the exact Supabase error.</div> : null}<AnalyticsDashboard analytics={analytics} range={range}/></div>;
}
