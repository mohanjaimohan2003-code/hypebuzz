import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Access denied | HypeBuzz" };

export default function AdminAccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050A14] px-4 py-12">
      <section className="w-full max-w-lg rounded-2xl border border-white/10 bg-white p-8 text-center shadow-2xl">
        <p className="text-sm font-semibold text-[#DC2626]">Access denied</p>
        <h1 className="mt-2 text-3xl font-bold text-[#111827]">Administrator approval required</h1>
        <p className="mt-4 leading-7 text-[#6B7280]">
          This account does not have active HypeBuzz administrator access.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link className="flex min-h-11 items-center justify-center rounded-[10px] bg-[#2563EB] px-5 font-semibold text-white hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" href="/admin/login">
            Try another account
          </Link>
          <Link className="flex min-h-11 items-center justify-center rounded-[10px] border border-[#D1D5DB] px-5 font-semibold text-[#111827] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" href="/">
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}
