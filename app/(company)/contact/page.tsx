import type { Metadata } from "next";
import { CompanyCta } from "@/components/company/company-cta";
import { CompanyHero } from "@/components/company/company-hero";
import { absoluteUrl } from "@/lib/seo/site";

const description = "Contact HypeBuzz for platform support, product-information questions, merchant participation, affiliate enquiries, and business opportunities.";

export const metadata: Metadata = {
  title: "Contact HypeBuzz",
  description,
  alternates: { canonical: absoluteUrl("/contact") },
  openGraph: { type: "website", title: "Contact HypeBuzz", description, url: absoluteUrl("/contact"), siteName: "HypeBuzz" },
  twitter: { card: "summary_large_image", title: "Contact HypeBuzz", description },
};

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/hypebuzz/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/hypebuzz/" },
  { label: "YouTube", href: "https://www.youtube.com/@hypebuzz" },
  { label: "X", href: "https://x.com/hypebuzz" },
  { label: "Facebook", href: "https://www.facebook.com/hypebuzz/" },
] as const;

const fieldClass = "mt-2 min-h-11 w-full rounded-[10px] border border-[#D1D5DB] bg-white px-4 py-3 text-[#111827] outline-none transition-colors placeholder:text-[#6B7280] hover:border-[#9CA3AF] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 motion-reduce:transition-none";

export default function ContactPage() {
  return (
    <>
      <CompanyHero eyebrow="Get in touch" subtitle="We’d love to hear from you." title="Contact HypeBuzz" />

      <section className="mx-auto grid max-w-[1280px] gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <div className="space-y-6">
          <article className="rounded-2xl border border-[#DCE3EC] bg-white p-6 sm:p-8"><h2 className="text-2xl font-bold tracking-tight text-[#111827]">Contact information</h2><p className="mt-3 leading-7 text-[#4B5563]">Choose the address that best matches your enquiry. Providing relevant context helps the team direct your message appropriately.</p><dl className="mt-7 divide-y divide-[#E5E7EB]"><div className="py-4 first:pt-0"><dt className="text-sm font-semibold text-[#6B7280]">Support email</dt><dd className="mt-1"><a className="rounded font-semibold text-[#1D4ED8] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]" href="mailto:support@hypebuzz.in">support@hypebuzz.in</a></dd></div><div className="py-4"><dt className="text-sm font-semibold text-[#6B7280]">Business email</dt><dd className="mt-1"><a className="rounded font-semibold text-[#1D4ED8] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]" href="mailto:business@hypebuzz.in">business@hypebuzz.in</a></dd></div><div className="py-4"><dt className="text-sm font-semibold text-[#6B7280]">Location</dt><dd className="mt-1 font-semibold text-[#111827]">India</dd></div><div className="pt-4"><dt className="text-sm font-semibold text-[#6B7280]">Response time</dt><dd className="mt-1 font-semibold text-[#111827]">Typically within 2 business days</dd></div></dl></article>
          <nav aria-label="HypeBuzz social media" className="rounded-2xl border border-[#DCE3EC] bg-white p-6 sm:p-8"><h2 className="text-xl font-semibold text-[#111827]">Connect with HypeBuzz</h2><p className="mt-2 leading-7 text-[#4B5563]">Follow official HypeBuzz channels for company and platform updates.</p><ul className="mt-5 flex flex-wrap gap-3">{socialLinks.map((link) => <li key={link.label}><a className="inline-flex min-h-11 items-center rounded-[10px] border border-[#D1D5DB] px-4 text-sm font-semibold text-[#111827] transition-colors hover:border-[#2563EB] hover:bg-[#EFF6FF] hover:text-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 motion-reduce:transition-none" href={link.href} rel="noreferrer" target="_blank">{link.label}<span className="sr-only"> (opens in a new tab)</span></a></li>)}</ul></nav>
        </div>

        <section aria-labelledby="contact-form-title" className="rounded-2xl border border-[#DCE3EC] bg-white p-6 sm:p-8 lg:p-10"><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#2563EB]">Contact form</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-[#111827]" id="contact-form-title">Send a message</h2><p className="mt-3 leading-7 text-[#4B5563]">Use this form to prepare an enquiry. Online submission is not yet active, so please email the appropriate address for a response.</p><form aria-describedby="contact-form-status" className="mt-8 space-y-5"><div><label className="text-sm font-semibold text-[#374151]" htmlFor="full-name">Full Name</label><input autoComplete="name" className={fieldClass} id="full-name" name="fullName" placeholder="Your full name" type="text" /></div><div><label className="text-sm font-semibold text-[#374151]" htmlFor="email-address">Email Address</label><input autoComplete="email" className={fieldClass} id="email-address" name="email" placeholder="you@example.com" type="email" /></div><div><label className="text-sm font-semibold text-[#374151]" htmlFor="subject">Subject</label><input className={fieldClass} id="subject" name="subject" placeholder="What is your enquiry about?" type="text" /></div><div><label className="text-sm font-semibold text-[#374151]" htmlFor="message">Message</label><textarea className={`${fieldClass} min-h-36 resize-y`} id="message" name="message" placeholder="Provide the details that will help us understand your enquiry" rows={5} /></div><div><button className="inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center rounded-[10px] bg-[#CBD5E1] px-6 font-semibold text-[#475569] sm:w-auto" disabled type="submit">Send Message</button><p className="mt-3 text-sm font-medium text-[#4B5563]" id="contact-form-status" role="status">Contact functionality coming soon.</p></div></form></section>
      </section>

      <CompanyCta description="While online form submission is being prepared, you can continue exploring HypeBuzz or learn more about how the platform approaches comparison." secondaryHref="/about" secondaryLabel="About HypeBuzz" title="Explore the platform" />
    </>
  );
}
