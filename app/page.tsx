import Image from "next/image";
import Link from "next/link";
import { HomeFeatureCard } from "@/components/home/home-feature-card";
import { PopularBrands } from "@/components/home/popular-brands";
import { Footer } from "@/components/layout/footer";
import { HomepageHeader } from "@/components/layout/homepage-header";
import { ProductCard } from "@/components/product/product-card";
import { homeFeatures } from "@/lib/data/homepage-content";
import { sampleProducts } from "@/lib/data/sample-products";

function ArrowIcon() {
  return <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24"><path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>;
}

function ProductSection({ title, description, products, href }: { title: string; description: string; products: typeof sampleProducts; href: string }) {
  const headingId = `${title.toLowerCase().replaceAll(" ", "-")}-heading`;

  return (
    <section aria-labelledby={headingId} className="py-10 sm:py-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div><h2 className="text-2xl font-bold tracking-tight text-[#111827] sm:text-3xl" id={headingId}>{title}</h2><p className="mt-1 text-sm leading-5 text-[#6B7280]">{description}</p></div>
        <Link className="flex min-h-11 shrink-0 items-center gap-2 rounded-[10px] px-3 text-sm font-semibold text-[#1D4ED8] hover:bg-[#EFF6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]" href={href}>View all <ArrowIcon /></Link>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13.5rem),1fr))] gap-4">{products.map((product) => <ProductCard key={`${title}-${product.id}`} product={product} />)}</div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <HomepageHeader />
      <main className="min-h-screen overflow-x-clip bg-[#F8FAFC]" id="main-content">
        <section aria-label="HypeBuzz featured deals" className="relative isolate overflow-hidden border-b border-[#172554] bg-[#020817]">
          <h1 className="sr-only">HypeBuzz — Handpicked Deals. Everyday Savings.</h1>
          <div aria-hidden="true" className="absolute left-1/2 top-1/2 -z-10 h-72 w-[min(90vw,72rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2563EB]/20 blur-3xl" />
          <div aria-hidden="true" className="absolute -left-24 top-8 -z-10 h-48 w-48 rotate-12 rounded-[2rem] border border-[#2563EB]/20" />
          <div aria-hidden="true" className="absolute -right-16 bottom-0 -z-10 h-44 w-44 rotate-45 rounded-[2rem] border border-[#60A5FA]/15" />
          <Link aria-label="Explore HypeBuzz deals" className="relative mx-auto block h-[250px] w-full max-w-[1717px] overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#60A5FA] sm:h-[270px] md:h-[300px] lg:h-[360px]" href="/deals">
            <Image alt="HypeBuzz handpicked deals and everyday savings promotion" className="object-contain object-center" fill priority sizes="100vw" src="/brand/hypebuzz-banner.png" />
          </Link>
        </section>

        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <section aria-label="Featured ways to discover deals" className="py-6 sm:py-8">
            <div className="grid gap-4 md:grid-cols-3">
              {homeFeatures.map((feature) => <HomeFeatureCard key={feature.title} {...feature} />)}
            </div>
          </section>

          <ProductSection description="Sample products shoppers are comparing across stores." href="/trending" products={sampleProducts} title="Trending Deals" />
          <div className="border-t border-[#E5E7EB]" />
          <ProductSection description="A sample selection for smarter product discovery." href="/collections/featured" products={[...sampleProducts].reverse()} title="Featured Products" />
          <PopularBrands />
        </div>
      </main>
      <Footer />
    </>
  );
}
