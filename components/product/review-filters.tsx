"use client";
import { useRouter } from "next/navigation";
import type { ReviewRatingFilter, ReviewSort } from "@/lib/reviews/model";

export function ReviewFilters({ slug, rating, sort }: { slug: string; rating: ReviewRatingFilter; sort: ReviewSort }) {
  const router = useRouter();
  function navigate(nextSort: ReviewSort, nextRating: ReviewRatingFilter) { const params = new URLSearchParams(); if (nextSort !== "recent") params.set("reviewSort", nextSort); if (nextRating !== "all") params.set("reviewRating", String(nextRating)); router.push(`/products/${slug}${params.size ? `?${params}` : ""}#customer-reviews`); }
  return <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="sr-only" htmlFor="review-sort">Sort reviews</label><select className="h-11 min-w-0 rounded-[10px] border border-[#D1D5DB] bg-white px-3 text-sm font-semibold" id="review-sort" onChange={(event) => navigate(event.target.value as ReviewSort, rating)} value={sort}><option value="recent">Most Recent</option><option value="highest">Highest Rated</option><option value="lowest">Lowest Rated</option></select><label className="sr-only" htmlFor="review-rating">Filter by rating</label><select className="h-11 min-w-0 rounded-[10px] border border-[#D1D5DB] bg-white px-3 text-sm font-semibold" id="review-rating" onChange={(event) => navigate(sort, event.target.value === "all" ? "all" : Number(event.target.value) as 1|2|3|4|5)} value={rating}><option value="all">All Ratings</option>{[5,4,3,2,1].map((value) => <option key={value} value={value}>{value} Stars</option>)}</select></div>;
}
