export function ReviewStars({ rating, label = true, size = "md" }: { rating: number; label?: boolean; size?: "sm" | "md" }) {
  const rounded = Math.round(rating);
  return <span aria-label={label ? `${rating.toFixed(1)} out of 5 stars` : undefined} className={`inline-flex tracking-[0.08em] ${size === "sm" ? "text-sm" : "text-lg"}`} role={label ? "img" : undefined}>
    {[1, 2, 3, 4, 5].map((star) => <span aria-hidden="true" className={star <= rounded ? "text-[#F59E0B]" : "text-[#D1D5DB]"} key={star}>★</span>)}
  </span>;
}
