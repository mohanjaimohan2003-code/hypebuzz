import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { HomepageHeader } from "@/components/layout/homepage-header";
import { MerchantLogo } from "@/components/product/merchant-logo";
import { PriceComparison } from "@/components/product/price-comparison";
import { ProductCard } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductInformationTabs } from "@/components/product/product-information-tabs";
import { ProductHighlights } from "@/components/product/product-rich-content";
import { ReviewStars } from "@/components/product/review-stars";
import { ShareProductButton } from "@/components/product/share-product-button";
import { getPublicProduct } from "@/lib/data/public-product";
import { getPublicProductReviews } from "@/lib/data/product-reviews";
import { schemaAvailability } from "@/lib/offers/publication-contract";
import { availabilityLabel, getBestEligibleOffer } from "@/lib/offers/price-comparison";
import { productSeoCopy } from "@/lib/products/seo";
import { productSocialDetails } from "@/lib/products/social-sharing";
import { parseReviewLimit, parseReviewRating, parseReviewSort } from "@/lib/reviews/model";
import { absoluteUrl, jsonLd } from "@/lib/seo/site";

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

function absoluteImageUrl(imageUrl: string | null) {
  if (!imageUrl) return null;
  try {
    const parsed = new URL(imageUrl, absoluteUrl("/"));
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch { return null; }
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProduct(slug);
  if (!product) return { title: "Product not found", robots: { index: false, follow: true } };
  const copy = productSeoCopy(product);
  const social = productSocialDetails(product);
  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: social.canonicalUrl },
    openGraph: {
      type: "website",
      locale: "en_US",
      title: social.title,
      description: social.description,
      url: social.canonicalUrl,
      siteName: "HypeBuzz",
      images: [{ url: social.imageUrl, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: social.title,
      description: social.description,
      images: [social.imageUrl],
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
  const bestOffer = getBestEligibleOffer(product.offers);

  const canonical = absoluteUrl(`/products/${product.slug}`);
  const social = productSocialDetails(product);
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

          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(24rem,1.1fr)] lg:items-start">
            <ProductGallery imageUrl={product.imageUrl} images={product.images} productName={product.name} />
            <section aria-labelledby="product-title" className="min-w-0 lg:pt-1">
              <div className="flex flex-wrap gap-2 text-sm font-medium text-[#1D4ED8]">
                {bestOffer?.discount ? <span className="rounded-full bg-[#DCFCE7] px-3 py-1 font-bold text-[#166534]">{bestOffer.discount}% off</span> : null}
                {product.brand ? <Link className="rounded-full bg-[#EFF6FF] px-3 py-1 hover:underline" href={`/search?brand=${product.brand.slug}`}>{product.brand.name}</Link> : null}
                {product.category ? <Link className="rounded-full bg-white px-3 py-1 ring-1 ring-[#E5E7EB] hover:underline" href={`/categories/${product.category.slug}`}>{product.category.name}</Link> : null}
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl" id="product-title">{product.name}</h1>
              <div className="mt-3 inline-flex items-center gap-2 text-sm text-[#4B5563]">{reviewData.summary.averageRating !== null ? <><ReviewStars rating={reviewData.summary.averageRating} size="sm" /><span className="font-semibold text-[#111827]">{reviewData.summary.averageRating.toFixed(1)}</span><span>({reviewData.summary.totalReviews} {reviewData.summary.totalReviews === 1 ? "review" : "reviews"})</span></> : <span>No reviews yet</span>}</div>
              <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1"><p className="text-3xl font-bold tracking-tight text-[#111827]">{bestOffer ? money(bestOffer.currentPrice, bestOffer.currency) : "No active offer"}</p>{bestOffer?.originalPrice ? <p className="text-lg text-[#6B7280] line-through">{money(bestOffer.originalPrice, bestOffer.currency)}</p> : null}{bestOffer?.discount ? <p className="font-bold text-[#15803D]">Save {bestOffer.discount}%</p> : null}</div>
              {product.shortDescription ? <p className="mt-4 text-lg leading-7 text-[#4B5563]">{product.shortDescription}</p> : null}
              <ProductHighlights highlights={product.features} />
              <dl className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4">
                <div><dt className="text-sm text-[#6B7280]">Availability</dt><dd className="mt-1 font-semibold text-[#111827]">{bestOffer ? availabilityLabel(bestOffer.availability) : "Unavailable"}</dd></div>
                <div><dt className="text-sm text-[#6B7280]">Stores</dt><dd className="mt-1 font-semibold text-[#111827]">{product.activeMerchantCount} {product.activeMerchantCount === 1 ? "store" : "stores"}</dd></div>
              </dl>
              {product.offers.length ? <a className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-[10px] border border-[#2563EB] bg-white px-6 font-semibold text-[#1D4ED8] transition-colors hover:bg-[#EFF6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 motion-reduce:transition-none" href="#compare-prices">Compare all {product.offers.length} {product.offers.length === 1 ? "offer" : "offers"}</a> : null}
              {bestOffer ? <><a className="mt-3 inline-flex min-h-14 w-full items-center justify-between gap-3 rounded-[10px] border border-[#EA580C] bg-[#F97316] px-4 font-bold text-[#111827] transition-colors hover:bg-[#FB923C] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 motion-reduce:transition-none sm:px-5" href={`/go/${bestOffer.id}`} rel="sponsored nofollow noopener noreferrer" target="_blank"><MerchantLogo merchant={bestOffer.merchant} variant="cta" /><span className="min-w-0 flex-1 text-center">Buy now on {bestOffer.merchant.name}</span><span aria-hidden="true" className="shrink-0">↗</span></a><div className="mt-3 space-y-1 text-sm"><p className="font-medium text-[#166534]"><span aria-hidden="true">✓</span> Latest listed price.</p><p className="text-[#6B7280]">Final price and availability are confirmed on the store.</p></div></> : null}
              <ShareProductButton text={social.description} title={product.name} url={social.canonicalUrl} />
            </section>
          </div>

          <ProductInformationTabs description={product.description} initialTab={reviewSort !== "recent" || reviewRating !== "all" || reviewLimit > 5 ? "reviews" : "about"} reviewData={{ hasError: reviewData.hasError, hasMore: reviewData.hasMore, limit: reviewLimit, rating: reviewRating, reviews: reviewData.reviews, slug: product.slug, sort: reviewSort, summary: reviewData.summary }} specifications={product.specifications} />
          <div className="mt-8"><PriceComparison offers={product.offers} /></div>

          {product.relatedProducts.length ? <section aria-labelledby="related-heading" className="py-10 sm:py-12"><h2 className="text-2xl font-bold text-[#111827] sm:text-3xl" id="related-heading">You might also like</h2><p className="mt-2 text-sm text-[#6B7280]">More products from the same brand or category.</p><div className="mt-5 grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{product.relatedProducts.map((related) => <ProductCard key={related.id} product={related} />)}</div></section> : null}
        </div>
      </main>
      <Footer />
      <script dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} type="application/ld+json" />
    </>
  );
}
