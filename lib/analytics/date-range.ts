export type AnalyticsPreset = "today" | "1d" | "3d" | "7d" | "10d" | "30d" | "all" | "custom";

export type AnalyticsDateRange = {
  preset: AnalyticsPreset;
  start: string | null;
  end: string | null;
  label: string;
  from: string;
  to: string;
  error: string | null;
  comparisonStart: string | null;
  comparisonEnd: string | null;
  calendarDays: number | null;
  granularity: "hour" | "day" | "week";
};

export type AnalyticsRangeQuery = {
  range?: string | string[];
  from?: string | string[];
  to?: string | string[];
};

const indiaOffset = "+05:30";
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const presetDays: Partial<Record<AnalyticsPreset, number>> = { "1d": 1, "3d": 3, "7d": 7, "10d": 10, "30d": 30 };

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function validDate(value: string) {
  if (!datePattern.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

function nextDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day + 1));
  return parsed.toISOString().slice(0, 10);
}

function shiftDate(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day + days));
  return parsed.toISOString().slice(0, 10);
}

function indiaDate(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${read("year")}-${read("month")}-${read("day")}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(new Date(`${value}T00:00:00${indiaOffset}`));
}

export function parseAnalyticsDateRange(query: AnalyticsRangeQuery, now = new Date()): AnalyticsDateRange {
  const requested = one(query.range) ?? (query.from || query.to ? "custom" : "30d");
  const preset: AnalyticsPreset = ["today", "1d", "3d", "7d", "10d", "30d", "all", "custom"].includes(requested) ? requested as AnalyticsPreset : "30d";
  const current = now.toISOString();

  if (preset === "all") return { preset, start: null, end: null, label: "All recorded activity", from: "", to: "", error: null, comparisonStart: null, comparisonEnd: null, calendarDays: null, granularity: "week" };
  if (preset === "today") {
    const date = indiaDate(now);
    const start = `${date}T00:00:00${indiaOffset}`;
    const duration = now.getTime() - Date.parse(start);
    return { preset, start, end: current, label: `Today · ${formatDate(date)}`, from: "", to: "", error: null, comparisonStart: new Date(Date.parse(start) - duration).toISOString(), comparisonEnd: start, calendarDays: 1, granularity: "hour" };
  }
  if (preset === "custom") {
    const from = one(query.from) ?? "";
    const to = one(query.to) ?? "";
    let error: string | null = null;
    if (!from || !to) error = "Choose both From and To dates.";
    else if (!validDate(from) || !validDate(to)) error = "Enter valid dates in YYYY-MM-DD format.";
    else if (from > to) error = "From date must be on or before To date.";
    if (error) return { preset, start: current, end: current, label: "Invalid custom range", from, to, error, comparisonStart: current, comparisonEnd: current, calendarDays: 0, granularity: "day" };
    const start = `${from}T00:00:00${indiaOffset}`;
    const end = `${nextDate(to)}T00:00:00${indiaOffset}`;
    const days = Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000);
    const duration = Date.parse(end) - Date.parse(start);
    return {
      preset,
      start,
      end,
      label: `${formatDate(from)} – ${formatDate(to)}`,
      from,
      to,
      error: null,
      comparisonStart: new Date(Date.parse(start) - duration).toISOString(),
      comparisonEnd: start,
      calendarDays: days,
      granularity: days <= 2 ? "hour" : days > 90 ? "week" : "day",
    };
  }

  const days = presetDays[preset] ?? 30;
  const today = indiaDate(now);
  const start = `${shiftDate(today, -(days - 1))}T00:00:00${indiaOffset}`;
  const duration = now.getTime() - Date.parse(start);
  return {
    preset,
    start,
    end: current,
    label: `Last ${days} calendar ${days === 1 ? "day" : "days"}`,
    from: "",
    to: "",
    error: null,
    comparisonStart: new Date(Date.parse(start) - duration).toISOString(),
    comparisonEnd: start,
    calendarDays: days,
    granularity: days <= 2 ? "hour" : "day",
  };
}
