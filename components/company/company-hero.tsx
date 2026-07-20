import Image from "next/image";

type CompanyHeroProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

export function CompanyHero({ eyebrow, title, subtitle }: CompanyHeroProps) {
  return (
    <header className="relative isolate overflow-hidden border-b border-[#172554] bg-[#020817] text-white">
      <div aria-hidden="true" className="absolute left-1/2 top-0 -z-10 h-72 w-[min(48rem,90vw)] -translate-x-1/2 rounded-full bg-[#2563EB]/20 blur-3xl" />
      <div className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="inline-flex rounded-[10px] border border-white/15 bg-white px-4 py-3 shadow-lg shadow-black/20">
          <Image alt="HypeBuzz" className="h-auto w-32 sm:w-36" height={887} priority src="/brand/hypebuzz-logo.png" width={1774} />
        </div>
        <p className="mt-8 text-sm font-bold uppercase tracking-[0.18em] text-[#60A5FA]">{eyebrow}</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{subtitle}</p>
      </div>
    </header>
  );
}
