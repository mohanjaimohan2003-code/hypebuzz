import type { ReviewSummary as Summary } from "@/lib/reviews/model";
import { ReviewStars } from "./review-stars";

export function ReviewSummary({ summary }: { summary: Summary }) {
  if (!summary.totalReviews || summary.averageRating === null) return null;
  return <div className="grid gap-5 rounded-2xl bg-[#F8FAFC] p-5 sm:grid-cols-[8rem_1fr] sm:items-center">
    <div><p className="text-4xl font-bold tracking-tight text-[#111827]">{summary.averageRating.toFixed(1)}</p><ReviewStars rating={summary.averageRating} /><p className="mt-1 text-sm text-[#6B7280]">Out of 5</p></div>
    <div className="space-y-2">{([5, 4, 3, 2, 1] as const).map((rating) => {
      const percentage = Math.round((summary.counts[rating] / summary.totalReviews) * 100);
      return <div className="grid grid-cols-[2.5rem_1fr_2.75rem] items-center gap-2 text-xs" key={rating}>
        <span className="font-semibold text-[#374151]">{rating} ★</span><div aria-label={`${percentage}% of reviews are ${rating} stars`} className="h-2 overflow-hidden rounded-full bg-[#E5E7EB]" role="img"><div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${percentage}%` }} /></div><span className="text-right tabular-nums text-[#6B7280]">{percentage}%</span>
      </div>;
    })}</div>
  </div>;
}
