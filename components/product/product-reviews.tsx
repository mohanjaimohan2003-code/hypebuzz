import Link from "next/link";
import type { PublicReview, ReviewRatingFilter, ReviewSort, ReviewSummary as Summary } from "@/lib/reviews/model";
import { REVIEW_MAX_VISIBLE, REVIEW_PAGE_SIZE } from "@/lib/reviews/model";
import { ReviewCard } from "./review-card";
import { ReviewForm } from "./review-form";
import { ReviewFilters } from "./review-filters";
import { ReviewSummary } from "./review-summary";

type Props = { slug: string; summary: Summary; reviews: PublicReview[]; rating: ReviewRatingFilter; sort: ReviewSort; limit: number; hasMore: boolean; hasError: boolean };
function query(slug: string, sort: ReviewSort, rating: ReviewRatingFilter, limit: number) { const params = new URLSearchParams(); if (sort !== "recent") params.set("reviewSort", sort); if (rating !== "all") params.set("reviewRating", String(rating)); if (limit > REVIEW_PAGE_SIZE) params.set("reviewLimit", String(limit)); return `/products/${slug}${params.size ? `?${params}` : ""}#customer-reviews`; }

export function ProductReviews({ slug, summary, reviews, rating, sort, limit, hasMore, hasError }: Props) {
  return <section aria-labelledby="customer-reviews-heading" className="min-w-0 rounded-2xl border border-[#E5E7EB] bg-white p-5 sm:p-6" id="customer-reviews">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-bold text-[#111827]" id="customer-reviews-heading">Customer Reviews <span className="text-base font-semibold text-[#6B7280]">({summary.totalReviews})</span></h2><ReviewForm /></div>
    {hasError ? <div className="mt-5 rounded-[10px] border border-[#FDE68A] bg-[#FFFBEB] p-4 text-sm leading-6 text-[#92400E]" role="status"><p className="font-bold">Reviews are temporarily unavailable.</p><p>The product page is still available. Please try the reviews section again after the review database has been configured.</p></div> : summary.totalReviews ? <><div className="mt-5"><ReviewSummary summary={summary} /></div><ReviewFilters rating={rating} slug={slug} sort={sort} />
      <div className="mt-6">{reviews.length ? reviews.map((review) => <ReviewCard key={review.id} review={review} />) : <div className="rounded-xl bg-[#F8FAFC] p-6 text-center"><p className="font-bold">No reviews match this rating.</p><Link className="mt-2 inline-block text-sm font-semibold text-[#1D4ED8] hover:underline" href={query(slug, sort, "all", REVIEW_PAGE_SIZE)}>Show all ratings</Link></div>}</div>
      {hasMore && limit < REVIEW_MAX_VISIBLE ? <Link className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-[10px] border border-[#2563EB] px-4 text-sm font-semibold text-[#1D4ED8] hover:bg-[#EFF6FF]" href={query(slug, sort, rating, Math.min(REVIEW_MAX_VISIBLE, limit + REVIEW_PAGE_SIZE))}>Load More Reviews</Link> : null}</> : <div className="py-10 text-center"><div aria-hidden="true" className="text-3xl text-[#D1D5DB]">★★★★★</div><h3 className="mt-3 text-lg font-bold text-[#111827]">No reviews yet.</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#6B7280]">Be the first to share your experience with this product.</p><div className="mt-5"><ReviewForm /></div></div>}
  </section>;
}
