import Image from "next/image";
import Link from "next/link";

const footerGroups = [
  {
    title: "Discover",
    links: [
      { label: "Trending", href: "/trending" },
      { label: "Deals", href: "/deals" },
      { label: "Categories", href: "/categories" },
      { label: "Collections", href: "/collections" },
    ],
  },
  {
    title: "HypeBuzz",
    links: [
      { label: "About", href: "/about" },
      { label: "Methodology", href: "/methodology" },
      { label: "Affiliate disclosure", href: "/affiliate-disclosure" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#030712] text-white">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-10 sm:px-6 md:grid-cols-[minmax(0,1.5fr)_1fr_1fr] lg:px-8 lg:py-12">
        <div>
          <Link aria-label="HypeBuzz home" className="inline-flex rounded-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2 focus-visible:ring-offset-[#030712]" href="/">
            <Image alt="" className="h-auto w-36" height={887} src="/brand/hypebuzz-logo.png" width={1774} />
          </Link>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">Compare products and discover handpicked deals across trusted online stores.</p>
          <p className="mt-4 max-w-md text-xs leading-5 text-slate-400">HypeBuzz is a product-discovery service. Prices and availability can change at the destination store. Some outbound links may be affiliate links.</p>
        </div>

        {footerGroups.map((group) => (
          <nav key={group.title} aria-label={`${group.title} links`}>
            <h2 className="text-sm font-bold text-white">{group.title}</h2>
            <ul className="mt-3 space-y-1">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link className="inline-flex min-h-10 items-center rounded-md text-sm text-slate-300 transition-colors hover:text-[#60A5FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] motion-reduce:transition-none" href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-[1280px] px-4 py-5 text-xs text-slate-400 sm:px-6 lg:px-8">© 2026 HypeBuzz. Built for clearer product discovery.</p>
      </div>
    </footer>
  );
}
