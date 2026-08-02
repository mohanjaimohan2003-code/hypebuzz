import { REVIEW_NAME_MAX, REVIEW_TEXT_MAX, REVIEW_TITLE_MAX } from "@/lib/reviews/model";

export type ReviewSubmissionInput = { rating: unknown; reviewerName: unknown; title: unknown; reviewText: unknown };
export type ReviewField = "rating" | "reviewerName" | "title" | "reviewText";

export function validateReviewSubmission(input: ReviewSubmissionInput) {
  const errors: Partial<Record<ReviewField, string>> = {};
  const rating = typeof input.rating === "number" ? input.rating : Number(String(input.rating ?? ""));
  const reviewerName = typeof input.reviewerName === "string" ? input.reviewerName.trim() : "";
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const reviewText = typeof input.reviewText === "string" ? input.reviewText.trim() : "";
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.rating = "Choose a rating from 1 to 5.";
  if (!reviewerName) errors.reviewerName = "Enter a display name.";
  else if (reviewerName.length > REVIEW_NAME_MAX) errors.reviewerName = `Display name must be ${REVIEW_NAME_MAX} characters or fewer.`;
  if (title.length > REVIEW_TITLE_MAX) errors.title = `Title must be ${REVIEW_TITLE_MAX} characters or fewer.`;
  if (!reviewText) errors.reviewText = "Write a review before submitting.";
  else if (reviewText.length > REVIEW_TEXT_MAX) errors.reviewText = `Review must be ${REVIEW_TEXT_MAX} characters or fewer.`;
  return Object.keys(errors).length ? { success: false as const, errors } : {
    success: true as const,
    data: { rating, reviewerName, title: title || null, reviewText },
  };
}
