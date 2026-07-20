import Link from "next/link";

export function HomeEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-5 py-10 text-center">
      <p className="font-semibold text-[#111827]">Nothing to show here yet</p>
      <p className="mt-2 text-sm leading-6 text-[#6B7280]">{message}</p>
      <Link className="mt-4 inline-flex min-h-11 items-center rounded-[10px] px-4 text-sm font-semibold text-[#1D4ED8] hover:bg-[#EFF6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]" href="/search">Browse all products</Link>
    </div>
  );
}
