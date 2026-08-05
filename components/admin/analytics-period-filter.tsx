"use client";

import { useState } from "react";
import type { AnalyticsDateRange, AnalyticsPreset } from "@/lib/analytics/date-range";

export function AnalyticsPeriodFilter({ range, preserved = {} }: { range: AnalyticsDateRange; preserved?: Record<string, string> }) {
  const [preset, setPreset] = useState<AnalyticsPreset>(range.preset);
  const inputClass = "mt-1 block min-h-11 w-full rounded-[9px] border border-[#D1D5DB] bg-white px-3 text-sm font-normal text-[#111827]";
  return (
    <form className="mt-6 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)] sm:p-5" method="get">
      {Object.entries(preserved).map(([name, value]) => <input key={name} name={name} type="hidden" value={value} />)}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <label className="text-sm font-semibold text-[#374151]" htmlFor="analytics-range">Period<select className={inputClass} id="analytics-range" name="range" onChange={(event) => setPreset(event.target.value as AnalyticsPreset)} value={preset}><option value="today">Today</option><option value="1d">Last 1 day</option><option value="3d">Last 3 days</option><option value="7d">Last 7 days</option><option value="10d">Last 10 days</option><option value="30d">Last 30 days</option><option value="all">All time</option><option value="custom">Custom range</option></select></label>
        {preset === "custom" ? <><label className="text-sm font-semibold text-[#374151]" htmlFor="analytics-from">From<input className={inputClass} defaultValue={range.from} id="analytics-from" name="from" required type="date" /></label><label className="text-sm font-semibold text-[#374151]" htmlFor="analytics-to">To<input className={inputClass} defaultValue={range.to} id="analytics-to" name="to" required type="date" /></label></> : null}
        <button className="min-h-11 rounded-[9px] bg-[#2563EB] px-5 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" type="submit">Apply</button>
      </div>
      <p className="mt-3 text-sm text-[#6B7280]"><span className="font-semibold text-[#374151]">Showing data:</span> {range.label}</p>
    </form>
  );
}
