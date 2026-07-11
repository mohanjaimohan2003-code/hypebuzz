"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { categoryGroups, topCategories } from "@/lib/data/categories";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2";
const isActive = (pathname: string, href: string) => href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

export function CategoryNavigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  function closeMenu(restoreFocus = false) {
    setIsOpen(false);
    if (restoreFocus) requestAnimationFrame(() => buttonRef.current?.focus());
  }

  useEffect(() => {
    if (!isOpen) return;
    firstLinkRef.current?.focus();
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) closeMenu();
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu(true);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative border-t border-[#E5E7EB] bg-white">
      <nav aria-label="Product categories" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ul className="flex h-12 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {topCategories.map((category) => {
            const active = isActive(pathname, category.href);
            return <li key={category.href} className="shrink-0"><Link aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center whitespace-nowrap rounded-[10px] px-3 text-sm font-semibold transition-colors duration-150 motion-reduce:transition-none ${focusRing} ${active ? "bg-[#EFF6FF] text-[#1D4ED8] shadow-[inset_0_-2px_0_#2563EB]" : category.accent ? "text-[#C2410C] hover:bg-orange-50" : "text-[#111827] hover:bg-[#EFF6FF] hover:text-[#1D4ED8]"}`} href={category.href}>{category.label}</Link></li>;
          })}
          <li className="shrink-0"><button ref={buttonRef} aria-controls="all-categories-menu" aria-expanded={isOpen} aria-haspopup="menu" className={`flex min-h-11 items-center gap-2 whitespace-nowrap rounded-[10px] px-3 text-sm font-semibold transition-colors duration-150 motion-reduce:transition-none ${focusRing} ${isOpen ? "bg-[#EFF6FF] text-[#1D4ED8]" : "text-[#111827] hover:bg-[#EFF6FF] hover:text-[#1D4ED8]"}`} onClick={() => setIsOpen((open) => !open)} type="button">All Categories<svg aria-hidden="true" className={`h-4 w-4 transition-transform duration-150 motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24"><path d="m7 10 5 5 5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg></button></li>
        </ul>
      </nav>
      {isOpen ? <div aria-label="All categories" className="absolute inset-x-0 top-full z-50 border-y border-[#E5E7EB] bg-white shadow-[0_16px_32px_rgba(17,24,39,0.12)]" id="all-categories-menu" role="menu"><div className="mx-auto grid max-h-[min(70vh,38rem)] max-w-7xl grid-cols-2 gap-x-6 gap-y-8 overflow-y-auto px-4 py-6 sm:grid-cols-3 sm:px-6 lg:grid-cols-5 lg:px-8">{categoryGroups.map((group, index) => <section key={group.href} aria-labelledby={`category-group-${index}`}><h2 id={`category-group-${index}`}><Link ref={index === 0 ? firstLinkRef : undefined} className={`inline-flex min-h-11 items-center rounded-md text-sm font-bold text-[#111827] hover:text-[#1D4ED8] ${focusRing}`} href={group.href} onClick={() => closeMenu()} role="menuitem">{group.label}</Link></h2><ul className="mt-1">{group.items.map((item) => <li key={item.href}><Link className={`flex min-h-11 items-center rounded-md px-2 text-sm text-[#6B7280] transition-colors hover:bg-[#EFF6FF] hover:text-[#1D4ED8] ${focusRing}`} href={item.href} onClick={() => closeMenu()} role="menuitem">{item.label}</Link></li>)}</ul></section>)}</div></div> : null}
    </div>
  );
}
