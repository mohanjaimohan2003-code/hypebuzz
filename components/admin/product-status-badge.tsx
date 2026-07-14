import type { ProductStatus } from "@/lib/types/database";

const statusStyles: Record<ProductStatus, { label: string; className: string; dot: string }> = {
  draft: {
    label: "Draft",
    className: "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]",
    dot: "bg-[#2563EB]",
  },
  published: {
    label: "Published",
    className: "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]",
    dot: "bg-[#16A34A]",
  },
  archived: {
    label: "Archived",
    className: "border-[#D1D5DB] bg-[#F3F4F6] text-[#4B5563]",
    dot: "bg-[#6B7280]",
  },
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const style = statusStyles[status];

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${style.className}`}>
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}
