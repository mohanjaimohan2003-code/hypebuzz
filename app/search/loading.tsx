export default function SearchLoading() {
  return (
    <main className="min-h-screen bg-[#F8FAFC]" id="main-content">
      <div className="mx-auto max-w-[1280px] animate-pulse px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-9 w-64 rounded bg-[#E5E7EB]" /><div className="mt-3 h-5 w-28 rounded bg-[#E5E7EB]" />
        <div className="mt-8 flex gap-6"><div className="hidden h-[560px] w-[280px] rounded-2xl bg-[#E5E7EB] lg:block" /><div className="grid min-w-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-[420px] rounded-2xl bg-[#E5E7EB]" />)}</div></div>
      </div>
    </main>
  );
}
