"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createOffer, updateOffer } from "@/app/admin/(protected)/offers/actions";
import type { AdminOfferOption } from "@/lib/data/admin-offers";
import {
  calculateDiscountPercent,
  initialOfferActionState,
  type OfferField,
  type OfferStockStatus,
} from "@/lib/validation/offer";

export type OfferFormInitialOffer = {
  id: string;
  productId: string;
  merchantId: string;
  affiliateUrl: string;
  currentPrice: number;
  originalPrice: number | null;
  currency: string;
  stockStatus: OfferStockStatus;
  isActive: boolean;
  notes: string;
};

type OfferFormProps = {
  mode: "create" | "edit";
  products: AdminOfferOption[];
  merchants: AdminOfferOption[];
  offer?: OfferFormInitialOffer;
};

const inputClass = "mt-2 min-h-12 w-full rounded-[10px] border border-[#D1D5DB] bg-white px-4 text-sm text-[#111827] outline-none transition-colors placeholder:text-[#6B7280] hover:border-[#9CA3AF] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#F3F4F6] motion-reduce:transition-none";

function FieldError({ field, error }: { field: OfferField; error?: string }) {
  return error ? <p className="mt-2 text-sm font-medium text-[#B91C1C]" id={`${field}-error`}>{error}</p> : null;
}

export function OfferForm({ mode, products, merchants, offer }: OfferFormProps) {
  const [currentPrice, setCurrentPrice] = useState(offer ? String(offer.currentPrice) : "");
  const [originalPrice, setOriginalPrice] = useState(offer?.originalPrice === null || offer?.originalPrice === undefined ? "" : String(offer.originalPrice));
  const action = mode === "create" ? createOffer : updateOffer.bind(null, offer?.id ?? "");
  const [state, formAction, isPending] = useActionState(action, initialOfferActionState);
  const currentNumber = Number(currentPrice);
  const originalNumber = originalPrice ? Number(originalPrice) : null;
  const discount = currentPrice && originalPrice && Number.isFinite(currentNumber) && Number.isFinite(originalNumber)
    ? calculateDiscountPercent(currentNumber, originalNumber)
    : null;

  function describedBy(field: OfferField, hintId?: string) {
    const errorId = state.fieldErrors[field] ? `${field}-error` : "";
    return [hintId, errorId].filter(Boolean).join(" ") || undefined;
  }

  return (
    <form action={formAction} className="mt-8 space-y-8">
      {offer && !offer.isActive ? (
        <div className="rounded-[10px] border border-[#D1D5DB] bg-[#F3F4F6] px-4 py-3 text-sm text-[#374151]">This offer is inactive. Select Active and save to re-enable it.</div>
      ) : null}
      {state.status === "error" ? <div aria-live="polite" className="rounded-[10px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#991B1B]" role="alert">{state.message}</div> : null}

      <fieldset className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] sm:p-6">
        <legend className="px-1 text-lg font-bold text-[#111827]">Offer destination</legend>
        <div className="mt-2 grid gap-6 lg:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-[#111827]" htmlFor="offer-product">Product</label>
            <select aria-describedby={describedBy("productId")} aria-invalid={Boolean(state.fieldErrors.productId)} className={inputClass} defaultValue={offer?.productId ?? ""} disabled={isPending} id="offer-product" name="productId" required>
              <option value="">Select a product</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name}{product.detail ? ` (${product.detail})` : ""}</option>)}
            </select>
            <FieldError error={state.fieldErrors.productId} field="productId" />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#111827]" htmlFor="offer-merchant">Merchant</label>
            <select aria-describedby={describedBy("merchantId")} aria-invalid={Boolean(state.fieldErrors.merchantId)} className={inputClass} defaultValue={offer?.merchantId ?? ""} disabled={isPending} id="offer-merchant" name="merchantId" required>
              <option value="">Select a merchant</option>
              {merchants.map((merchant) => <option key={merchant.id} value={merchant.id}>{merchant.name}{merchant.detail ? ` (${merchant.detail})` : ""}</option>)}
            </select>
            <FieldError error={state.fieldErrors.merchantId} field="merchantId" />
          </div>
          <div className="lg:col-span-2">
            <label className="text-sm font-semibold text-[#111827]" htmlFor="offer-url">Affiliate URL</label>
            <input aria-describedby={describedBy("affiliateUrl", "offer-url-hint")} aria-invalid={Boolean(state.fieldErrors.affiliateUrl)} className={inputClass} defaultValue={offer?.affiliateUrl ?? ""} disabled={isPending} id="offer-url" maxLength={2048} name="affiliateUrl" placeholder="https://merchant.example/product" required type="url" />
            <p className="mt-2 text-xs leading-5 text-[#6B7280]" id="offer-url-hint">Use the complete tracked destination URL supplied by the merchant.</p>
            <FieldError error={state.fieldErrors.affiliateUrl} field="affiliateUrl" />
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] sm:p-6">
        <legend className="px-1 text-lg font-bold text-[#111827]">Price and availability</legend>
        <div className="mt-2 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label className="text-sm font-semibold text-[#111827]" htmlFor="offer-current-price">Current price</label>
            <input aria-describedby={describedBy("currentPrice")} aria-invalid={Boolean(state.fieldErrors.currentPrice)} className={inputClass} disabled={isPending} id="offer-current-price" inputMode="decimal" min="0.01" name="currentPrice" onChange={(event) => setCurrentPrice(event.target.value)} required step="0.01" type="number" value={currentPrice} />
            <FieldError error={state.fieldErrors.currentPrice} field="currentPrice" />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#111827]" htmlFor="offer-original-price">Original price <span className="font-normal text-[#6B7280]">(optional)</span></label>
            <input aria-describedby={describedBy("originalPrice", "offer-original-price-hint")} aria-invalid={Boolean(state.fieldErrors.originalPrice)} className={inputClass} disabled={isPending} id="offer-original-price" inputMode="decimal" min="0.01" name="originalPrice" onChange={(event) => setOriginalPrice(event.target.value)} step="0.01" type="number" value={originalPrice} />
            <p className="mt-2 text-xs leading-5 text-[#6B7280]" id="offer-original-price-hint">Only enter a supported reference price that is not lower than the current price.</p>
            <FieldError error={state.fieldErrors.originalPrice} field="originalPrice" />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#111827]" htmlFor="offer-currency">Currency</label>
            <input aria-describedby={describedBy("currency")} aria-invalid={Boolean(state.fieldErrors.currency)} autoCapitalize="characters" className={inputClass} defaultValue={offer?.currency ?? "INR"} disabled={isPending} id="offer-currency" maxLength={3} name="currency" pattern="[A-Za-z]{3}" required />
            <FieldError error={state.fieldErrors.currency} field="currency" />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#111827]" htmlFor="offer-stock-status">Stock status</label>
            <select aria-describedby={describedBy("stockStatus")} aria-invalid={Boolean(state.fieldErrors.stockStatus)} className={inputClass} defaultValue={offer?.stockStatus ?? "in_stock"} disabled={isPending} id="offer-stock-status" name="stockStatus" required>
              <option value="in_stock">In Stock</option><option value="limited_stock">Limited Stock</option><option value="out_of_stock">Out of Stock</option>
            </select>
            <FieldError error={state.fieldErrors.stockStatus} field="stockStatus" />
          </div>
          <div className="md:col-span-2 xl:col-span-2">
            <div className="rounded-[10px] border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#1D4ED8]">Calculated discount</p>
              <p aria-live="polite" className="mt-1 text-lg font-bold text-[#111827]">{discount === null ? "Add an original price to calculate" : `${discount}%`}</p>
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] sm:p-6">
        <legend className="px-1 text-lg font-bold text-[#111827]">Publishing details</legend>
        <div className="mt-2 space-y-6">
          <div>
            <label className="text-sm font-semibold text-[#111827]" htmlFor="offer-notes">Notes <span className="font-normal text-[#6B7280]">(optional)</span></label>
            <textarea aria-describedby={describedBy("notes", "offer-notes-hint")} aria-invalid={Boolean(state.fieldErrors.notes)} className={`${inputClass} min-h-28 py-3`} defaultValue={offer?.notes ?? ""} disabled={isPending} id="offer-notes" maxLength={500} name="notes" />
            <p className="mt-2 text-xs leading-5 text-[#6B7280]" id="offer-notes-hint">Internal or shopper-facing coupon context, up to 500 characters.</p>
            <FieldError error={state.fieldErrors.notes} field="notes" />
          </div>
          <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-[10px] border border-[#E5E7EB] p-4 hover:bg-[#F8FAFC] focus-within:ring-2 focus-within:ring-[#2563EB] focus-within:ring-offset-2">
            <input className="mt-0.5 h-5 w-5 rounded border-[#9CA3AF] accent-[#2563EB]" defaultChecked={offer?.isActive ?? true} disabled={isPending} name="isActive" type="checkbox" />
            <span><span className="block text-sm font-semibold text-[#111827]">Active offer</span><span className="mt-1 block text-xs leading-5 text-[#6B7280]">Only eligible active offers can appear on public product surfaces.</span></span>
          </label>
        </div>
      </fieldset>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link className="inline-flex min-h-12 items-center justify-center rounded-[10px] border border-[#D1D5DB] bg-white px-5 text-sm font-semibold text-[#111827] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" href="/admin/offers">Cancel</Link>
        <button className="inline-flex min-h-12 items-center justify-center rounded-[10px] bg-[#2563EB] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#93C5FD] motion-reduce:transition-none" disabled={isPending || products.length === 0 || merchants.length === 0} type="submit">{isPending ? "Saving..." : mode === "create" ? "Create Offer" : "Save Changes"}</button>
      </div>
    </form>
  );
}
