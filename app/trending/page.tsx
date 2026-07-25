import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { HomepageHeader } from "@/components/layout/homepage-header";
import { ProductCard } from "@/components/product/product-card";
import { getTrendingProducts } from "@/lib/data/homepage";

export const metadata: Metadata = {
  title: "Trending Products | HypeBuzz",
  description: "Explore products currently trending on HypeBuzz.",
};

export default async function TrendingPage() {
  const { products, hasError } = await getTrendingProducts();

  return (
    <>
      <HomepageHeader />
      <main className="min-h-screen bg-[#F8FAFC]" id="main-content">
        <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
          <header>
            <p className="text-sm font-semibold text-[#2563EB]">Popular now</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">Trending Products</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#4B5563]">Published products selected as trending by the HypeBuzz team.</p>
          </header>
          {hasError ? <div className="mt-6 rounded-[10px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]" role="alert">Trending products could not be loaded. Please try again.</div> : null}
          {products.length ? (
            <section aria-label="Trending products" className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(min(100%,13.5rem),1fr))] gap-4">
              {products.map((product) => <ProductCard key={product.id} product={product} />)}
            </section>
          ) : !hasError ? <p className="mt-8 rounded-2xl border border-[#E5E7EB] bg-white p-8 text-[#4B5563]">No published products are marked as trending yet.</p> : null}
        </div>
      </main>
      <Footer />
    </>
  );
}
