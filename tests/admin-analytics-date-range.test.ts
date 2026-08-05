import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parseAnalyticsDateRange, parseAnalyticsSectionRanges } from "../lib/analytics/date-range";
import { buildAnalyticsInsights } from "../lib/analytics/insights";
import type { AdminAnalyticsData } from "../lib/data/admin-analytics";

const now = new Date("2026-08-04T12:00:00.000Z");

test("preset ranges use India calendar-day boundaries", () => {
  for (const [preset, days] of [["1d", 1], ["3d", 3], ["7d", 7], ["10d", 10], ["30d", 30]] as const) {
    const range = parseAnalyticsDateRange({ range: preset }, now);
    assert.equal(range.end, now.toISOString());
    assert.equal(range.start, `${new Date(Date.UTC(2026, 7, 4 - (days - 1))).toISOString().slice(0, 10)}T00:00:00+05:30`);
    assert.equal(range.calendarDays, days);
    assert.equal(range.error, null);
  }
});

test("today begins at midnight in Asia/Kolkata", () => {
  const range = parseAnalyticsDateRange({ range: "today" }, now);
  assert.equal(range.start, "2026-08-04T00:00:00+05:30");
  assert.equal(range.end, now.toISOString());
});

test("all time has no database bounds", () => {
  const range = parseAnalyticsDateRange({ range: "all" }, now);
  assert.equal(range.start, null);
  assert.equal(range.end, null);
});

test("custom range includes the complete end date in Asia/Kolkata", () => {
  const range = parseAnalyticsDateRange({ range: "custom", from: "2026-08-01", to: "2026-08-04" }, now);
  assert.equal(range.start, "2026-08-01T00:00:00+05:30");
  assert.equal(range.end, "2026-08-05T00:00:00+05:30");
  const single = parseAnalyticsDateRange({ range: "custom", from: "2026-08-04", to: "2026-08-04" }, now);
  assert.equal(single.start, "2026-08-04T00:00:00+05:30");
  assert.equal(single.end, "2026-08-05T00:00:00+05:30");
});

test("invalid custom ranges return a safe empty interval and validation message", () => {
  for (const query of [
    { range: "custom" },
    { range: "custom", from: "not-a-date", to: "2026-08-04" },
    { range: "custom", from: "2026-08-05", to: "2026-08-04" },
  ]) {
    const range = parseAnalyticsDateRange(query, now);
    assert.ok(range.error);
    assert.equal(range.start, now.toISOString());
    assert.equal(range.end, now.toISOString());
  }
});

test("analytics queries use normalized server-side bounds", () => {
  const data = readFileSync("lib/data/admin-analytics.ts", "utf8");
  assert.match(data, /get_admin_analytics_dashboard[\s\S]*p_start_at: range\.start, p_end_at: range\.end/);
  assert.match(data, /p_previous_start_at: range\.comparisonStart, p_previous_end_at: range\.comparisonEnd/);
  assert.match(data, /gte\("clicked_at", recentRange\.start\)/);
  assert.match(data, /lt\("clicked_at", recentRange\.end\)/);
  const filter = readFileSync("components/admin/analytics-period-filter.tsx", "utf8");
  assert.equal((filter.match(/<form/g) ?? []).length, 1);
  const dashboard = readFileSync("components/admin/analytics-dashboard.tsx", "utf8");
  assert.doesNotMatch(dashboard, /fetch\(/);
});

test("local section ranges override only their section and support custom dates", () => {
  const global = parseAnalyticsDateRange({ range: "30d" }, now);
  const { ranges, overrides } = parseAnalyticsSectionRanges({
    range: "30d", productsRange: "7d", categoriesRange: "10d", devicesRange: "custom", devicesFrom: "2026-08-01", devicesTo: "2026-08-03",
  }, global, now);
  assert.equal(ranges.products.preset, "7d");
  assert.equal(ranges.categories.preset, "10d");
  assert.equal(ranges.devices.start, "2026-08-01T00:00:00+05:30");
  assert.equal(ranges.devices.end, "2026-08-04T00:00:00+05:30");
  assert.equal(ranges.merchants, global);
  assert.equal(overrides.merchants, undefined);
});

test("invalid local custom dates are safe empty ranges", () => {
  const global = parseAnalyticsDateRange({ range: "30d" }, now);
  const { ranges } = parseAnalyticsSectionRanges({ productsRange: "custom", productsFrom: "2026-08-05", productsTo: "2026-08-01" }, global, now);
  assert.ok(ranges.products.error);
  assert.equal(ranges.products.start, ranges.products.end);
});

test("full dashboard migration remains admin-only and aggregates supported dimensions", () => {
  const migration = readFileSync("supabase/migrations/034_full_admin_analytics_dashboard.sql", "utf8");
  assert.match(migration, /security invoker/i);
  assert.match(migration, /Active admin access required/);
  assert.match(migration, /revoke all[\s\S]*from public, anon/i);
  assert.match(migration, /grant execute[\s\S]*to authenticated/i);
  for (const metric of ["top_products", "top_merchants", "top_categories", "devices", "sources", "trend"]) assert.match(migration, new RegExp(`'${metric}'`));
});

test("insights are deterministic and disappear for zero data", () => {
  const data: AdminAnalyticsData = {
    totalClicks: 10, previousTotalClicks: 5, changePercent: 100, activeProducts: 1, activeMerchants: 1, averageClicksPerDay: 2,
    topProducts: [{ id: "p", name: "Real product", category: "Fashion", clicks: 8, share: 80 }],
    topMerchants: [{ id: "m", name: "Real merchant", clicks: 9, share: 90 }],
    topCategories: [{ id: "c", name: "Fashion", clicks: 8, share: 80 }],
    devices: [{ name: "Mobile", clicks: 7, share: 70 }], sources: [{ name: "Internal", clicks: 10, share: 100 }], trend: [], recentClicks: [], errors: [],
  };
  const insights = buildAnalyticsInsights(data);
  assert.ok(insights.some((item) => item.title.includes("Fashion")));
  assert.ok(insights.some((item) => item.description.includes("high merchant concentration")));
  assert.ok(insights.some((item) => item.title.includes("Mobile")));
  assert.deepEqual(buildAnalyticsInsights({ ...data, totalClicks: 0 }), []);
});
