"use client";
import { useState } from "react";
import type { AnalyticsDateRange, AnalyticsPreset, AnalyticsSectionKey } from "@/lib/analytics/date-range";

export function AnalyticsSectionFilter({ sectionKey, range, overridden, preserved }: { sectionKey: AnalyticsSectionKey; range: AnalyticsDateRange; overridden: boolean; preserved: Record<string, string> }) {
  const [preset, setPreset] = useState<AnalyticsPreset | "global">(overridden ? range.preset : "global");
  const own = [`${sectionKey}Range`, `${sectionKey}From`, `${sectionKey}To`];
  return <form className="flex max-w-full flex-wrap items-end gap-2" method="get">
    {Object.entries(preserved).filter(([name]) => !own.includes(name)).map(([name, value]) => <input key={name} name={name} type="hidden" value={value} />)}
    {preset !== "global" ? <input name={`${sectionKey}Range`} type="hidden" value={preset} /> : null}
    <select aria-label={`${sectionKey} date range`} className="min-h-9 rounded-lg border border-[#D1D5DB] bg-white px-2 text-xs font-semibold text-[#374151]" onChange={(event) => setPreset(event.target.value as AnalyticsPreset | "global")} value={preset}><option value="global">Use Global</option><option value="today">Today</option><option value="1d">1 Day</option><option value="3d">3 Days</option><option value="7d">7 Days</option><option value="10d">10 Days</option><option value="30d">30 Days</option><option value="all">All Time</option><option value="custom">Custom</option></select>
    {preset === "custom" ? <><input aria-label={`${sectionKey} from`} className="min-h-9 w-32 rounded-lg border border-[#D1D5DB] px-2 text-xs" defaultValue={range.from} name={`${sectionKey}From`} required type="date"/><input aria-label={`${sectionKey} to`} className="min-h-9 w-32 rounded-lg border border-[#D1D5DB] px-2 text-xs" defaultValue={range.to} name={`${sectionKey}To`} required type="date"/></> : null}
    <button className="min-h-9 rounded-lg bg-[#111827] px-3 text-xs font-bold text-white" type="submit">Apply</button>
  </form>;
}
