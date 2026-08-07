export const siteName = "HypeBuzz";
export const siteTitle = "HypeBuzz | Discover Products, Compare Prices & Find Deals";
export const siteDescription =
  "Discover trending products, compare prices from trusted merchants, and find genuine deals with clear information that helps you shop smarter.";
export const siteSocialImagePath = "/brand/hypebuzz-banner-v3.png";

export const productionSiteOrigin = "https://hypebuzzshop.in";

export const socialLinks = [
  {
    label: "YouTube",
    accessibleName: "HypeBuzz on YouTube",
    href: "https://www.youtube.com/@Hypebuzzshop",
    icon: "youtube",
    includeInOrganizationSameAs: true,
  },
  {
    label: "WhatsApp",
    accessibleName: "HypeBuzz WhatsApp Channel",
    href: "https://whatsapp.com/channel/0029Vb93axxB4hdWUkpst90q",
    icon: "whatsapp",
    includeInOrganizationSameAs: false,
  },
  {
    label: "Instagram",
    accessibleName: "HypeBuzz on Instagram",
    href: "https://www.instagram.com/hypebuzzofficial?igsh=amJnbmhuc2pnMWEy",
    icon: "instagram",
    includeInOrganizationSameAs: true,
  },
  {
    label: "Facebook",
    accessibleName: "HypeBuzz on Facebook",
    href: "https://www.facebook.com/share/19EFpHhRvS/",
    icon: "facebook",
    includeInOrganizationSameAs: true,
  },
] as const;

export const organizationSameAs = socialLinks
  .filter((social) => social.includeInOrganizationSameAs)
  .map((social) => social.href);

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
