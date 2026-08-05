import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { AnalyticsSectionFilter } from "@/components/admin/analytics-section-filter";
import type { AnalyticsDateRange, AnalyticsSectionKey, AnalyticsSectionOverrides, AnalyticsSectionRanges } from "@/lib/analytics/date-range";
import { analyticsSeries } from "@/lib/analytics/colors";
import { buildAnalyticsInsights } from "@/lib/analytics/insights";
import type { AdminAnalyticsData, AnalyticsRanking, Breakdown, ProductRanking, TrendPoint } from "@/lib/data/admin-analytics";

const number = new Intl.NumberFormat("en-IN");
const date = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
const colors = analyticsSeries;
const card = "rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_4px_18px_rgba(17,24,39,0.05)] sm:p-6";

function SectionHeading({ title, description, sectionKey, range, overridden, preserved }: { title: string; description: string; sectionKey: AnalyticsSectionKey; range: AnalyticsDateRange; overridden: boolean; preserved: Record<string, string> }) {
  return <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-lg font-bold text-[#111827] sm:text-xl">{title}</h2><p className="mt-1 text-sm leading-5 text-[#6B7280]">{description}</p><p className={`mt-1 text-xs font-semibold ${overridden ? "text-[#7C3AED]" : "text-[#64748B]"}`}>{overridden ? "Local" : "Global"}: {range.label}</p></div><AnalyticsSectionFilter overridden={overridden} preserved={preserved} range={range} sectionKey={sectionKey}/></header>;
}

function EmptyChart() { return <p className="mt-6 rounded-xl bg-[#F8FAFC] px-4 py-10 text-center text-sm text-[#6B7280]">No analytics recorded for this period.</p>; }

function ClickTrend({ points }: { points: TrendPoint[] }) {
  if (!points.length) return <EmptyChart />;
  const width = 640; const height = 240; const left = 44; const top = 18; const bottom = 42; const right = 16;
  const maximum = Math.max(...points.map((point) => point.clicks), 1);
  const x = (index: number) => left + (points.length === 1 ? (width - left - right) / 2 : index * ((width - left - right) / (points.length - 1)));
  const y = (value: number) => top + (height - top - bottom) * (1 - value / maximum);
  const line = points.map((point, index) => `${x(index)},${y(point.clicks)}`).join(" ");
  const labelIndexes = new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]);
  return <figure className="mt-5 overflow-hidden" aria-label="Clicks over time line chart"><svg className="h-auto w-full" role="img" viewBox={`0 0 ${width} ${height}`}><title>Tracked clicks over time</title>{[0, .25, .5, .75, 1].map((ratio) => <line key={ratio} stroke="#E5E7EB" x1={left} x2={width-right} y1={y(maximum * ratio)} y2={y(maximum * ratio)} />)}<polyline fill="none" points={line} stroke="#2563EB" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />{points.map((point, index) => <g key={`${point.label}-${index}`}><circle cx={x(index)} cy={y(point.clicks)} fill="white" r="4" stroke="#2563EB" strokeWidth="3"><title>{point.label}: {point.clicks} clicks</title></circle>{labelIndexes.has(index) ? <text fill="#64748B" fontSize="11" textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"} x={x(index)} y={height-14}>{point.label}</text> : null}</g>)}<text fill="#64748B" fontSize="11" textAnchor="end" x={left-8} y={y(maximum)+4}>{maximum}</text><text fill="#64748B" fontSize="11" textAnchor="end" x={left-8} y={y(0)+4}>0</text></svg></figure>;
}

function CategoryBars({ rows }: { rows: AnalyticsRanking[] }) {
  if (!rows.length) return <EmptyChart />;
  return <ol className="mt-5 space-y-4">{rows.slice(0, 6).map((row, index) => <li key={row.id ?? `category-${index}`}><div className="flex items-end justify-between gap-3 text-sm"><div className="min-w-0"><p className="truncate font-semibold text-[#111827]">#{index + 1} {row.name}</p><p className="text-xs text-[#6B7280]">{row.share}% share</p></div><p className="shrink-0 font-bold tabular-nums">{number.format(row.clicks)}</p></div><div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#F1F5F9]"><div className="h-full rounded-full" style={{ backgroundColor: colors[index % colors.length], width: `${Math.max(row.share, 2)}%` }} /></div></li>)}</ol>;
}

function Donut({ rows }: { rows: Breakdown[] }) {
  if (!rows.length) return <EmptyChart />;
  const stops = rows.map((row, index) => { const start = rows.slice(0, index).reduce((sum, item) => sum + item.share, 0); return `${colors[index % colors.length]} ${start}% ${start + row.share}%`; }).join(", ");
  return <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row xl:flex-col 2xl:flex-row"><div aria-label={rows.map((row) => `${row.name} ${row.share}%`).join(", ")} className="relative h-36 w-36 shrink-0 rounded-full" role="img" style={{ background: `conic-gradient(${stops})` }}><div className="absolute inset-7 flex items-center justify-center rounded-full bg-white text-center"><span className="text-xs font-semibold text-[#64748B]">Device<br/>share</span></div></div><ul className="w-full space-y-2">{rows.map((row, index) => <li className="flex items-center justify-between gap-3 text-sm" key={row.name}><span className="flex min-w-0 items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} /><span className="truncate text-[#4B5563]">{row.name}</span></span><span className="font-bold tabular-nums">{number.format(row.clicks)} <span className="font-normal text-[#6B7280]">({row.share}%)</span></span></li>)}</ul></div>;
}

function ProductsTable({ rows }: { rows: ProductRanking[] }) {
  if (!rows.length) return <EmptyChart />;
  return <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[34rem] text-left text-sm"><thead className="border-b border-[#E5E7EB] text-[#6B7280]"><tr><th className="py-3 pr-3">#</th><th className="px-3 py-3">Product</th><th className="px-3 py-3">Category</th><th className="py-3 pl-3 text-right">Clicks</th></tr></thead><tbody className="divide-y divide-[#E5E7EB]">{rows.map((row,index)=><tr key={row.id ?? `product-${index}`}><td className="py-3 pr-3 font-bold text-[#2563EB]">#{index+1}</td><td className="max-w-64 px-3 py-3 font-semibold text-[#111827]"><span className="line-clamp-2">{row.name}</span></td><td className="px-3 py-3 text-[#6B7280]">{row.category}</td><td className="py-3 pl-3 text-right font-bold tabular-nums">{number.format(row.clicks)}</td></tr>)}</tbody></table></div>;
}

function RankedList({ rows }: { rows: AnalyticsRanking[] }) {
  if (!rows.length) return <EmptyChart />;
  return <ol className="mt-5 divide-y divide-[#E5E7EB]">{rows.map((row,index)=><li className="flex items-center gap-3 py-3" key={row.id ?? `rank-${index}`}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-sm font-bold text-[#1D4ED8]">{index+1}</span><span className="min-w-0 flex-1 truncate font-semibold">{row.name}</span><span className="text-right"><span className="block font-bold tabular-nums">{number.format(row.clicks)}</span><span className="text-xs text-[#6B7280]">{row.share}%</span></span></li>)}</ol>;
}

function SourceList({ rows }: { rows: Breakdown[] }) {
  if (!rows.length) return <EmptyChart />;
  return <ul className="mt-5 space-y-4">{rows.map((row,index)=><li key={row.name}><div className="flex justify-between gap-3 text-sm"><span className="font-semibold">{row.name}</span><span className="font-bold tabular-nums">{number.format(row.clicks)} <span className="font-normal text-[#6B7280]">{row.share}%</span></span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E5E7EB]"><div className="h-full rounded-full" style={{ backgroundColor: colors[index % colors.length], width: `${Math.max(row.share,2)}%` }} /></div></li>)}</ul>;
}

export function AnalyticsDashboard({ analytics, ranges, overrides, preserved }: { analytics: AdminAnalyticsData; ranges: AnalyticsSectionRanges; overrides: AnalyticsSectionOverrides; preserved: Record<string, string> }) {
  const insights = buildAnalyticsInsights(analytics, analytics.insightBasis);
  const insightTotal = analytics.sectionTotals?.insights ?? analytics.insightBasis?.totalClicks ?? analytics.totalClicks;
  const heading = (sectionKey: AnalyticsSectionKey, title: string, description: string) => <SectionHeading description={description} overridden={Boolean(overrides[sectionKey])} preserved={preserved} range={ranges[sectionKey]} sectionKey={sectionKey} title={title}/>;
  return <>
    <section aria-labelledby="analytics-kpis" className="mt-8"><h2 className="sr-only" id="analytics-kpis">Analytics summary</h2><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><AdminStatCard accent="blue" change={analytics.changePercent} description="Tracked offer clicks in the global period." icon="analytics" label="Total Clicks" value={analytics.totalClicks}/><AdminStatCard accent="green" description="Distinct clicked products." icon="products" label="Active Products" value={analytics.activeProducts}/><AdminStatCard accent="purple" description="Distinct clicked merchants." icon="merchants" label="Active Merchants" value={analytics.activeMerchants}/><AdminStatCard accent="orange" description="Clicks per represented calendar day." icon="analytics" label="Avg. Clicks / Day" value={analytics.averageClicksPerDay}/></div></section>
    <div className="mt-6 grid gap-6 xl:grid-cols-12"><section className={`${card} border-t-4 border-t-[#2563EB] xl:col-span-6`}>{heading("trend", "Clicks Over Time", `Grouped by ${ranges.trend.granularity} in Asia/Kolkata.`)}<ClickTrend points={analytics.trend}/></section><section className={`${card} border-t-4 border-t-[#0F766E] xl:col-span-3`}>{heading("categories", "Top Performing Categories", "Rank, clicks and share of tracked clicks.")}<CategoryBars rows={analytics.topCategories}/></section><section className={`${card} border-t-4 border-t-[#16A34A] xl:col-span-3`}>{heading("devices", "Clicks by Device", "Inferred from the recorded user agent.")}<Donut rows={analytics.devices}/></section></div>
    <div className="mt-6 grid gap-6 xl:grid-cols-12"><section className={`${card} border-t-4 border-t-[#EA580C] xl:col-span-6`}>{heading("products", "Top Products", "Products attracting outbound engagement.")}<ProductsTable rows={analytics.topProducts}/></section><section className={`${card} border-t-4 border-t-[#7C3AED] xl:col-span-3`}>{heading("merchants", "Top Merchants", "Merchant destinations by clicks and share.")}<RankedList rows={analytics.topMerchants}/></section><section className={`${card} border-t-4 border-t-[#DB2777] xl:col-span-3`}>{heading("sources", "Clicks by Source", "Classification from stored path and referrer.")}<SourceList rows={analytics.sources}/></section></div>
    <section className={`${card} mt-6 border-t-4 border-t-[#0F766E]`} aria-labelledby="recent-clicks">{heading("recent", "Recent Clicks", `Latest ${analytics.recentClicks.length} of 20 in this period.`)}{analytics.recentClicks.length ? <div className="mt-5 overflow-x-auto"><table className="min-w-[48rem] w-full text-left text-sm"><thead className="bg-[#F8FAFC] text-[#4B5563]"><tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Product</th><th className="px-4 py-3">Merchant</th><th className="px-4 py-3">Device</th><th className="px-4 py-3">Source page</th></tr></thead><tbody className="divide-y divide-[#E5E7EB]">{analytics.recentClicks.map((click)=><tr key={click.id}><td className="whitespace-nowrap px-4 py-3 text-[#6B7280]">{date.format(new Date(click.clickedAt))}</td><td className="px-4 py-3 font-semibold">{click.productName}</td><td className="px-4 py-3">{click.merchantName}</td><td className="px-4 py-3 capitalize">{click.deviceType}</td><td className="max-w-64 truncate px-4 py-3 text-[#6B7280]">{click.sourcePage ?? "Unavailable"}</td></tr>)}</tbody></table></div> : <AdminEmptyState description="No analytics were recorded within this period." title="No clicks for this period"/>}</section>
    <section className={`${card} mt-6 border-t-4 border-t-[#CA8A04]`} aria-labelledby="analytics-insights">{heading("insights", "Insights & Recommendations", `Rule-based observations from ${number.format(insightTotal)} tracked clicks.`)}{insights.length ? <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{insights.map((insight,index)=><article className="rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-4" key={insight.title} style={{borderLeftColor: colors[index % colors.length], borderLeftWidth: 4}}><h3 className="font-bold text-[#111827]">{insight.title}</h3><p className="mt-2 text-sm leading-6 text-[#4B5563]">{insight.description}</p>{insightTotal < 20 ? <p className="mt-2 text-xs font-semibold text-[#92400E]">Limited data — treat this insight as directional.</p> : null}</article>)}</div> : <p className="mt-5 rounded-xl bg-[#F8FAFC] p-6 text-center text-sm text-[#6B7280]">No meaningful insights available for this period yet.</p>}</section>
  </>;
}
