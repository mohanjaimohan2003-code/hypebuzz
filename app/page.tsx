import { Navbar } from "@/components/layout/navbar";

const featuredCards = [
  {
    title: "Hot deals",
    description: "Fresh discounts on trending tech and lifestyle picks.",
  },
  {
    title: "Smart discovery",
    description: "Find products curated around your interests and goals.",
  },
  {
    title: "Fast comparisons",
    description: "Compare specs, pricing, and value in seconds.",
  },
] as const;

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F8FAFC] px-4 py-8 sm:px-6 lg:px-8" id="main-content">
        <section className="mx-auto flex max-w-7xl flex-col gap-10 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm sm:p-10 lg:flex-row lg:items-center lg:justify-between lg:p-16">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              New • HypeBuzz discovery experience
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Discover the next favorite product in minutes.
            </h1>
            <p className="mt-5 text-lg text-slate-600 sm:text-xl">
              Explore trending picks, compare options, and save favorites in a polished shopping experience built for modern buyers.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                className="rounded-full bg-slate-900 px-6 py-3 text-center font-semibold text-white transition hover:bg-slate-700"
                href="/categories"
              >
                Explore products
              </a>
              <a
                className="rounded-full border border-slate-300 px-6 py-3 text-center font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                href="/wishlist"
              >
                View wishlist
              </a>
            </div>
          </div>

          <div className="w-full max-w-xl rounded-[24px] bg-slate-950 p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Today’s spotlight</p>
                <p className="mt-1 text-2xl font-semibold">Aurora Headphones</p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm">Trending</span>
            </div>
            <div className="mt-6 grid gap-3">
              {featuredCards.map((card) => (
                <div key={card.title} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <h2 className="font-semibold">{card.title}</h2>
                  <p className="mt-1 text-sm text-slate-300">{card.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
