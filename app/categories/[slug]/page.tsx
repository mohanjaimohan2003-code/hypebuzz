import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryEmptyState } from "@/components/category/category-empty-state";
import { Footer } from "@/components/layout/footer";
import { HomepageHeader } from "@/components/layout/homepage-header";
import { ProductCard } from "@/components/product/product-card";
import { SearchFilters } from "@/components/search/search-filters";
import { getPublicCategory, getPublicCategoryProducts } from "@/lib/data/public-category";
import { publicCategories } from "@/lib/data/public-categories";
import { absoluteUrl, jsonLd } from "@/lib/seo/site";
import { hasCategoryFilters, parseCategoryProductParams } from "@/lib/validation/category-products";

export const dynamicParams = false;

export function generateStaticParams() {
  return publicCategories.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params, searchParams }: PageProps<"/categories/[slug]">): Promise<Metadata> {
  const [{ slug }, rawSearchParams] = await Promise.all([params, searchParams]);
  const category = await getPublicCategory(slug);
  if (!category) return { title: "Category not found", robots: { index: false, follow: true } };

  const filters = parseCategoryProductParams(rawSearchParams);
  const title = `${category.name} products, prices and deals`;
  const description = category.description ?? `Compare published ${category.name.toLowerCase()} products, prices, discounts, and available merchant offers.`;
  const canonical = absoluteUrl(`/categories/${category.slug}`);

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: !hasCategoryFilters(filters), follow: true },
    openGraph: {
      type: "website",
      locale: "en_US",
      title,
      description,
      url: canonical,
      siteName: "HypeBuzz",
      images: [{ url: absoluteUrl("/brand/hypebuzz-banner.png"), alt: `${category.name} products on HypeBuzz` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl("/brand/hypebuzz-banner.png")],
    },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/categories/[slug]">) {
  const [{ slug }, rawSearchParams] = await Promise.all([params, searchParams]);
  const category = await getPublicCategory(slug);
  if (!category) notFound();

  const filters = parseCategoryProductParams(rawSearchParams);
  const result = await getPublicCategoryProducts(category, filters);
  const categoryHref = `/categories/${category.slug}`;
  const filtered = hasCategoryFilters(filters);
  const canonical = absoluteUrl(categoryHref);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${canonical}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: category.name, item: canonical },
    ],
  };

  return (
    <>
      <HomepageHeader />
      <main className="min-h-screen bg-[#F8FAFC]" id="main-content">
        <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <nav aria-label="Breadcrumb" className="text-sm text-[#6B7280]">
            <ol className="flex items-center gap-2">
              <li><Link className="rounded-sm hover:text-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]" href="/">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="truncate font-medium text-[#111827]">{category.name}</li>
            </ol>
          </nav>

          <header className="mt-6">
            <h1 className="text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">{category.name}</h1>
            {category.description ? <p className="mt-3 max-w-3xl text-base leading-7 text-[#4B5563]">{category.description}</p> : null}
            <p aria-live="polite" className="mt-3 text-sm font-medium text-[#6B7280]">{result.totalCount} {result.totalCount === 1 ? "product" : "products"}</p>
          </header>

          <form action={categoryHref} className="mt-6 flex max-w-2xl gap-2" method="get" role="search">
            <label className="sr-only" htmlFor="category-search">Search within {category.name}</label>
            <input className="min-h-11 min-w-0 flex-1 rounded-[10px] border border-[#D1D5DB] bg-white px-4 text-sm text-[#111827] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]" defaultValue={filters.q} id="category-search" name="q" placeholder={`Search within ${category.name}`} type="search" />
            <button className="min-h-11 rounded-[10px] bg-[#2563EB] px-5 text-sm font-bold text-white hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" type="submit">Search</button>
          </form>

          {result.hasError ? <div className="mt-6 rounded-[10px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]" role="alert">Some category data could not be loaded. Please try again.</div> : null}

          <div className="mt-8 flex flex-col items-end gap-6 lg:flex-row lg:items-start">
            <SearchFilters action={categoryHref} brands={result.brands} categories={[]} filters={filters} hideCategory merchants={result.merchants} resetHref={categoryHref} showEditorialFilters />
            <section aria-label={`${category.name} products`} className="min-w-0 flex-1">
              {result.products.length ? <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13.5rem),1fr))] gap-4">{result.products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <CategoryEmptyState categoryHref={categoryHref} hasFilters={filtered} />}
            </section>
          </div>
        </div>
      </main>
      <Footer />
      <script dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} type="application/ld+json" />
    </>
  );
}
