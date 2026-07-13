export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading admin page" role="status">
      <div className="h-4 w-28 animate-pulse rounded bg-[#DBEAFE] motion-reduce:animate-none" />
      <div className="mt-3 h-10 w-56 max-w-full animate-pulse rounded bg-[#E5E7EB] motion-reduce:animate-none" />
      <div className="mt-4 h-5 w-full max-w-xl animate-pulse rounded bg-[#E5E7EB] motion-reduce:animate-none" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 7 }, (_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-2xl border border-[#E5E7EB] bg-white motion-reduce:animate-none"
          />
        ))}
      </div>
      <span className="sr-only">Loading admin content...</span>
    </div>
  );
}
