import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { HomepageHeader } from "@/components/layout/homepage-header";
import { absoluteUrl } from "@/lib/seo/site";

const title = "Knowledge Hub";
const description = "Explore upcoming buying guides, product insights, and smarter shopping advice from HypeBuzz.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: absoluteUrl("/knowledge-hub") },
  openGraph: { type: "website", locale: "en_US", siteName: "HypeBuzz", title: `${title} | HypeBuzz`, description, url: absoluteUrl("/knowledge-hub") },
  twitter: { card: "summary_large_image", title: `${title} | HypeBuzz`, description, images: [absoluteUrl("/brand/hypebuzz-banner.png")] },
};

export default function KnowledgeHubPage() {
  return (
    <>
      <HomepageHeader />
      <main className="flex min-h-[65vh] items-center bg-[#F8FAFC] px-4 py-16" id="main-content">
        <section className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2563EB]">Coming soon</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#111827] sm:text-5xl">Knowledge Hub</h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-[#6B7280]">Buying guides, product insights, and smarter shopping advice are coming soon.</p>
        </section>
      </main>
      <Footer />
    </>
  );
}
