"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
} from "react";

const navigationItems = [
  { label: "Home", href: "/" },
  { label: "Categories", href: "/categories" },
  { label: "Compare", href: "/compare" },
  { label: "Wishlist", href: "/wishlist" },
] as const;

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2";

type IconProps = {
  className?: string;
};

function SearchIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m21 21-4.35-4.35m2.35-5.15a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function MenuIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function CloseIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m6 6 12 12M18 6 6 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function HeartIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

type SearchFormProps = {
  className?: string;
  inputId: string;
};

function SearchForm({ className = "", inputId }: SearchFormProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
  }

  function clearSearch() {
    setQuery("");
    inputRef.current?.focus();
  }

  return (
    <form
      action="/search"
      className={`relative ${className}`}
      method="get"
      role="search"
    >
      <label className="sr-only" htmlFor={inputId}>
        Search HypeBuzz
      </label>
      <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6B7280]" />
      <input
        ref={inputRef}
        className="h-11 w-full rounded-[10px] border border-[#E5E7EB] bg-white py-2 pl-11 pr-12 text-sm text-[#111827] transition-colors duration-150 placeholder:text-[#6B7280] hover:border-[#9CA3AF] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 motion-reduce:transition-none"
        enterKeyHint="search"
        id={inputId}
        name="q"
        onChange={handleChange}
        placeholder="Search products, brands, and categories"
        type="search"
        value={query}
      />
      {query.length > 0 ? (
        <button
          aria-label="Clear search"
          className={`absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-[10px] text-[#6B7280] transition-colors duration-150 hover:bg-[#EFF6FF] hover:text-[#1D4ED8] motion-reduce:transition-none ${focusRing}`}
          onClick={clearSearch}
          type="button"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      ) : null}
    </form>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function openMobileMenu() {
    if (!dialogRef.current?.open) {
      dialogRef.current?.showModal();
      setIsMenuOpen(true);
    }
  }

  function closeMobileMenu() {
    dialogRef.current?.close();
  }

  function handleDialogClose() {
    setIsMenuOpen(false);
    menuButtonRef.current?.focus();
  }

  function handleDialogClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) {
      closeMobileMenu();
    }
  }

  const wishlistIsActive = isActivePath(pathname, "/wishlist");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E5E7EB] bg-white font-sans shadow-[0_1px_3px_rgba(17,24,39,0.08)]">
      <a
        className="sr-only rounded-[10px] bg-white px-4 py-3 font-semibold text-[#111827] shadow-lg focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
        href="#main-content"
      >
        Skip to main content
      </a>

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 md:gap-5 lg:grid lg:h-[72px] lg:grid-cols-[auto_minmax(260px,1fr)_auto] lg:px-8">
        <Link
          aria-label="HypeBuzz home"
          className={`flex min-h-11 shrink-0 items-center gap-2.5 rounded-[10px] ${focusRing}`}
          href="/"
        >
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#2563EB] text-sm font-bold tracking-tight text-white shadow-sm"
          >
            HB
          </span>
          <span className="text-xl font-bold tracking-[-0.03em] text-[#111827]">
            Hype<span className="text-[#2563EB]">Buzz</span>
          </span>
        </Link>

        <div className="hidden min-w-0 flex-1 justify-center md:flex">
          <SearchForm
            className="w-full max-w-[28rem]"
            inputId="desktop-navbar-search"
          />
        </div>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center justify-end gap-1 lg:flex"
        >
          {navigationItems.map((item) => {
            const isActive = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-[10px] px-3 py-3 text-sm font-semibold transition-colors duration-150 motion-reduce:transition-none ${focusRing} ${
                  isActive
                    ? "bg-[#EFF6FF] text-[#1D4ED8] shadow-[inset_0_-2px_0_#2563EB]"
                    : "text-[#111827] hover:bg-[#EFF6FF] hover:text-[#1D4ED8]"
                }`}
                href={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          <Link
            aria-current={wishlistIsActive ? "page" : undefined}
            aria-label="Wishlist"
            className={`flex h-11 w-11 items-center justify-center rounded-[10px] border transition-colors duration-150 motion-reduce:transition-none ${focusRing} ${
              wishlistIsActive
                ? "border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8]"
                : "border-[#E5E7EB] bg-white text-[#111827] hover:border-[#2563EB] hover:bg-[#EFF6FF] hover:text-[#1D4ED8]"
            }`}
            href="/wishlist"
          >
            <HeartIcon />
          </Link>
          <button
            ref={menuButtonRef}
            aria-controls="mobile-navigation"
            aria-expanded={isMenuOpen}
            aria-haspopup="dialog"
            aria-label="Open navigation menu"
            className={`flex h-11 w-11 items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white text-[#111827] transition-colors duration-150 hover:border-[#2563EB] hover:bg-[#EFF6FF] hover:text-[#1D4ED8] motion-reduce:transition-none ${focusRing}`}
            onClick={openMobileMenu}
            type="button"
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      <div className="border-t border-[#E5E7EB] px-4 pb-3 pt-3 sm:px-6 md:hidden">
        <SearchForm inputId="mobile-navbar-search" />
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="mobile-menu-title"
        className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-[#111827]/45"
        id="mobile-navigation"
        onClick={handleDialogClick}
        onClose={handleDialogClose}
      >
        <div className="ml-auto flex h-full w-[min(22rem,calc(100%-2rem))] flex-col bg-white shadow-2xl">
          <div className="flex h-16 items-center justify-between border-b border-[#E5E7EB] px-4">
            <h2
              className="text-lg font-semibold text-[#111827]"
              id="mobile-menu-title"
            >
              Navigation
            </h2>
            <button
              aria-label="Close navigation menu"
              className={`flex h-11 w-11 items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white text-[#111827] transition-colors duration-150 hover:border-[#2563EB] hover:bg-[#EFF6FF] hover:text-[#1D4ED8] motion-reduce:transition-none ${focusRing}`}
              onClick={closeMobileMenu}
              type="button"
            >
              <CloseIcon />
            </button>
          </div>

          <nav
            aria-label="Mobile primary navigation"
            className="flex-1 overflow-y-auto px-4 py-6"
          >
            <ul className="space-y-2">
              {navigationItems.map((item) => {
                const isActive = isActivePath(pathname, item.href);

                return (
                  <li key={item.href}>
                    <Link
                      aria-current={isActive ? "page" : undefined}
                      className={`flex min-h-11 items-center rounded-[10px] border-l-4 px-4 py-3 text-base font-semibold transition-colors duration-150 motion-reduce:transition-none ${focusRing} ${
                        isActive
                          ? "border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8]"
                          : "border-transparent text-[#111827] hover:border-[#2563EB] hover:bg-[#EFF6FF] hover:text-[#1D4ED8]"
                      }`}
                      href={item.href}
                      onClick={closeMobileMenu}
                    >
                      {item.label}
                      {isActive ? (
                        <span className="ml-auto text-xs font-medium text-[#1D4ED8]">
                          Current page
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <p className="border-t border-[#E5E7EB] px-5 py-4 text-sm leading-5 text-[#6B7280]">
            Discover what is trending and shop with confidence.
          </p>
        </div>
      </dialog>
    </header>
  );
}
