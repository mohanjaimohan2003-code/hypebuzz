import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { HomepageHeader } from "@/components/layout/homepage-header";
import { PriceComparison } from "@/components/product/price-comparison";
import { ProductCard } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductReviews } from "@/components/product/product-reviews";
import { ProductDescription, ProductHighlights, ProductSpecifications } from "@/components/product/product-rich-content";
import { getPublicProduct } from "@/lib/data/public-product";
import { getPublicProductReviews } from "@/lib/data/product-reviews";
import { schemaAvailability } from "@/lib/offers/publication-contract";
import { productSeoCopy } from "@/lib/products/seo";
import { parseReviewLimit, parseReviewRating, parseReviewSort } from "@/lib/reviews/model";
import { absoluteUrl, jsonLd } from "@/lib/seo/site";

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

function absoluteImageUrl(imageUrl: string | null) {
  if (!imageUrl) return null;
  try { return new URL(imageUrl, absoluteUrl("/")).toString(); } catch { return null; }
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProduct(slug);
  if (!product) return { title: "Product not found", robots: { index: false, follow: true } };
  const copy = productSeoCopy(product);
  const canonical = absoluteUrl(`/products/${product.slug}`);
  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "en_US",
      title: copy.title,
      description: copy.description,
      url: canonical,
      siteName: "HypeBuzz",
      images: absoluteImageUrl(product.imageUrl) ? [{ url: absoluteImageUrl(product.imageUrl)!, alt: product.name }] : undefined,
    },
    twitter: {
      card: product.imageUrl ? "summary_large_image" : "summary",
      title: copy.title,
      description: copy.description,
      images: absoluteImageUrl(product.imageUrl) ? [absoluteImageUrl(product.imageUrl)!] : undefined,
    },
  };
}

type ProductPageProps = { params: Promise<{ slug: string }>; searchParams: Promise<{ reviewSort?: string | string[]; reviewRating?: string | string[]; reviewLimit?: string | string[] }> };

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { slug } = await params;
  const reviewParams = await searchParams;
  const product = await getPublicProduct(slug);
  if (!product) notFound();
  const reviewSort = parseReviewSort(reviewParams.reviewSort);
  const reviewRating = parseReviewRating(reviewParams.reviewRating);
  const reviewLimit = parseReviewLimit(reviewParams.reviewLimit);
  const reviewData = await getPublicProductReviews(product.id, { sort: reviewSort, rating: reviewRating, limit: reviewLimit });

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
        image: product.images.map((image) => absoluteImageUrl(image.imageUrl)).filter((image): image is string => Boolean(image)),
        brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
        category: product.category?.name,
        url: canonical,
        aggregateRating: reviewData.summary.totalReviews && reviewData.summary.averageRating !== null ? {
          "@type": "AggregateRating", ratingValue: reviewData.summary.averageRating,
          reviewCount: reviewData.summary.totalReviews, bestRating: 5, worstRating: 1,
        } : undefined,
        offers: product.offers.length ? {
          "@type": "AggregateOffer",
          priceCurrency: product.currency,
          lowPrice: product.lowestPrice ?? undefined,
          highPrice: product.highestPrice ?? undefined,
          offerCount: product.offers.length,
          offers: product.offers.map((offer) => ({
            "@type": "Offer",
            price: offer.currentPrice,
            priceCurrency: offer.currency,
            url: `${canonical}#compare-prices`,
            seller: { "@type": "Organization", name: offer.merchant.name },
            availability: schemaAvailability(offer.availability),
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
            <ProductGallery imageUrl={product.imageUrl} images={product.images} productName={product.name} />
            <section aria-labelledby="product-title" className="lg:sticky lg:top-24">
              <div className="flex flex-wrap gap-2 text-sm font-medium text-[#1D4ED8]">
                {product.brand ? <Link className="rounded-full bg-[#EFF6FF] px-3 py-1 hover:underline" href={`/search?brand=${product.brand.slug}`}>{product.brand.name}</Link> : null}
                {product.category ? <Link className="rounded-full bg-white px-3 py-1 ring-1 ring-[#E5E7EB] hover:underline" href={`/categories/${product.category.slug}`}>{product.category.name}</Link> : null}
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl" id="product-title">{product.name}</h1>
              {product.shortDescription ? <p className="mt-4 text-lg leading-7 text-[#4B5563]">{product.shortDescription}</p> : null}
              <ProductHighlights highlights={product.features} />
              <dl className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-5">
                <div><dt className="text-sm text-[#6B7280]">Lowest price</dt><dd className="mt-1 text-2xl font-bold text-[#111827]">{product.lowestPrice === null ? "No active offer" : money(product.lowestPrice, product.currency)}</dd></div>
                <div><dt className="text-sm text-[#6B7280]">Highest discount</dt><dd className="mt-1 text-xl font-bold text-[#15803D]">{product.highestDiscount === null ? "—" : `${Math.round(product.highestDiscount)}% off`}</dd></div>
                <div><dt className="text-sm text-[#6B7280]">Availability</dt><dd className="mt-1 font-semibold text-[#111827]">{product.availability}</dd></div>
                <div><dt className="text-sm text-[#6B7280]">Last updated</dt><dd className="mt-1 font-semibold text-[#111827]"><time dateTime={product.updatedAt}>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(product.updatedAt))}</time></dd></div>
              </dl>
              {product.offers[0] ? <a className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-[10px] border border-[#EA580C] bg-[#F97316] px-6 font-bold text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" href="#compare-prices">Compare all {product.offers.length} {product.offers.length === 1 ? "offer" : "offers"}</a> : null}
            </section>
          </div>

          <div className="mt-12"><ProductDescription description={product.description} /></div>
          <div className="mt-10 grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start"><ProductSpecifications specifications={product.specifications} /><ProductReviews hasError={reviewData.hasError} hasMore={reviewData.hasMore} limit={reviewLimit} rating={reviewRating} reviews={reviewData.reviews} slug={product.slug} sort={reviewSort} summary={reviewData.summary} /></div>
          <div className="mt-10"><dl className="mb-5 grid grid-cols-2 gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4"><div><dt className="text-xs text-[#6B7280]">Stores</dt><dd className="text-lg font-bold">{product.activeMerchantCount}</dd></div><div><dt className="text-xs text-[#6B7280]">Maximum savings</dt><dd className="text-lg font-bold text-[#15803D]">{product.maximumSavings === null ? "—" : money(product.maximumSavings, product.currency)}</dd></div></dl><PriceComparison offers={product.offers} /></div>

          {product.relatedProducts.length ? <section aria-labelledby="related-heading" className="py-12 sm:py-16"><h2 className="text-2xl font-bold text-[#111827] sm:text-3xl" id="related-heading">Related products</h2><p className="mt-2 text-sm text-[#6B7280]">More products from the same brand or category.</p><div className="mt-6 grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{product.relatedProducts.map((related) => <ProductCard key={related.id} product={related} />)}</div></section> : null}
        </div>
      </main>
      <Footer />
      <script dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} type="application/ld+json" />
    </>
  );
}
