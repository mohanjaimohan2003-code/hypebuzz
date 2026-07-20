import Image from "next/image";
import Link from "next/link";

const companyLinks = [
  { label: "About HypeBuzz", href: "/about" },
  { label: "Mission & Vision", href: "/mission" },
  { label: "How HypeBuzz Works", href: "/how-it-works" },
  { label: "Contact", href: "/contact" },
  { label: "Careers", href: "/careers" },
  { label: "Buying Guides", href: "/guides" },
  { label: "Knowledge Hub", href: "/knowledge-hub" },
  { label: "Deal Insights", href: "/deal-insights" },
  { label: "Help Center", href: "/help" },
  { label: "FAQs", href: "/faq" },
  { label: "Report Incorrect Information", href: "/report-information" },
  { label: "Suggest a Product", href: "/suggest-product" },
] as const;

const platformLinks = [
  { label: "Product Search", href: "/search" },
  { label: "Categories", href: "/categories/mobiles" },
  { label: "Brands", href: "/search" },
  { label: "Merchants", href: "/search" },
  { label: "Price Comparison", href: "/search" },
  { label: "Trending Deals", href: "/search?sort=popular" },
] as const;

const legalLinks = [
  { label: "Affiliate Disclosure", href: "/affiliate-disclosure" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Disclaimer", href: "/disclaimer" },
  { label: "Editorial Policy", href: "/editorial-policy" },
  { label: "Accuracy Policy", href: "/accuracy-policy" },
  { label: "Cookie Policy", href: "/cookies" },
  { label: "Accessibility Statement", href: "/accessibility" },
  { label: "Trademark Notice", href: "/trademark-notice" },
] as const;

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/hypebuzz/", icon: "instagram" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/hypebuzz/", icon: "linkedin" },
  { label: "YouTube", href: "https://www.youtube.com/@hypebuzz", icon: "youtube" },
  { label: "X", href: "https://x.com/hypebuzz", icon: "x" },
  { label: "Facebook", href: "https://www.facebook.com/hypebuzz/", icon: "facebook" },
] as const;

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050A14]";
const linkClass = `inline-flex min-h-11 items-center rounded-md text-sm leading-5 text-slate-400 transition-colors duration-150 hover:text-[#60A5FA] motion-reduce:transition-none ${focusRing}`;

function SocialIcon({ name }: { name: (typeof socialLinks)[number]["icon"] }) {
  if (name === "instagram") return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><rect height="16" rx="4" stroke="currentColor" strokeWidth="1.8" width="16" x="4" y="4"/><circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8"/><circle cx="17.4" cy="6.7" fill="currentColor" r="1"/></svg>;
  if (name === "linkedin") return <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24"><path d="M6.5 8.3A1.8 1.8 0 1 0 6.5 4.7a1.8 1.8 0 0 0 0 3.6ZM5 10h3v9H5v-9Zm5 0h2.9v1.2h.1c.4-.8 1.5-1.6 3.1-1.6 3.2 0 3.9 2.1 3.9 5V19h-3v-4c0-1 0-2.6-1.7-2.6s-2 1.2-2 2.5V19h-3v-9Z"/></svg>;
  if (name === "youtube") return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><path d="M20 8.1a2.5 2.5 0 0 0-1.8-1.8C16.7 5.9 12 5.9 12 5.9s-4.7 0-6.2.4A2.5 2.5 0 0 0 4 8.1a26 26 0 0 0-.4 3.9 26 26 0 0 0 .4 3.9 2.5 2.5 0 0 0 1.8 1.8c1.5.4 6.2.4 6.2.4s4.7 0 6.2-.4a2.5 2.5 0 0 0 1.8-1.8 26 26 0 0 0 .4-3.9 26 26 0 0 0-.4-3.9Z" stroke="currentColor" strokeWidth="1.8"/><path d="m10 9.5 5 2.5-5 2.5v-5Z" fill="currentColor"/></svg>;
  if (name === "x") return <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24"><path d="M5.4 4h4.1l3.3 4.5L16.7 4h1.9l-4.9 5.8L19.2 20h-4.1l-3.7-5.1L7.1 20H5.2l5.3-6.4L5.4 4Zm3.2 1.5H7.9l8.3 13h.7l-8.3-13Z"/></svg>;
  return <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24"><path d="M13.8 20v-7h2.4l.4-2.8h-2.8V8.4c0-.8.2-1.4 1.4-1.4h1.5V4.5c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.1H8.3V13h2.5v7h3Z"/></svg>;
}

function LinkList({ links, columns = false }: { links: ReadonlyArray<{ label: string; href: string }>; columns?: boolean }) {
  return <ul className={`mt-3 ${columns ? "grid grid-cols-1 gap-x-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2" : "space-y-0"}`}>{links.map((link) => <li key={link.label}><Link className={linkClass} href={link.href}>{link.label}</Link></li>)}</ul>;
}

export function Footer() {
  return (
    <footer className="overflow-x-clip border-t border-slate-800 bg-[#050A14] text-white">
      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-4 border-b border-slate-800 pb-7 sm:flex-row sm:items-center sm:justify-between">
          <Link aria-label="HypeBuzz home" className={`inline-flex w-fit rounded-[10px] ${focusRing}`} href="/">
            <Image alt="" className="h-auto w-36" height={887} src="/brand/hypebuzz-logo.png" width={1774} />
          </Link>
          <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-right">HypeBuzz helps people compare products, evaluate genuine offers, and make confident purchasing decisions.</p>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-8 py-8 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_1.1fr_0.65fr]">
          <nav aria-label="Company links">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-100">Company</h2>
            <LinkList columns links={companyLinks} />
          </nav>
          <nav aria-label="Platform links">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-100">Platform</h2>
            <LinkList links={platformLinks} />
          </nav>
          <nav aria-label="Legal links">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-100">Legal</h2>
            <LinkList columns links={legalLinks} />
          </nav>
          <nav aria-label="HypeBuzz social media">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-100">Social</h2>
            <ul className="mt-3 flex flex-wrap gap-2 lg:max-w-28">
              {socialLinks.map((social) => <li key={social.label}><a aria-label={`${social.label} (opens in a new tab)`} className={`flex h-11 w-11 items-center justify-center rounded-[10px] border border-slate-700 bg-[#0B1220] text-slate-300 transition-colors duration-150 hover:border-[#3B82F6] hover:text-[#60A5FA] motion-reduce:transition-none ${focusRing}`} href={social.href} rel="noopener noreferrer" target="_blank"><span className="h-5 w-5"><SocialIcon name={social.icon} /></span></a></li>)}
            </ul>
          </nav>
        </div>

        <div className="border-t border-slate-800 pt-6 text-xs leading-5 text-slate-500">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 HypeBuzz. All rights reserved.</p>
            <p className="text-slate-400">India-based. Built with purpose in India.</p>
          </div>
          <div className="mt-3 grid gap-1.5 lg:grid-cols-3 lg:gap-6">
            <p>HypeBuzz is an independent shopping comparison and affiliate platform.</p>
            <p>Prices, availability, and product information may change on merchant websites.</p>
            <p>Affiliate links may earn HypeBuzz a commission at no additional cost to the user.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
