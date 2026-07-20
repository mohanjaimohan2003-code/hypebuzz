import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { HomepageHeader } from "@/components/layout/homepage-header";
import { PriceComparison } from "@/components/product/price-comparison";
import { ProductCard } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { getPublicProduct } from "@/lib/data/public-product";
import { absoluteUrl, jsonLd } from "@/lib/seo/site";

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

function readableName(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function absoluteImageUrl(imageUrl: string | null) {
  if (!imageUrl) return null;
  try { return new URL(imageUrl, absoluteUrl("/")).toString(); } catch { return null; }
}

function offerIsInStock(availability: string | null) {
  if (!availability) return false;
  const normalized = availability.toLowerCase();
  return normalized.includes("in stock") || normalized === "available";
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProduct(slug);
  if (!product) return { title: "Product not found", robots: { index: false, follow: true } };
  const description = product.shortDescription ?? product.description ?? `Compare current prices and offers for ${product.name}.`;
  const canonical = absoluteUrl(`/products/${product.slug}`);
  return {
    title: `${product.name} prices and offers`,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "en_US",
      title: `${product.name} prices and offers`,
      description,
      url: canonical,
      siteName: "HypeBuzz",
      images: absoluteImageUrl(product.imageUrl) ? [{ url: absoluteImageUrl(product.imageUrl)!, alt: product.name }] : undefined,
    },
    twitter: {
      card: product.imageUrl ? "summary_large_image" : "summary",
      title: `${product.name} prices and offers`,
      description,
      images: absoluteImageUrl(product.imageUrl) ? [absoluteImageUrl(product.imageUrl)!] : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getPublicProduct(slug);
  if (!product) notFound();

  const canonical = absoluteUrl(`/products/${product.slug}`);
  const breadcrumbItems = [
    { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
    ...(product.category ? [{ "@type": "ListItem", position: 2, name: product.category.name, item: absoluteUrl(`/categories/${product.category.slug}`) }] : []),
    { "@type": "ListItem", position: product.category ? 3 : 2, name: product.name, item: canonical },
  ];
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${canonical}#product`,
        name: product.name,
        description: product.shortDescription ?? product.description ?? undefined,
        image: absoluteImageUrl(product.imageUrl) ? [absoluteImageUrl(product.imageUrl)] : undefined,
        brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
        category: product.category?.name,
        url: canonical,
        offers: product.offers.length ? {
          "@type": "AggregateOffer",
          priceCurrency: product.currency,
          lowPrice: product.lowestPrice,
          highPrice: Math.max(...product.offers.map((offer) => offer.currentPrice)),
          offerCount: product.offers.length,
          offers: product.offers.map((offer) => ({
            "@type": "Offer",
            price: offer.currentPrice,
            priceCurrency: offer.currency,
            url: `${canonical}#deals`,
            seller: { "@type": "Organization", name: offer.merchant.name },
            availability: offerIsInStock(offer.availability) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          })),
        } : undefined,
      },
      { "@type": "BreadcrumbList", "@id": `${canonical}#breadcrumb`, itemListElement: breadcrumbItems },
    ],
  };

  return (
    <>
      <HomepageHeader />
      <main className="min-h-screen bg-[#F8FAFC]" id="main-content">
        <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <nav aria-label="Breadcrumb" className="overflow-hidden text-sm text-[#6B7280]">
            <ol className="flex items-center gap-2 whitespace-nowrap">
              <li><Link className="rounded-sm hover:text-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]" href="/">Home</Link></li>
              {product.category ? <><li aria-hidden="true">›</li><li><Link className="rounded-sm hover:text-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]" href={`/categories/${product.category.slug}`}>{product.category.name}</Link></li></> : null}
              <li aria-hidden="true">›</li><li aria-current="page" className="truncate font-medium text-[#111827]">{product.name}</li>
            </ol>
          </nav>

          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] lg:items-start">
            <ProductGallery imageUrl={product.imageUrl} productName={product.name} />
            <section aria-labelledby="product-title" className="lg:sticky lg:top-24">
              <div className="flex flex-wrap gap-2 text-sm font-medium text-[#1D4ED8]">
                {product.brand ? <Link className="rounded-full bg-[#EFF6FF] px-3 py-1 hover:underline" href={`/search?brand=${product.brand.slug}`}>{product.brand.name}</Link> : null}
                {product.category ? <Link className="rounded-full bg-white px-3 py-1 ring-1 ring-[#E5E7EB] hover:underline" href={`/categories/${product.category.slug}`}>{product.category.name}</Link> : null}
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl" id="product-title">{product.name}</h1>
              {product.shortDescription ? <p className="mt-4 text-lg leading-7 text-[#4B5563]">{product.shortDescription}</p> : null}
              <dl className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-5">
                <div><dt className="text-sm text-[#6B7280]">Lowest price</dt><dd className="mt-1 text-2xl font-bold text-[#111827]">{product.lowestPrice === null ? "No active offer" : money(product.lowestPrice, product.currency)}</dd></div>
                <div><dt className="text-sm text-[#6B7280]">Highest discount</dt><dd className="mt-1 text-xl font-bold text-[#15803D]">{product.highestDiscount === null ? "—" : `${Math.round(product.highestDiscount)}% off`}</dd></div>
                <div><dt className="text-sm text-[#6B7280]">Availability</dt><dd className="mt-1 font-semibold text-[#111827]">{product.availability}</dd></div>
                <div><dt className="text-sm text-[#6B7280]">Last updated</dt><dd className="mt-1 font-semibold text-[#111827]"><time dateTime={product.updatedAt}>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(product.updatedAt))}</time></dd></div>
              </dl>
              {product.offers[0] ? <a className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-[10px] border border-[#EA580C] bg-[#F97316] px-6 font-bold text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" href="#deals">Compare all {product.offers.length} {product.offers.length === 1 ? "offer" : "offers"}</a> : null}
            </section>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)]">
            <div className="space-y-10">
              {product.description ? <section aria-labelledby="description-heading"><h2 className="text-2xl font-bold text-[#111827]" id="description-heading">About this product</h2><p className="mt-4 max-w-[720px] whitespace-pre-line leading-7 text-[#4B5563]">{product.description}</p></section> : null}
              {product.features.length ? <section aria-labelledby="features-heading"><h2 className="text-2xl font-bold text-[#111827]" id="features-heading">Features</h2><ul className="mt-4 grid gap-3 sm:grid-cols-2">{product.features.map((feature) => <li className="flex gap-3 rounded-[10px] bg-white p-4 text-[#374151] ring-1 ring-[#E5E7EB]" key={feature}><span aria-hidden="true" className="font-bold text-[#2563EB]">✓</span>{feature}</li>)}</ul></section> : null}
              {product.specifications.length ? <section aria-labelledby="specifications-heading"><h2 className="text-2xl font-bold text-[#111827]" id="specifications-heading">Specifications</h2><dl className="mt-4 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">{product.specifications.map((specification, index) => <div className={`grid grid-cols-[minmax(8rem,0.4fr)_1fr] gap-4 p-4 ${index ? "border-t border-[#E5E7EB]" : ""}`} key={specification.name}><dt className="font-medium text-[#6B7280]">{readableName(specification.name)}</dt><dd className="text-[#111827]">{specification.value}</dd></div>)}</dl></section> : null}
            </div>
            <PriceComparison offers={product.offers} />
          </div>

          {product.relatedProducts.length ? <section aria-labelledby="related-heading" className="py-12 sm:py-16"><h2 className="text-2xl font-bold text-[#111827] sm:text-3xl" id="related-heading">Related products</h2><p className="mt-2 text-sm text-[#6B7280]">More products from the same brand or category.</p><div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,13.5rem),1fr))] gap-4">{product.relatedProducts.map((related) => <ProductCard key={related.id} product={related} />)}</div></section> : null}
        </div>
      </main>
      <Footer />
      <script dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} type="application/ld+json" />
    </>
  );
}
