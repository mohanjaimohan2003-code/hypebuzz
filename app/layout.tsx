import type { Metadata } from "next";
import {
  absoluteUrl,
  getSiteUrl,
  siteDescription,
  siteName,
  siteTitle,
} from "@/lib/seo/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),

  title: {
    default: siteTitle,
    template: "%s | HypeBuzz",
  },

  description: siteDescription,
  applicationName: siteName,

  // Google Search Console Verification
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },

  alternates: {
    canonical: absoluteUrl("/"),
  },

  manifest: "/manifest.webmanifest",

  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/brand/hypebuzz-favicon.png", type: "image/png" }],
  },

  openGraph: {
    type: "website",
    siteName,
    locale: "en_US",
    title: siteTitle,
    description: siteDescription,
    url: absoluteUrl("/"),
    images: [
      {
        url: absoluteUrl("/brand/hypebuzz-banner.png"),
        alt: "HypeBuzz product discovery and price comparison platform",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [absoluteUrl("/brand/hypebuzz-banner.png")],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        {children}
      </body>
    </html>
  );
}