"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import type { AdminProductListItem } from "@/lib/data/admin-products";
import { AdminIcon } from "./admin-icon";
import { ProductActions } from "./product-actions";
import { ProductStatusBadge } from "./product-status-badge";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : dateFormatter.format(date);
}

function ProductThumbnail({ imageUrl, name }: { imageUrl: string | null; name: string }) {
  const [hasError, setHasError] = useState(false);

  if (!imageUrl || hasError) {
    return (
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-[#F8FAFC] text-[#6B7280]">
        <AdminIcon className="h-6 w-6" name="products" />
        <span className="sr-only">No product image available</span>
      </span>
    );
  }

  return (
    <img
      alt={`${name} thumbnail`}
      className="h-14 w-14 shrink-0 rounded-[10px] border border-[#E5E7EB] bg-white object-contain"
      loading="lazy"
      onError={() => setHasError(true)}
      referrerPolicy="no-referrer"
      src={imageUrl}
    />
  );
}

function FeaturedValue({ featured }: { featured: boolean }) {
  return featured ? (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#166534]">
      <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-full bg-[#DCFCE7]">✓</span>
      Yes
    </span>
  ) : (
    <span className="text-sm text-[#6B7280]">No</span>
  );
}

export function ProductTable({ products }: { products: AdminProductListItem[] }) {
  return (
    <>
      <div className="space-y-4 md:hidden">
        {products.map((product) => (
          <article key={product.id} className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            <div className="flex gap-3">
              <ProductThumbnail imageUrl={product.imageUrl} name={product.name} />
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-semibold text-[#111827]">{product.name}</h2>
                <p className="mt-1 truncate text-sm text-[#6B7280]">{product.categoryName ?? "Uncategorized"}</p>
                <div className="mt-2"><ProductStatusBadge status={product.status} /></div>
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-[#E5E7EB] pt-4 text-sm">
              <div><dt className="text-[#6B7280]">Featured</dt><dd className="mt-1"><FeaturedValue featured={product.isFeatured} /></dd></div>
              <div><dt className="text-[#6B7280]">Created</dt><dd className="mt-1 font-medium text-[#111827]"><time dateTime={product.createdAt}>{formatDate(product.createdAt)}</time></dd></div>
            </dl>
            <div className="mt-4 border-t border-[#E5E7EB] pt-4">
              <ProductActions productId={product.id} productName={product.name} status={product.status} />
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[64rem] border-collapse text-left">
          <caption className="sr-only">Products sorted from newest to oldest</caption>
          <thead className="bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
            <tr>
              <th className="px-5 py-3" scope="col">Product</th>
              <th className="px-5 py-3" scope="col">Category</th>
              <th className="px-5 py-3" scope="col">Status</th>
              <th className="px-5 py-3" scope="col">Featured</th>
              <th className="px-5 py-3" scope="col">Created</th>
              <th className="px-5 py-3" scope="col">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {products.map((product) => (
              <tr key={product.id} className="align-middle">
                <th className="px-5 py-4" scope="row">
                  <div className="flex items-center gap-3">
                    <ProductThumbnail imageUrl={product.imageUrl} name={product.name} />
                    <div className="min-w-0">
                      <p className="max-w-xs truncate text-sm font-semibold text-[#111827]">{product.name}</p>
                      <p className="mt-1 max-w-xs truncate text-xs text-[#6B7280]">/{product.slug}</p>
                    </div>
                  </div>
                </th>
                <td className="px-5 py-4 text-sm text-[#111827]">{product.categoryName ?? "Uncategorized"}</td>
                <td className="px-5 py-4"><ProductStatusBadge status={product.status} /></td>
                <td className="px-5 py-4"><FeaturedValue featured={product.isFeatured} /></td>
                <td className="px-5 py-4 text-sm text-[#6B7280]"><time dateTime={product.createdAt}>{formatDate(product.createdAt)}</time></td>
                <td className="px-5 py-4"><ProductActions productId={product.id} productName={product.name} status={product.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
