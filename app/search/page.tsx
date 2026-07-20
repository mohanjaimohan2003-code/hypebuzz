import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { HomepageHeader } from "@/components/layout/homepage-header";
import { ProductCard } from "@/components/product/product-card";
import { SearchEmptyState } from "@/components/search/search-empty-state";
import { SearchFilters } from "@/components/search/search-filters";
import { searchProducts } from "@/lib/data/product-search";
import { parseProductSearchParams } from "@/lib/validation/product-search";
import { absoluteUrl } from "@/lib/seo/site";

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const filters = parseProductSearchParams(await searchParams);
  const hasFilters = Boolean(
    filters.q || filters.category || filters.brand || filters.merchant ||
    filters.minPrice !== null || filters.maxPrice !== null || filters.minDiscount !== null ||
    filters.availability || filters.bestPriceOnly || filters.sort !== "relevance",
  );
  const title = filters.q ? `Search results for “${filters.q}”` : "Search products";
  const description = filters.q
    ? `Compare products, prices, and trusted merchant offers matching ${filters.q}.`
    : "Search and filter products and offers across trusted merchants.";
  const canonical = absoluteUrl("/search");
  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: !hasFilters, follow: true },
    openGraph: {
      type: "website",
      locale: "en_US",
      title,
      description,
      url: canonical,
      siteName: "HypeBuzz",
      images: [{ url: absoluteUrl("/brand/hypebuzz-banner.png"), alt: "Search and compare products on HypeBuzz" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl("/brand/hypebuzz-banner.png")],
    },
  };
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const filters = parseProductSearchParams(await searchParams);
  const result = await searchProducts(filters);
  const heading = filters.q ? `Results for “${filters.q}”` : "Search products";

  return (
    <>
      <HomepageHeader />
      <main className="min-h-screen bg-[#F8FAFC]" id="main-content">
        <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="mb-6"><h1 className="text-2xl font-bold tracking-tight text-[#111827] sm:text-3xl">{heading}</h1><p aria-live="polite" className="mt-2 text-sm text-[#6B7280]">{result.products.length} {result.products.length === 1 ? "product" : "products"} found</p></div>
          {result.hasError ? <div className="mb-6 rounded-[10px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]" role="alert">Some search data could not be loaded. Please try again.</div> : null}
          <div className="flex flex-col items-end gap-6 lg:flex-row lg:items-start">
            <SearchFilters filters={filters} categories={result.categories} brands={result.brands} merchants={result.merchants} />
            <section aria-label="Product search results" className="min-w-0 flex-1">
              {result.products.length ? <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13.5rem),1fr))] gap-4">{result.products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <SearchEmptyState />}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
