export const REVIEW_PAGE_SIZE = 5;
export const REVIEW_MAX_VISIBLE = 25;
export const REVIEW_NAME_MAX = 80;
export const REVIEW_TITLE_MAX = 120;
export const REVIEW_TEXT_MAX = 2000;

export type ReviewStatus = "pending" | "approved" | "rejected";
export type ReviewSort = "recent" | "highest" | "lowest";
export type ReviewRatingFilter = 1 | 2 | 3 | 4 | 5 | "all";

export type ProductReview = {
  id: string;
  product_id: string;
  user_id: string | null;
  reviewer_name: string;
  rating: number;
  title: string | null;
  review_text: string;
  is_verified_buyer: boolean;
  status: ReviewStatus;
  helpful_count: number;
  unhelpful_count: number;
  created_at: string;
  updated_at: string;
};

export type PublicReview = Omit<ProductReview, "product_id" | "user_id" | "status" | "updated_at">;
export type ReviewSummary = {
  totalReviews: number;
  averageRating: number | null;
  counts: Record<1 | 2 | 3 | 4 | 5, number>;
};

export function parseReviewSort(value: string | string[] | undefined): ReviewSort {
  const first = Array.isArray(value) ? value[0] : value;
  return first === "highest" || first === "lowest" ? first : "recent";
}

export function parseReviewRating(value: string | string[] | undefined): ReviewRatingFilter {
  const first = Array.isArray(value) ? value[0] : value;
  const parsed = Number(first);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5 ? parsed as 1 | 2 | 3 | 4 | 5 : "all";
}

export function parseReviewLimit(value: string | string[] | undefined) {
  const first = Array.isArray(value) ? value[0] : value;
  const parsed = Number(first);
  if (!Number.isInteger(parsed) || parsed < REVIEW_PAGE_SIZE) return REVIEW_PAGE_SIZE;
  return Math.min(REVIEW_MAX_VISIBLE, parsed);
}

export function calculateReviewSummary(reviews: Array<Pick<ProductReview, "rating" | "status">>): ReviewSummary {
  const approved = reviews.filter((review) => review.status === "approved" && review.rating >= 1 && review.rating <= 5);
  const counts: ReviewSummary["counts"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const review of approved) counts[review.rating as 1 | 2 | 3 | 4 | 5] += 1;
  return {
    totalReviews: approved.length,
    averageRating: approved.length ? approved.reduce((sum, review) => sum + review.rating, 0) / approved.length : null,
    counts,
  };
}

export function filterSortPaginateReviews(reviews: ProductReview[], rating: ReviewRatingFilter, sort: ReviewSort, limit: number) {
  const approved = reviews.filter((review) => review.status === "approved" && (rating === "all" || review.rating === rating));
  const sorted = [...approved].sort((a, b) => {
    if (sort === "highest") return b.rating - a.rating || b.created_at.localeCompare(a.created_at);
    if (sort === "lowest") return a.rating - b.rating || b.created_at.localeCompare(a.created_at);
    return b.created_at.localeCompare(a.created_at);
  });
  return { reviews: sorted.slice(0, limit), hasMore: sorted.length > limit };
}
