export const siteName = "HypeBuzz";
export const siteTitle = "HypeBuzz | Discover Products, Compare Prices & Find Deals";
export const siteDescription =
  "Discover trending products, compare prices from trusted merchants, and find genuine deals with clear information that helps you shop smarter.";
export const siteSocialImagePath = "/brand/hypebuzz-banner-v3.png";

export const productionSiteOrigin = "https://hypebuzzshop.in";

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  try {
    const url = new URL(configured || productionSiteOrigin);
    if (url.origin !== productionSiteOrigin) return new URL(productionSiteOrigin);
    return new URL(productionSiteOrigin);
  } catch {
    return new URL(productionSiteOrigin);
  }
}

export function absoluteUrl(pathname: string) {
  return new URL(pathname, getSiteUrl()).toString();
}

export function jsonLd(value: unknown) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}
