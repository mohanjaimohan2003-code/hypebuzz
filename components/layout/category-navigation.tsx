"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { categoryGroups, topCategories } from "@/lib/data/categories";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060A12]";
const isActive = (pathname: string, href: string) => href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

export function CategoryNavigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  function closeMenu(restoreFocus = false) { setIsOpen(false); if (restoreFocus) requestAnimationFrame(() => buttonRef.current?.focus()); }

  useEffect(() => {
    if (!isOpen) return;
    firstLinkRef.current?.focus();
    function pointer(event: PointerEvent) { if (!containerRef.current?.contains(event.target as Node)) closeMenu(); }
    function keyboard(event: KeyboardEvent) { if (event.key === "Escape") { event.preventDefault(); closeMenu(true); } }
    document.addEventListener("pointerdown", pointer); document.addEventListener("keydown", keyboard);
    return () => { document.removeEventListener("pointerdown", pointer); document.removeEventListener("keydown", keyboard); };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative border-t border-white/10 bg-[#060A12] text-white">
      <nav aria-label="Product categories" className="mx-auto max-w-[1440px] px-3 sm:px-6 lg:px-8">
        <ul className="flex h-13 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {topCategories.map((category) => { const active = isActive(pathname, category.href); return <li key={category.href} className="shrink-0"><Link aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors ${focusRing} ${active ? "bg-white/10 text-[#60A5FA] shadow-[inset_0_-2px_0_#2563EB]" : category.accent ? "text-[#3B82F6] hover:bg-white/10" : "text-slate-200 hover:bg-white/10 hover:text-white"}`} href={category.href}>{category.label}</Link></li>; })}
          <li className="shrink-0"><button ref={buttonRef} aria-controls="all-categories-menu" aria-expanded={isOpen} aria-haspopup="menu" className={`flex min-h-11 items-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors ${focusRing} ${isOpen ? "bg-white/10 text-[#60A5FA]" : "text-slate-200 hover:bg-white/10 hover:text-white"}`} onClick={() => setIsOpen((open) => !open)} type="button">All Categories<svg aria-hidden="true" className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24"><path d="m7 10 5 5 5-5" stroke="currentColor" strokeWidth="2" /></svg></button></li>
        </ul>
      </nav>
      {isOpen ? <div aria-label="All categories" className="absolute inset-x-0 top-full z-50 border-y border-[#E5E7EB] bg-white text-[#111827] shadow-2xl" id="all-categories-menu" role="menu"><div className="mx-auto grid max-h-[70vh] max-w-7xl grid-cols-2 gap-6 overflow-y-auto px-4 py-6 sm:grid-cols-3 lg:grid-cols-5">{categoryGroups.map((group, index) => <section key={group.href} aria-labelledby={`group-${index}`}><h2 id={`group-${index}`}><Link ref={index === 0 ? firstLinkRef : undefined} className="inline-flex min-h-11 items-center rounded-md font-bold hover:text-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]" href={group.href} onClick={() => closeMenu()} role="menuitem">{group.label}</Link></h2><ul>{group.items.map((item) => <li key={item.href}><Link className="flex min-h-10 items-center rounded-md px-2 text-sm text-[#6B7280] hover:bg-[#EFF6FF] hover:text-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]" href={item.href} onClick={() => closeMenu()} role="menuitem">{item.label}</Link></li>)}</ul></section>)}</div></div> : null}
    </div>
  );
}
