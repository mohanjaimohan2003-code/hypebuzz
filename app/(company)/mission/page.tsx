import type { Metadata } from "next";
import { CompanyCta } from "@/components/company/company-cta";
import { CompanyHero } from "@/components/company/company-hero";
import { absoluteUrl } from "@/lib/seo/site";

const description = "Read the HypeBuzz mission, vision, operating principles, and responsible goals for building clearer product comparisons and smarter shopping tools.";

export const metadata: Metadata = {
  title: "Mission & Vision",
  description,
  alternates: { canonical: absoluteUrl("/mission") },
  openGraph: { type: "website", title: "Mission & Vision | HypeBuzz", description, url: absoluteUrl("/mission"), siteName: "HypeBuzz" },
  twitter: { card: "summary_large_image", title: "Mission & Vision | HypeBuzz", description },
};

const principles = [
  { title: "Transparency", text: "Explain how comparisons, recommendations, and affiliate relationships are presented so users can judge the information for themselves." },
  { title: "Innovation", text: "Use technology selectively to reduce research effort, improve relevance, and make complex shopping information easier to navigate." },
  { title: "Accuracy", text: "Build processes that support dependable product and offer information while acknowledging that online market data can change." },
  { title: "Customer Trust", text: "Protect long-term user confidence by avoiding misleading urgency, unsupported claims, and design patterns that pressure a decision." },
  { title: "Continuous Improvement", text: "Review platform quality, learn from identified issues, and refine the experience as user needs and available information evolve." },
] as const;

const goals = [
  { title: "Better comparisons", text: "Make relevant differences between products and offers easier to identify without overwhelming users with low-value detail." },
  { title: "Price insights", text: "Develop responsible ways to add context around price changes and offer value when suitable, dependable data is available." },
  { title: "Smarter shopping tools", text: "Explore tools that help people narrow options according to genuine requirements rather than promotional popularity alone." },
  { title: "Improved user experience", text: "Keep research fast, readable, accessible, and effective across mobile, tablet, and desktop devices." },
] as const;

export default function MissionPage() {
  return (
    <>
      <CompanyHero eyebrow="What guides us" subtitle="Building a smarter way to discover products and compare prices." title="Mission & Vision" />

      <section className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8"><div className="grid gap-6 lg:grid-cols-2"><article className="rounded-2xl border border-[#DCE3EC] bg-white p-7 sm:p-10"><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#2563EB]">Our mission</p><h2 className="mt-4 text-3xl font-bold tracking-tight text-[#111827]">Turn scattered shopping information into useful understanding</h2><p className="mt-5 text-lg leading-8 text-[#4B5563]">HypeBuzz exists to help people make informed purchasing decisions by organising product details, price information, and offer context into comparisons that are clear, relevant, and honest about their limitations.</p></article><article className="rounded-2xl border border-[#1D4ED8] bg-[#0B1220] p-7 text-white sm:p-10"><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#60A5FA]">Our vision</p><h2 className="mt-4 text-3xl font-bold tracking-tight">A more understandable online shopping environment</h2><p className="mt-5 text-lg leading-8 text-slate-300">We want HypeBuzz to earn lasting confidence by helping Indian shoppers evaluate choices with greater clarity. That means building patiently, disclosing commercial relationships, and measuring progress through the usefulness and integrity of the experience—not unsupported market claims.</p></article></div></section>

      <section className="border-y border-[#E5E7EB] bg-white"><div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8"><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#2563EB]">Core principles</p><h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-[#111827]">The standards behind our decisions</h2><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{principles.map((principle) => <article key={principle.title} className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-6"><h3 className="text-xl font-semibold text-[#111827]">{principle.title}</h3><p className="mt-3 leading-7 text-[#4B5563]">{principle.text}</p></article>)}</div></div></section>

      <section className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8"><div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#2563EB]">Platform goals</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-[#111827]">Practical improvements with a clear purpose</h2><p className="mt-5 text-lg leading-8 text-[#4B5563]">Our direction is centred on capabilities that can improve decision quality while keeping the platform understandable and dependable.</p></div><div className="mt-10 grid gap-4 sm:grid-cols-2">{goals.map((goal) => <article key={goal.title} className="rounded-2xl border border-[#DCE3EC] bg-white p-6"><h3 className="text-xl font-semibold text-[#111827]">{goal.title}</h3><p className="mt-3 leading-7 text-[#4B5563]">{goal.text}</p></article>)}</div></section>

      <section className="border-y border-[#E5E7EB] bg-[#EFF6FF]"><div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:grid lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-8"><div><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#2563EB]">Future innovation</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-[#111827]">Explore carefully. Introduce responsibly.</h2></div><div className="mt-6 space-y-4 text-lg leading-8 text-[#4B5563] lg:mt-0"><p>Future capabilities may include richer price context, improved comparison controls, and more relevant ways to discover products. These are areas of exploration, not promises of immediate availability.</p><p>Before a capability becomes part of the platform, it should have a dependable information basis, a clear benefit for users, and an experience that explains what the tool can—and cannot—determine.</p></div></div></section>

      <CompanyCta description="See how these principles shape the company, or begin exploring products and available offers." secondaryHref="/about" secondaryLabel="About HypeBuzz" title="See the mission in practice" />
    </>
  );
}
