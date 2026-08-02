import type { PublicReview } from "@/lib/reviews/model";
import { ReviewStars } from "./review-stars";

function initials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?"; }
function date(value: string) { return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value)); }

export function ReviewCard({ review }: { review: PublicReview }) {
  return <article className="border-t border-[#E5E7EB] py-6 first:border-t-0 first:pt-0">
    <div className="flex gap-3"><div aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DBEAFE] text-sm font-bold text-[#1D4ED8]">{initials(review.reviewer_name)}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-[#111827]">{review.reviewer_name}</h3>{review.is_verified_buyer ? <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-xs font-semibold text-[#166534]">Verified Buyer ✓</span> : null}</div><time className="text-xs text-[#6B7280]" dateTime={review.created_at}>{date(review.created_at)}</time></div></div>
    <div className="mt-3 flex items-center gap-2"><ReviewStars rating={review.rating} size="sm" /><span className="text-sm font-bold tabular-nums text-[#111827]">{review.rating.toFixed(1)}</span></div>
    {review.title ? <h4 className="mt-3 font-bold text-[#111827]">{review.title}</h4> : null}<p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-[#4B5563]">{review.review_text}</p>
    {(review.helpful_count > 0 || review.unhelpful_count > 0) ? <p className="mt-4 text-xs text-[#6B7280]">Helpful feedback: 👍 {review.helpful_count} · 👎 {review.unhelpful_count}</p> : null}
  </article>;
}
