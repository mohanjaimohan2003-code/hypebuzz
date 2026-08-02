import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ProductReview, PublicReview, ReviewRatingFilter, ReviewSort, ReviewSummary } from "@/lib/reviews/model";

type SummaryRow = { total_reviews: number; average_rating: number | null; five_star: number; four_star: number; three_star: number; two_star: number; one_star: number };
const emptySummary: ReviewSummary = { totalReviews: 0, averageRating: null, counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };

type SupabaseDiagnostic = { code?: string; message?: string; details?: string; hint?: string };

function logReviewQueryError(query: "summary" | "list" | "admin list", error: SupabaseDiagnostic | null) {
  if (!error) return;
  console.error(`Product review ${query} query failed`, {
    code: error.code ?? "unknown",
    message: error.message ?? "Unknown Supabase error",
    details: error.details ?? "not reported",
    hint: error.hint ?? "not reported",
  });
}

export async function getPublicProductReviews(productId: string, options: { rating: ReviewRatingFilter; sort: ReviewSort; limit: number }) {
  const supabase = await createClient();
  let query = supabase.from("product_reviews")
    .select("id, reviewer_name, rating, title, review_text, is_verified_buyer, helpful_count, unhelpful_count, created_at", { count: "exact" })
    .eq("product_id", productId).eq("status", "approved");
  if (options.rating !== "all") query = query.eq("rating", options.rating);
  if (options.sort === "highest") query = query.order("rating", { ascending: false }).order("created_at", { ascending: false });
  else if (options.sort === "lowest") query = query.order("rating", { ascending: true }).order("created_at", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const [summaryResult, reviewResult] = await Promise.all([
    supabase.rpc("get_product_review_summary", { p_product_id: productId }).maybeSingle<SummaryRow>(),
    query.range(0, options.limit - 1).returns<PublicReview[]>(),
  ]);
  logReviewQueryError("summary", summaryResult.error);
  logReviewQueryError("list", reviewResult.error);
  const row = summaryResult.data;
  const summary = row ? {
    totalReviews: Number(row.total_reviews), averageRating: row.average_rating === null ? null : Number(row.average_rating),
    counts: { 1: Number(row.one_star), 2: Number(row.two_star), 3: Number(row.three_star), 4: Number(row.four_star), 5: Number(row.five_star) },
  } satisfies ReviewSummary : emptySummary;
  return {
    summary,
    reviews: reviewResult.data ?? [],
    hasMore: (reviewResult.count ?? 0) > options.limit,
    hasError: Boolean(summaryResult.error || reviewResult.error),
  };
}

export async function getAdminProductReviews(status: ProductReview["status"] | "all") {
  const supabase = await createClient();
  let query = supabase.from("product_reviews")
    .select("id, product_id, reviewer_name, rating, title, review_text, is_verified_buyer, status, helpful_count, unhelpful_count, created_at, updated_at, product:products(name, slug)")
    .order("created_at", { ascending: false }).limit(100);
  if (status !== "all") query = query.eq("status", status);
  const { data, error } = await query;
  logReviewQueryError("admin list", error);
  return { reviews: (data ?? []) as unknown as Array<Omit<ProductReview, "user_id"> & { product: { name: string; slug: string } | null }>, hasError: Boolean(error) };
}
