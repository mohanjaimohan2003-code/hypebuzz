import type { Metadata } from "next";
import Link from "next/link";
import { BrandForm } from "@/components/admin/brand-form";

export const metadata: Metadata = { title: "Add Brand | HypeBuzz Admin" };

export default function NewBrandPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <Link className="inline-flex min-h-11 items-center rounded-[10px] px-2 text-sm font-semibold text-[#1D4ED8] hover:bg-[#EFF6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" href="/admin/brands">&larr; Back to brands</Link>
      <header className="mt-4"><p className="text-sm font-semibold text-[#2563EB]">Catalog management</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">Add Brand</h1><p className="mt-3 max-w-2xl text-base leading-7 text-[#6B7280]">Create a trusted brand identity and choose whether it is immediately active.</p></header>
      <BrandForm mode="create" />
    </div>
  );
}
