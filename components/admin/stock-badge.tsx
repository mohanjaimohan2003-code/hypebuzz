import type { OfferStockStatus } from "@/lib/validation/offer";

const stockStyles: Record<OfferStockStatus, { label: string; className: string; dot: string }> = {
  in_stock: {
    label: "In Stock",
    className: "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]",
    dot: "bg-[#16A34A]",
  },
  limited_stock: {
    label: "Limited Stock",
    className: "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]",
    dot: "bg-[#D97706]",
  },
  out_of_stock: {
    label: "Out of Stock",
    className: "border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]",
    dot: "bg-[#DC2626]",
  },
};

export function StockBadge({ status }: { status: OfferStockStatus | null }) {
  const style = status
    ? stockStyles[status]
    : { label: "Not set", className: "border-[#D1D5DB] bg-[#F3F4F6] text-[#4B5563]", dot: "bg-[#9CA3AF]" };

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${style.className}`}>
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}
