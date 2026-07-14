export type HomeFeatureIcon = "flame" | "search" | "trending-down";
export type HomeFeatureAccent = "orange" | "green" | "purple";

export type HomeFeature = {
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  icon: HomeFeatureIcon;
  accent: HomeFeatureAccent;
};

export const homeFeatures = [
  {
    title: "Deal of the Day",
    description: "Best offer handpicked by HypeBuzz",
    actionLabel: "Shop Now",
    href: "/deals",
    icon: "flame",
    accent: "orange",
  },
  {
    title: "Biggest Price Drop",
    description: "Products with the biggest price reductions",
    actionLabel: "Explore Now",
    href: "/deals?sort=price-drop",
    icon: "trending-down",
    accent: "green",
  },
  {
    title: "Trending Search",
    description: "What shoppers are searching for today",
    actionLabel: "See Trends",
    href: "/trending",
    icon: "search",
    accent: "purple",
  },
] satisfies readonly HomeFeature[];

export const popularBrands = [
  { name: "Apple", href: "/search?q=Apple" },
  { name: "Samsung", href: "/search?q=Samsung" },
  { name: "Sony", href: "/search?q=Sony" },
  { name: "LG", href: "/search?q=LG" },
  { name: "boAt", href: "/search?q=boAt" },
  { name: "OnePlus", href: "/search?q=OnePlus" },
  { name: "Dell", href: "/search?q=Dell" },
  { name: "HP", href: "/search?q=HP" },
] as const;
