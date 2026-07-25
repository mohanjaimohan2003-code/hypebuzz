"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  createProduct,
  updateProduct,
} from "@/app/admin/(protected)/products/actions";
import type { AdminCategoryOption, AdminMerchantOption } from "@/lib/data/admin-products";
import type { ProductStatus } from "@/lib/types/database";
import {
  createProductSlug,
  initialProductActionState,
  type ProductField,
} from "@/lib/validation/product";
import { ProductImagesField, type ProductImageValue } from "./product-images-field";

export type ProductFormInitialProduct = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  categoryId: string;
  imageUrl: string;
  images: ProductImageValue[];
  isFeatured: boolean;
  isTrending: boolean;
  status: ProductStatus;
  offerId: string | null;
  merchantId: string;
  affiliateUrl: string;
  currentPrice: number | null;
  originalPrice: number | null;
  currency: string;
  stockStatus: "in_stock" | "limited_stock" | "out_of_stock";
  offerIsActive: boolean;
};

type ProductFormProps = {
  mode: "create" | "edit";
  categories: AdminCategoryOption[];
  merchants: AdminMerchantOption[];
  product?: ProductFormInitialProduct;
};

const inputClass = "mt-2 min-h-12 w-full rounded-[10px] border border-[#D1D5DB] bg-white px-4 text-sm text-[#111827] outline-none transition-colors placeholder:text-[#6B7280] hover:border-[#9CA3AF] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#F3F4F6] motion-reduce:transition-none";

function FieldError({ field, error }: { field: ProductField; error?: string }) {
  return error ? <p className="mt-2 text-sm font-medium text-[#B91C1C]" id={`${field}-error`}>{error}</p> : null;
}

export function ProductForm({ mode, categories, merchants, product }: ProductFormProps) {
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugWasEdited, setSlugWasEdited] = useState(mode === "edit");
  const action = mode === "create" ? createProduct : updateProduct.bind(null, product?.id ?? "");
  const [state, formAction, isPending] = useActionState(action, initialProductActionState);

  function describedBy(field: ProductField, hintId?: string) {
    const errorId = state.fieldErrors[field] ? `${field}-error` : "";
    return [hintId, errorId].filter(Boolean).join(" ") || undefined;
  }

  return (
    <form action={formAction} className="mt-8 space-y-8">
      <input name="offerId" type="hidden" value={product?.offerId ?? ""} />
      {product?.status === "archived" ? (
        <div className="rounded-[10px] border border-[#D1D5DB] bg-[#F3F4F6] px-4 py-3 text-sm text-[#374151]">
          This product is archived. Saving it as Draft or Published will reactivate it.
        </div>
      ) : null}

      {state.status === "error" ? (
        <div aria-live="polite" className="rounded-[10px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#991B1B]" role="alert">
          {state.message}
        </div>
      ) : null}

      <fieldset className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] sm:p-6">
        <legend className="px-1 text-lg font-bold text-[#111827]">Product details</legend>
        <div className="mt-2 grid gap-6 lg:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-[#111827]" htmlFor="product-name">Product name</label>
            <input
              aria-describedby={describedBy("name")}
              aria-invalid={Boolean(state.fieldErrors.name)}
              className={inputClass}
              disabled={isPending}
              id="product-name"
              maxLength={160}
              name="name"
              onChange={(event) => {
                const nextName = event.target.value;
                setName(nextName);
                if (!slugWasEdited) setSlug(createProductSlug(nextName));
              }}
              required
              value={name}
            />
            <FieldError error={state.fieldErrors.name} field="name" />
          </div>

          <div>
            <label className="text-sm font-semibold text-[#111827]" htmlFor="product-slug">Slug</label>
            <input
              aria-describedby={describedBy("slug", "slug-hint")}
              aria-invalid={Boolean(state.fieldErrors.slug)}
              autoCapitalize="none"
              className={inputClass}
              disabled={isPending}
              id="product-slug"
              maxLength={160}
              name="slug"
              onChange={(event) => {
                setSlugWasEdited(true);
                setSlug(event.target.value.toLowerCase());
              }}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              required
              value={slug}
            />
            <p className="mt-2 text-xs text-[#6B7280]" id="slug-hint">Lowercase letters, numbers, and hyphens only.</p>
            <FieldError error={state.fieldErrors.slug} field="slug" />
          </div>

          <div className="lg:col-span-2">
            <label className="text-sm font-semibold text-[#111827]" htmlFor="product-description">Short description</label>
            <textarea
              aria-describedby={describedBy("shortDescription", "description-hint")}
              aria-invalid={Boolean(state.fieldErrors.shortDescription)}
              className={`${inputClass} min-h-28 py-3`}
              defaultValue={product?.shortDescription ?? ""}
              disabled={isPending}
              id="product-description"
              maxLength={300}
              name="shortDescription"
            />
            <p className="mt-2 text-xs text-[#6B7280]" id="description-hint">Optional, up to 300 characters.</p>
            <FieldError error={state.fieldErrors.shortDescription} field="shortDescription" />
          </div>

          <div>
            <label className="text-sm font-semibold text-[#111827]" htmlFor="product-category">Category</label>
            <select
              aria-describedby={describedBy("categoryId")}
              aria-invalid={Boolean(state.fieldErrors.categoryId)}
              className={inputClass}
              defaultValue={product?.categoryId ?? ""}
              disabled={isPending || categories.length === 0}
              id="product-category"
              name="categoryId"
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}{category.isActive ? "" : " (inactive)"}
                </option>
              ))}
            </select>
            <FieldError error={state.fieldErrors.categoryId} field="categoryId" />
          </div>

        </div>
      </fieldset>

      <ProductImagesField disabled={isPending} error={state.fieldErrors.imageUrl} initialImages={product?.images ?? []} />

      <fieldset className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] sm:p-6">
        <legend className="px-1 text-lg font-bold text-[#111827]">Primary storefront offer</legend>
        <p className="mt-2 text-sm text-[#6B7280]">A complete, active offer is required before this product can be published.</p>
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-[#111827]" htmlFor="product-merchant">Merchant</label>
            <select aria-invalid={Boolean(state.fieldErrors.merchantId)} className={inputClass} defaultValue={product?.merchantId ?? ""} disabled={isPending} id="product-merchant" name="merchantId">
              <option value="">Select a merchant</option>
              {merchants.map((merchant) => <option disabled={!merchant.isActive} key={merchant.id} value={merchant.id}>{merchant.name}{merchant.isActive ? "" : " (inactive)"}</option>)}
            </select>
            <FieldError error={state.fieldErrors.merchantId} field="merchantId" />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#111827]" htmlFor="product-affiliate-url">Affiliate URL</label>
            <input aria-invalid={Boolean(state.fieldErrors.affiliateUrl)} className={inputClass} defaultValue={product?.affiliateUrl ?? ""} disabled={isPending} id="product-affiliate-url" maxLength={2048} name="affiliateUrl" placeholder="https://merchant.example/product" type="url" />
            <FieldError error={state.fieldErrors.affiliateUrl} field="affiliateUrl" />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#111827]" htmlFor="product-current-price">Current price</label>
            <input aria-invalid={Boolean(state.fieldErrors.currentPrice)} className={inputClass} defaultValue={product?.currentPrice ?? ""} disabled={isPending} id="product-current-price" min="0.01" name="currentPrice" step="0.01" type="number" />
            <FieldError error={state.fieldErrors.currentPrice} field="currentPrice" />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#111827]" htmlFor="product-original-price">Original price</label>
            <input aria-invalid={Boolean(state.fieldErrors.originalPrice)} className={inputClass} defaultValue={product?.originalPrice ?? ""} disabled={isPending} id="product-original-price" min="0.01" name="originalPrice" step="0.01" type="number" />
            <FieldError error={state.fieldErrors.originalPrice} field="originalPrice" />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#111827]" htmlFor="product-currency">Currency</label>
            <input aria-invalid={Boolean(state.fieldErrors.currency)} className={inputClass} defaultValue={product?.currency ?? "INR"} disabled={isPending} id="product-currency" maxLength={3} name="currency" />
            <FieldError error={state.fieldErrors.currency} field="currency" />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#111827]" htmlFor="product-stock-status">Stock status</label>
            <select aria-invalid={Boolean(state.fieldErrors.stockStatus)} className={inputClass} defaultValue={product?.stockStatus ?? "in_stock"} disabled={isPending} id="product-stock-status" name="stockStatus"><option value="in_stock">In Stock</option><option value="limited_stock">Limited Stock</option><option value="out_of_stock">Out of Stock</option></select>
            <FieldError error={state.fieldErrors.stockStatus} field="stockStatus" />
          </div>
          <label className="flex min-h-12 items-center gap-3 rounded-[10px] border border-[#E5E7EB] px-4 py-3 text-sm font-semibold text-[#111827] lg:col-span-2">
            <input className="h-5 w-5 accent-[#2563EB]" defaultChecked={product?.offerIsActive ?? true} disabled={isPending} name="offerIsActive" type="checkbox" /> Active offer
          </label>
          <FieldError error={state.fieldErrors.offerIsActive} field="offerIsActive" />
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] sm:p-6">
        <legend className="px-1 text-lg font-bold text-[#111827]">Publishing</legend>
        <div className="mt-2 grid gap-6 lg:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-[#111827]" htmlFor="product-status">Status</label>
            <select
              aria-describedby={describedBy("status")}
              aria-invalid={Boolean(state.fieldErrors.status)}
              className={inputClass}
              defaultValue={product?.status === "published" ? "published" : "draft"}
              disabled={isPending}
              id="product-status"
              name="status"
              required
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <FieldError error={state.fieldErrors.status} field="status" />
          </div>

          <div className="space-y-3">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] border border-[#E5E7EB] px-4 py-2 text-sm font-semibold text-[#111827] hover:bg-[#F8FAFC]">
              <input className="h-5 w-5 accent-[#2563EB]" defaultChecked={product?.isFeatured} disabled={isPending} name="isFeatured" type="checkbox" />
              Featured product
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] border border-[#E5E7EB] px-4 py-2 text-sm font-semibold text-[#111827] hover:bg-[#F8FAFC]">
              <input className="h-5 w-5 accent-[#2563EB]" defaultChecked={product?.isTrending} disabled={isPending} name="isTrending" type="checkbox" />
              Trending product
            </label>
          </div>
        </div>
      </fieldset>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link className="inline-flex min-h-12 items-center justify-center rounded-[10px] border border-[#D1D5DB] bg-white px-5 text-sm font-semibold text-[#111827] transition-colors hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 motion-reduce:transition-none" href="/admin/products">Cancel</Link>
        <button className="inline-flex min-h-12 items-center justify-center rounded-[10px] bg-[#2563EB] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#93C5FD] motion-reduce:transition-none" disabled={isPending || categories.length === 0 || merchants.length === 0} type="submit">
          {isPending ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
