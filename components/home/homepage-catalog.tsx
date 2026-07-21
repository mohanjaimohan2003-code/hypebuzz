import Link from "next/link";
import type { ProductCardProduct } from "@/components/product/product-card";
import { ProductCard } from "@/components/product/product-card";
import { getHomepageData } from "@/lib/data/homepage";
import { FeaturedCategories } from "./featured-categories";
import { HomeEmptyState } from "./home-empty-state";
import { PopularBrands } from "./popular-brands";

function ArrowIcon() {
  return <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24"><path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>;
}

function ProductSection({ title, description, products, href, emptyMessage }: { title: string; description: string; products: ProductCardProduct[]; href: string; emptyMessage: string }) {
  const headingId = `${title.toLowerCase().replaceAll(" ", "-")}-heading`;
  return (
    <section aria-labelledby={headingId} className="border-t border-[#E5E7EB] py-10 sm:py-12">
      <div className="mb-6 flex items-end justify-between gap-4"><div><h2 className="text-2xl font-bold tracking-tight text-[#111827] sm:text-3xl" id={headingId}>{title}</h2><p className="mt-1 text-sm leading-5 text-[#6B7280]">{description}</p></div><Link className="flex min-h-11 shrink-0 items-center gap-2 rounded-[10px] px-3 text-sm font-semibold text-[#1D4ED8] hover:bg-[#EFF6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]" href={href}>View all <ArrowIcon /></Link></div>
      {products.length ? <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13.5rem),1fr))] gap-4">{products.map((product) => <ProductCard key={`${title}-${product.id}`} product={product} />)}</div> : <HomeEmptyState message={emptyMessage} />}
    </section>
  );
}

export async function HomepageCatalog() {
  const data = await getHomepageData();
  return (
    <>
      <ProductSection description="Products shoppers are comparing across trusted stores." emptyMessage="Trending products will appear when published products are marked as trending." href="/trending" products={data.trendingProducts} title="Trending Products" />
      <ProductSection description="Handpicked products selected by the HypeBuzz team." emptyMessage="Featured products will appear when published products are marked as featured." href="/search" products={data.featuredProducts} title="Featured Products" />
      <ProductSection description="The newest published additions to the HypeBuzz catalog." emptyMessage="Latest products will appear after products are published." href="/search?sort=newest" products={data.latestProducts} title="Latest Products" />
      <ProductSection description="Current offers with the strongest verified percentage savings." emptyMessage="Best deals will appear when active offers include a valid original price and discount." href="/search?sort=discount" products={data.bestDeals} title="Best Deals" />
      <FeaturedCategories categories={data.featuredCategories} />
      <PopularBrands brands={data.popularBrands} />
    </>
  );
}

export function HomepageCatalogSkeleton() {
  return <div aria-label="Loading homepage products" className="py-10"><div className="h-8 w-56 animate-pulse rounded bg-[#E5E7EB]" /><div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div className="aspect-[3/4] animate-pulse rounded-2xl bg-[#E5E7EB]" key={index} />)}</div></div>;
}
