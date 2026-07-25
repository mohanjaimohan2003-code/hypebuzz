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
    title: "Hot Deals",
    description: "Best offer handpicked by HypeBuzz",
    actionLabel: "Shop Now",
    href: "/search?sort=discount",
    icon: "flame",
    accent: "orange",
  },
  {
    title: "Biggest Price Drop",
    description: "Products with the biggest price reductions",
    actionLabel: "Explore Now",
    href: "/search?sort=discount",
    icon: "trending-down",
    accent: "green",
  },
  {
    title: "Trending Products",
    description: "Products shoppers are exploring today",
    actionLabel: "View Trending",
    href: "/trending",
    icon: "search",
    accent: "purple",
  },
] satisfies readonly HomeFeature[];
