import type { Metadata } from "next";
import { CompanyCta } from "@/components/company/company-cta";
import { CompanyHero } from "@/components/company/company-hero";
import { absoluteUrl } from "@/lib/seo/site";

const description = "Learn why HypeBuzz was created and how transparent product comparisons, responsible recommendations, and clear offer information support better shopping decisions.";

export const metadata: Metadata = {
  title: "About HypeBuzz",
  description,
  alternates: { canonical: absoluteUrl("/about") },
  openGraph: { type: "website", title: "About HypeBuzz", description, url: absoluteUrl("/about"), siteName: "HypeBuzz" },
  twitter: { card: "summary_large_image", title: "About HypeBuzz", description },
};

const values = [
  { title: "Transparency", text: "We explain comparisons clearly, identify commercial relationships, and avoid presenting promotional language as independent guidance." },
  { title: "Accuracy", text: "We treat product, price, availability, and merchant information as data that must be reviewed, maintained, and corrected when necessary." },
  { title: "Customer First", text: "We design around the quality of a user’s decision—not artificial urgency, unnecessary clicks, or short-term promotional outcomes." },
  { title: "Privacy", text: "We respect personal information and believe useful shopping tools should collect and use data only for clear, legitimate purposes." },
  { title: "Innovation", text: "We apply technology where it can make research clearer, comparisons more relevant, and the shopping experience easier to understand." },
] as const;

const steps = [
  { number: "01", title: "Search", text: "Discover products across relevant categories, brands, and participating merchants." },
  { number: "02", title: "Compare", text: "Review product information, available prices, and offer context in a consistent format." },
  { number: "03", title: "Evaluate", text: "Consider the details that influence value, including suitability, availability, and merchant terms." },
  { number: "04", title: "Choose", text: "Select the product and offer that align with your requirements, priorities, and budget." },
  { number: "05", title: "Shop confidently", text: "Continue to the merchant with a clearer understanding of the decision you are making." },
] as const;

const trustPoints = [
  { title: "Transparent affiliate relationships", text: "HypeBuzz may earn a commission from qualifying merchant referrals. This does not add to the user’s purchase price, and commercial relationships should be disclosed clearly." },
  { title: "Independent comparisons", text: "Comparison structure and editorial context are intended to help users assess relevant options rather than favour an offer solely because of commission." },
  { title: "Clear product information", text: "We aim to separate product facts, merchant-supplied details, and HypeBuzz guidance so users can understand what they are reading." },
  { title: "Continuous quality improvements", text: "Online product and offer data changes frequently. We improve our processes and correct information when issues are identified." },
  { title: "Responsible content practices", text: "We avoid unsupported superlatives, false scarcity, and claims that cannot be explained through available information or a documented approach." },
] as const;

export default function AboutPage() {
  return (
    <>
      <CompanyHero eyebrow="Our company" subtitle="Helping people shop smarter through transparent comparisons and genuine recommendations." title="About HypeBuzz" />

      <section className="mx-auto grid max-w-[1280px] gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#2563EB]">Our story</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-[#111827]">Making complex choices easier to understand</h2></div>
        <div className="max-w-3xl space-y-5 text-base leading-7 text-[#4B5563] sm:text-lg sm:leading-8">
          <p>HypeBuzz was created in response to a practical problem: online shoppers have access to more products and offers than ever, yet the information needed to make a sound decision is often fragmented across listings, merchant pages, and promotional campaigns.</p>
          <p>Prices can change, product descriptions can be inconsistent, and the lowest displayed amount may not tell the full story. Availability, seller context, product suitability, and the terms attached to an offer can all affect whether a purchase represents good value for a particular person.</p>
          <p>HypeBuzz brings relevant information into a clearer comparison experience. Our role is not to manufacture urgency or make the decision for the user. It is to reduce avoidable confusion, explain commercial relationships responsibly, and give people a stronger basis for choosing with confidence.</p>
        </div>
      </section>

      <section className="border-y border-[#E5E7EB] bg-white"><div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8"><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#2563EB]">Our values</p><h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-[#111827]">Standards that shape the platform</h2><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{values.map((value) => <article key={value.title} className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-6"><h3 className="text-xl font-semibold text-[#111827]">{value.title}</h3><p className="mt-3 leading-7 text-[#4B5563]">{value.text}</p></article>)}</div></div></section>

      <section className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8"><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#2563EB]">How HypeBuzz works</p><h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-[#111827]">A structured path from research to purchase</h2><div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-[#DCE3EC] bg-[#DCE3EC] sm:grid-cols-2 lg:grid-cols-5">{steps.map((step) => <article key={step.number} className="bg-white p-6"><p className="text-sm font-bold text-[#2563EB]">{step.number}</p><h3 className="mt-5 text-xl font-semibold text-[#111827]">{step.title}</h3><p className="mt-3 leading-7 text-[#4B5563]">{step.text}</p></article>)}</div></section>

      <section className="border-y border-[#E5E7EB] bg-[#EFF6FF]"><div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:grid lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-8"><div><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#2563EB]">Technology</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-[#111827]">Technology in service of clearer decisions</h2></div><div className="mt-6 space-y-4 text-lg leading-8 text-[#4B5563] lg:mt-0"><p>HypeBuzz uses modern web and data technologies to organise product information, support comparison workflows, and deliver a fast experience across devices.</p><p>Platform improvements are evaluated against practical outcomes: information should be easier to interpret, pages should remain responsive, and new capabilities should preserve transparency about sources, limitations, and commercial context.</p></div></div></section>

      <section className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8"><div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#2563EB]">Why trust HypeBuzz</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-[#111827]">Trust requires visible, repeatable practices</h2><p className="mt-5 text-lg leading-8 text-[#4B5563]">We do not ask users to rely on broad claims. We focus on practices that can make product discovery and comparison more accountable.</p></div><div className="mt-10 grid gap-4 md:grid-cols-2">{trustPoints.map((point) => <article key={point.title} className="rounded-2xl border border-[#E5E7EB] bg-white p-6"><h3 className="text-xl font-semibold text-[#111827]">{point.title}</h3><p className="mt-3 leading-7 text-[#4B5563]">{point.text}</p></article>)}</div></section>

      <CompanyCta description="Search the platform to compare available products and offers, or read about the principles guiding HypeBuzz." secondaryHref="/mission" secondaryLabel="Read our mission" title="Continue exploring HypeBuzz" />
    </>
  );
}
