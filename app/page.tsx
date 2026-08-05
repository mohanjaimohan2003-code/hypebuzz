import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { HomeFeatureCard } from "@/components/home/home-feature-card";
import { HomepageCatalog, HomepageCatalogSkeleton } from "@/components/home/homepage-catalog";
import { Footer } from "@/components/layout/footer";
import { HomepageHeader } from "@/components/layout/homepage-header";
import { homeFeatures } from "@/lib/data/homepage-content";
import { absoluteUrl, jsonLd, siteDescription, siteSocialImagePath, siteTitle } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: { absolute: siteTitle },
  description: siteDescription,
  alternates: { canonical: absoluteUrl("/") },
  openGraph: {
    type: "website",
    locale: "en_US",
    title: siteTitle,
    description: siteDescription,
    url: absoluteUrl("/"),
    siteName: "HypeBuzz",
    images: [{ url: absoluteUrl(siteSocialImagePath), alt: "HypeBuzz product discovery and price comparison platform" }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [absoluteUrl(siteSocialImagePath)],
  },
};

const homepageStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${absoluteUrl("/")}#organization`,
      name: "HypeBuzz",
      url: absoluteUrl("/"),
      logo: absoluteUrl("/icon.png"),
    },
    {
      "@type": "WebSite",
      "@id": `${absoluteUrl("/")}#website`,
      name: "HypeBuzz",
      url: absoluteUrl("/"),
      description: siteDescription,
      publisher: { "@id": `${absoluteUrl("/")}#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl("/search")}?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function Home() {
  return (
    <>
      <HomepageHeader />
      <main className="min-h-screen overflow-x-clip bg-[#F8FAFC]" id="main-content">
        <section aria-label="HypeBuzz featured deals" className="relative isolate w-full overflow-hidden border-b border-[#172554] bg-[#020817]">
          <h1 className="sr-only">HypeBuzz — Handpicked Deals. Everyday Savings.</h1>
          <Image alt="" aria-hidden="true" className="absolute inset-0 -z-20 h-full w-full object-cover" decoding="async" fetchPriority="low" fill loading="lazy" role="presentation" sizes="100vw" src="/images/banners/hypebuzz-hero-background.png" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-black/10" />
          <Link aria-label="Explore HypeBuzz deals" className="relative mx-auto flex h-[250px] w-full max-w-[1717px] items-center justify-center overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#60A5FA] sm:h-[270px] md:h-[300px] lg:h-[360px]" href="/search?sort=discount">
            <Image alt="HypeBuzz handpicked deals and everyday savings" className="block h-auto max-h-full w-auto max-w-full object-contain" height={916} priority sizes="(max-width: 1717px) 100vw, 1717px" src="/images/banners/hypebuzz-main-hero-banner.png" width={1717} />
          </Link>
        </section>

        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <section aria-label="Featured ways to discover deals" className="py-6 sm:py-8">
            <div className="grid gap-4 md:grid-cols-3">
              {homeFeatures.map((feature) => <HomeFeatureCard key={feature.title} {...feature} />)}
            </div>
          </section>

          <Suspense fallback={<HomepageCatalogSkeleton />}><HomepageCatalog /></Suspense>
        </div>
      </main>
      <Footer />
      <script dangerouslySetInnerHTML={{ __html: jsonLd(homepageStructuredData) }} type="application/ld+json" />
    </>
  );
}
