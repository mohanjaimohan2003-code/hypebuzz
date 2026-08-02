"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ApplicationError({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => {
    console.error("Application route failed", { digest: error.digest ?? null, name: error.name, message: error.message });
  }, [error]);

  return <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4"><section className="w-full max-w-lg rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-sm" role="alert"><h1 className="text-2xl font-bold text-[#111827]">Something went wrong</h1><p className="mt-3 text-sm leading-6 text-[#4B5563]">The page could not be loaded. Try again, or return to the homepage.</p><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><button className="min-h-11 rounded-[10px] bg-[#2563EB] px-5 text-sm font-semibold text-white" onClick={() => unstable_retry()} type="button">Try again</button><Link className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-[#D1D5DB] px-5 text-sm font-semibold text-[#111827]" href="/">Go home</Link></div></section></main>;
}
