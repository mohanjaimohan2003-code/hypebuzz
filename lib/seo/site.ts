export const siteName = "HypeBuzz";
export const siteTitle = "Buy Smarter. Every Time. | HypeBuzz";
export const siteDescription =
  "Discover trending products, explore genuine deals, and make smarter shopping decisions with HypeBuzz.";

const productionSiteUrl = "https://hypebuzz.in";

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  try {
    return new URL(configured || productionSiteUrl);
  } catch {
    return new URL(productionSiteUrl);
  }
}

export function absoluteUrl(pathname: string) {
  return new URL(pathname, getSiteUrl()).toString();
}

export function jsonLd(value: unknown) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}
