import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HypeBuzz",
    short_name: "HypeBuzz",
    description:
      "Discover trending products, explore genuine deals, and make smarter shopping decisions with HypeBuzz.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#020817",
    icons: [
      {
        src: "/icon.png",
        sizes: "1254x1254",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
