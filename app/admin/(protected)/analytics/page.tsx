import type { Metadata } from "next";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { getAdminAnalytics, type AnalyticsRanking } from "@/lib/data/admin-analytics";

export const metadata: Metadata = { title: "Affiliate analytics | HypeBuzz Admin" };

const dateFormatter = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });

function RankingTable({ heading, rows }: { heading: string; rows: AnalyticsRanking[] }) {
  return (
    <section aria-labelledby={`${heading.toLowerCase().replaceAll(" ", "-")}-heading`} className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
      <h2 className="text-xl font-bold text-[#111827]" id={`${heading.toLowerCase().replaceAll(" ", "-")}-heading`}>{heading}</h2>
      {rows.length ? <ol className="mt-4 divide-y divide-[#E5E7EB]">{rows.map((row, index) => <li className="flex items-center gap-3 py-3" key={row.id ?? `${row.name}-${index}`}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-sm font-bold text-[#1D4ED8]">{index + 1}</span><span className="min-w-0 flex-1 truncate font-medium text-[#111827]">{row.name}</span><span className="font-bold tabular-nums text-[#111827]">{row.clicks.toLocaleString("en-IN")}</span></li>)}</ol> : <p className="mt-4 text-sm text-[#6B7280]">No affiliate clicks recorded yet.</p>}
    </section>
  );
}

export default async function AdminAnalyticsPage() {
  const analytics = await getAdminAnalytics();
  return (
    <div>
      <header><p className="text-sm font-semibold text-[#2563EB]">Affiliate performance</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">Click analytics</h1><p className="mt-3 max-w-2xl text-base leading-7 text-[#6B7280]">Monitor outbound offer clicks without storing raw IP addresses or shopper identities.</p></header>
      {analytics.hasError ? <div className="mt-6 rounded-[10px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#991B1B]" role="alert">Some click analytics could not be loaded. Apply migration 012 and verify the admin read policy, then try again.</div> : null}
      <section aria-labelledby="click-summary-heading" className="mt-8"><h2 className="sr-only" id="click-summary-heading">Click summary</h2><div className="grid gap-4 sm:grid-cols-3"><AdminStatCard description="All recorded affiliate offer clicks." icon="analytics" label="Total clicks" value={analytics.totalClicks} /><AdminStatCard description="Clicks recorded since the start of today." icon="analytics" label="Clicks today" value={analytics.clicksToday} /><AdminStatCard description="Clicks recorded during the last seven days." icon="analytics" label="Last 7 days" value={analytics.clicksLast7Days} /></div></section>
      <div className="mt-8 grid gap-6 lg:grid-cols-2"><RankingTable heading="Top products" rows={analytics.topProducts} /><RankingTable heading="Top merchants" rows={analytics.topMerchants} /></div>
      <section aria-labelledby="recent-clicks-heading" className="mt-8"><div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-sm font-semibold text-[#2563EB]">Latest activity</p><h2 className="mt-1 text-2xl font-bold text-[#111827]" id="recent-clicks-heading">Recent clicks</h2></div><p className="text-sm text-[#6B7280]">Latest {analytics.recentClicks.length} of 20</p></div>
        {analytics.recentClicks.length ? <div className="overflow-x-auto rounded-2xl border border-[#E5E7EB] bg-white"><table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm"><thead className="bg-[#F8FAFC] text-[#4B5563]"><tr><th className="px-4 py-3 font-semibold" scope="col">Time</th><th className="px-4 py-3 font-semibold" scope="col">Product</th><th className="px-4 py-3 font-semibold" scope="col">Merchant</th><th className="px-4 py-3 font-semibold" scope="col">Device</th><th className="px-4 py-3 font-semibold" scope="col">Source page</th></tr></thead><tbody className="divide-y divide-[#E5E7EB]">{analytics.recentClicks.map((click) => <tr key={click.id}><td className="whitespace-nowrap px-4 py-3 text-[#6B7280]"><time dateTime={click.clickedAt}>{dateFormatter.format(new Date(click.clickedAt))}</time></td><td className="px-4 py-3 font-medium text-[#111827]">{click.productName}</td><td className="px-4 py-3 text-[#374151]">{click.merchantName}</td><td className="px-4 py-3 capitalize text-[#374151]">{click.deviceType}</td><td className="max-w-64 truncate px-4 py-3 text-[#6B7280]">{click.sourcePage ?? "External or unavailable"}</td></tr>)}</tbody></table></div> : <div className="rounded-2xl border border-[#E5E7EB] bg-white"><AdminEmptyState description="Clicks will appear after shoppers use tracked Buy now buttons." title="No affiliate clicks yet" /></div>}
      </section>
    </div>
  );
}
