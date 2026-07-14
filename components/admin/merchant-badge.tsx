export function MerchantBadge({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#111827]">
      <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#EFF6FF] text-xs font-bold text-[#1D4ED8]">
        {initials || "M"}
      </span>
      {name}
    </span>
  );
}
