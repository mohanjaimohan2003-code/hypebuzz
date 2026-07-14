export default function CategoriesLoading() {
  return (
    <div aria-busy="true" aria-label="Loading categories">
      <div className="h-5 w-28 animate-pulse rounded bg-[#E5E7EB] motion-reduce:animate-none" />
      <div className="mt-3 h-10 w-56 animate-pulse rounded bg-[#E5E7EB] motion-reduce:animate-none" />
      <div className="mt-8 h-28 animate-pulse rounded-2xl bg-[#E5E7EB] motion-reduce:animate-none" />
      <div className="mt-6 h-96 animate-pulse rounded-2xl bg-[#E5E7EB] motion-reduce:animate-none" />
    </div>
  );
}
