import Link from "next/link";

type CompanyCtaProps = {
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1220]";

export function CompanyCta({
  title,
  description,
  primaryHref = "/search",
  primaryLabel = "Explore HypeBuzz",
  secondaryHref = "/about",
  secondaryLabel = "Learn about HypeBuzz",
}: CompanyCtaProps) {
  return (
    <section aria-labelledby="company-cta-title" className="bg-[#0B1220] text-white">
      <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:flex lg:items-center lg:justify-between lg:gap-12 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" id="company-cta-title">{title}</h2>
          <p className="mt-4 text-lg leading-8 text-slate-300">{description}</p>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:shrink-0">
          <Link className={`inline-flex min-h-12 items-center justify-center rounded-[10px] bg-[#2563EB] px-6 font-semibold text-white transition-colors hover:bg-[#1D4ED8] motion-reduce:transition-none ${focusRing}`} href={primaryHref}>{primaryLabel}</Link>
          <Link className={`inline-flex min-h-12 items-center justify-center rounded-[10px] border border-slate-600 bg-transparent px-6 font-semibold text-white transition-colors hover:border-[#60A5FA] hover:bg-white/5 motion-reduce:transition-none ${focusRing}`} href={secondaryHref}>{secondaryLabel}</Link>
        </div>
      </div>
    </section>
  );
}
