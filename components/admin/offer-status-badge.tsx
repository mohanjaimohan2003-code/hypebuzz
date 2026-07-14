export function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#BBF7D0] bg-[#F0FDF4] px-2.5 py-1 text-xs font-semibold text-[#166534]">
      <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#16A34A]" /> Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#D1D5DB] bg-[#F3F4F6] px-2.5 py-1 text-xs font-semibold text-[#4B5563]">
      <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#6B7280]" /> Inactive
    </span>
  );
}
