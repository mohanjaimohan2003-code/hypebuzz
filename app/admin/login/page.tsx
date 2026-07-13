import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { getAdminAccess } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Admin sign in | HypeBuzz",
  description: "Secure HypeBuzz administrator access.",
};

export default async function AdminLoginPage() {
  const access = await getAdminAccess();
  if (access.status === "authenticated") redirect("/admin");

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050A14] px-4 py-12">
      <section aria-labelledby="admin-login-heading" className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
        <Link className="inline-flex rounded-[10px] bg-black p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" href="/" aria-label="Return to HypeBuzz home">
          <Image alt="" className="h-auto w-40" height={887} priority src="/brand/hypebuzz-navbar-logo.png" width={1776} />
        </Link>
        <p className="mt-8 text-sm font-semibold text-[#2563EB]">Administrator access</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#111827]" id="admin-login-heading">
          Sign in to HypeBuzz
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#6B7280]">
          Use your approved administrator credentials to continue.
        </p>
        <AdminLoginForm />
      </section>
    </main>
  );
}
