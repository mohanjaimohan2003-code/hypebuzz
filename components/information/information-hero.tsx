import Image from "next/image";

type Props = { eyebrow: string; title: string; introduction: string; updatedLabel?: string; updatedDate?: string };

export function InformationHero({ eyebrow, title, introduction, updatedLabel, updatedDate }: Props) {
  return <header className="border-b border-[#172554] bg-[#050A14] text-white"><div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 sm:py-16 lg:px-8"><div className="inline-flex rounded-[10px] border border-white/15 bg-white px-3 py-2"><Image alt="HypeBuzz" className="h-auto w-28 sm:w-32" height={887} priority src="/brand/hypebuzz-logo.png" width={1774} /></div><p className="mt-7 text-sm font-bold uppercase tracking-[0.16em] text-[#60A5FA]">{eyebrow}</p><h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">{introduction}</p>{updatedLabel && updatedDate ? <p className="mt-5 text-sm font-medium text-slate-400">Last updated: <time dateTime={updatedDate}>{updatedLabel}</time></p> : null}</div></header>;
}
