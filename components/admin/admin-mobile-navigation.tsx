"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type MouseEvent } from "react";
import { AdminIcon } from "./admin-icon";
import { AdminNavigation } from "./admin-navigation";
import { AdminSignOutButton } from "./admin-sign-out-button";

export function AdminMobileNavigation() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  function openNavigation() {
    if (!dialogRef.current?.open) {
      dialogRef.current?.showModal();
      setIsOpen(true);
    }
  }

  function closeNavigation() {
    dialogRef.current?.close();
  }

  function handleClose() {
    setIsOpen(false);
    menuButtonRef.current?.focus();
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) closeNavigation();
  }

  return (
    <>
      <button
        ref={menuButtonRef}
        aria-controls="admin-mobile-navigation"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Open admin navigation"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white text-[#111827] transition-colors duration-150 hover:border-[#2563EB] hover:bg-[#EFF6FF] hover:text-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 motion-reduce:transition-none lg:hidden"
        onClick={openNavigation}
        type="button"
      >
        <AdminIcon className="h-6 w-6" name="menu" />
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="admin-mobile-navigation-title"
        className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-transparent p-0 backdrop:bg-[#050A14]/70 lg:hidden"
        id="admin-mobile-navigation"
        onClick={handleBackdropClick}
        onClose={handleClose}
      >
        <div className="ml-auto flex h-full w-[calc(100%-1rem)] max-w-80 flex-col overflow-y-auto bg-[#050A14] text-white shadow-2xl">
          <div className="flex min-h-16 items-center justify-between gap-4 border-b border-white/10 px-4 py-2">
            <Link
              aria-label="HypeBuzz admin dashboard"
              className="inline-flex min-h-11 items-center rounded-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050A14]"
              href="/admin"
              onClick={closeNavigation}
            >
              <Image
                alt="HypeBuzz"
                className="h-auto w-32"
                height={887}
                priority
                src="/brand/hypebuzz-navbar-logo.png"
                width={1776}
              />
            </Link>
            <button
              autoFocus
              aria-label="Close admin navigation"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-white/15 text-white transition-colors duration-150 hover:border-[#60A5FA] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050A14] motion-reduce:transition-none"
              onClick={closeNavigation}
              type="button"
            >
              <AdminIcon className="h-6 w-6" name="close" />
            </button>
          </div>

          <div className="flex-1 px-4 py-5">
            <p
              className="mb-4 text-xs font-semibold tracking-[0.18em] text-[#93C5FD] uppercase"
              id="admin-mobile-navigation-title"
            >
              Admin workspace
            </p>
            <AdminNavigation onNavigate={closeNavigation} />
          </div>

          <div className="space-y-2 border-t border-white/10 p-4">
            <Link
              className="flex min-h-11 items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-sm font-semibold text-[#D1D5DB] transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050A14] motion-reduce:transition-none"
              href="/"
              onClick={closeNavigation}
            >
              <AdminIcon className="h-5 w-5" name="website" />
              <span>View Website</span>
            </Link>
            <AdminSignOutButton variant="sidebar" />
          </div>
        </div>
      </dialog>
    </>
  );
}
