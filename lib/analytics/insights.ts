import type { AdminAnalyticsData } from "@/lib/data/admin-analytics";

export type AnalyticsInsight = { title: string; description: string; tone: "blue" | "green" | "amber" };

export function buildAnalyticsInsights(data: AdminAnalyticsData): AnalyticsInsight[] {
  if (!data.totalClicks) return [];
  const insights: AnalyticsInsight[] = [];
  const category = data.topCategories[0];
  const product = data.topProducts[0];
  const merchant = data.topMerchants[0];
  const peak = data.trend.reduce<(typeof data.trend)[number] | null>((highest, point) => !highest || point.clicks > highest.clicks ? point : highest, null);
  const mobile = data.devices.find((item) => item.name === "Mobile");
  const external = data.sources.find((item) => !["Internal", "Direct / unavailable"].includes(item.name));
  if (category) insights.push({ title: `${category.name} is the top category`, description: `${category.name} generated ${category.share}% of tracked offer clicks. Consider reviewing whether the category has enough strong, current products.`, tone: "blue" });
  if (peak) insights.push({ title: `${peak.label} was the strongest interval`, description: `It recorded ${peak.clicks.toLocaleString("en-IN")} tracked ${peak.clicks === 1 ? "click" : "clicks"}, the highest point in the displayed trend.`, tone: "blue" });
  if (product) insights.push({ title: `${product.name} leads product engagement`, description: `It received ${product.clicks.toLocaleString("en-IN")} tracked merchant ${product.clicks === 1 ? "click" : "clicks"} in this period.`, tone: "green" });
  if (merchant) insights.push({ title: `${merchant.name} receives the most outbound clicks`, description: `${merchant.name} accounts for ${merchant.share}% of selected-period clicks.${merchant.share >= 70 ? " This indicates high merchant concentration." : ""}`, tone: merchant.share >= 70 ? "amber" : "blue" });
  if (mobile && mobile.share > 50) insights.push({ title: "Mobile is the dominant device", description: `${mobile.share}% of tracked clicks came from mobile devices. Prioritize mobile offer and product-page testing.`, tone: "green" });
  if (external) insights.push({ title: `${external.name} is the strongest recorded external source`, description: `${external.name} represents ${external.share}% of tracked clicks based on the limited referrer origin stored with outbound events.`, tone: "blue" });
  if (data.changePercent !== null) insights.push({ title: `Clicks ${data.changePercent >= 0 ? "increased" : "decreased"} ${Math.abs(data.changePercent)}%`, description: "Compared with the immediately preceding equal-duration period.", tone: data.changePercent >= 0 ? "green" : "amber" });
  return insights.slice(0, 6);
}
