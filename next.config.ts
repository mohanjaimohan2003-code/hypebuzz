import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "42mb" },
  },
  async headers() {
    const decorativeImagePaths = [
      "/home/hot-deal.png",
      "/home/price-drop.png",
      "/home/trending-products.png",
      "/images/banners/hypebuzz-hero-background.png",
    ];
    return decorativeImagePaths.map((source) => ({
      source,
      headers: [{ key: "X-Robots-Tag", value: "noindex, noimageindex" }],
    }));
  },
};

export default nextConfig;
