import type { Metadata } from "next";
import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { getAdminCategoryOptions } from "@/lib/data/admin-products";

export const metadata: Metadata = { title: "Add Product | HypeBuzz Admin" };

export default async function NewProductPage() {
  const { categories, hasError } = await getAdminCategoryOptions();

  return (
    <div className="mx-auto max-w-5xl">
      <Link className="inline-flex min-h-11 items-center rounded-[10px] px-2 text-sm font-semibold text-[#1D4ED8] hover:bg-[#EFF6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" href="/admin/products">← Back to products</Link>
      <header className="mt-4">
        <p className="text-sm font-semibold text-[#2563EB]">Catalog management</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">Add Product</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[#6B7280]">Create a product record and choose whether it remains a draft or is published.</p>
      </header>

      {hasError || categories.length === 0 ? (
        <div className="mt-6 rounded-[10px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#991B1B]" role="alert">
          Categories could not be loaded. Apply the catalog read migration and ensure at least one category exists before creating a product.
        </div>
      ) : null}

      <ProductForm categories={categories} mode="create" />
    </div>
  );
}
