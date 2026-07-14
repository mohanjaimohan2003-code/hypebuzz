export function CategoryStatusBadge({ isActive }: { isActive: boolean }) {
  const style = isActive
    ? {
        label: "Active",
        className: "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]",
        dot: "bg-[#16A34A]",
      }
    : {
        label: "Inactive",
        className: "border-[#D1D5DB] bg-[#F3F4F6] text-[#4B5563]",
        dot: "bg-[#6B7280]",
      };

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${style.className}`}>
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}
