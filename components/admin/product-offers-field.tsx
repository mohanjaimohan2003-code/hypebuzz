"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import type { AdminMerchantOption } from "@/lib/data/admin-products";
import type { ProductImportApplication } from "@/lib/admin/product-import/types";
import type { OfferStockStatus } from "@/lib/validation/offer";
import type { ProductFieldErrors } from "@/lib/validation/product";

export type ProductOfferValue = {
  id: string;
  merchantId: string;
  affiliateUrl: string;
  currentPrice: number | null;
  originalPrice: number | null;
  currency: string;
  stockStatus: OfferStockStatus;
  isActive: boolean;
  couponCode: string;
  shippingNote: string;
  offerTitle: string;
  lastCheckedAt: string;
  persisted?: boolean;
};

const inputClass = "mt-2 min-h-12 w-full rounded-[10px] border border-[#D1D5DB] bg-white px-4 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB] disabled:bg-[#F3F4F6]";

function emptyOffer(): ProductOfferValue {
  return { id: crypto.randomUUID(), persisted: false, merchantId: "", affiliateUrl: "", currentPrice: null, originalPrice: null, currency: "INR", stockStatus: "in_stock", isActive: true, couponCode: "", shippingNote: "", offerTitle: "", lastCheckedAt: "" };
}

export type ProductOffersFieldHandle = {
  applyImport: (offer: NonNullable<ProductImportApplication["offer"]>) => void;
};

export const ProductOffersField = forwardRef<ProductOffersFieldHandle, { initialOffers: ProductOfferValue[]; merchants: AdminMerchantOption[]; disabled: boolean; error?: string; fieldErrors?: ProductFieldErrors }>(function ProductOffersField({ initialOffers, merchants, disabled, error, fieldErrors = {} }, ref) {
  const [offers, setOffers] = useState<ProductOfferValue[]>(initialOffers);
  const update = <K extends keyof ProductOfferValue>(index: number, key: K, value: ProductOfferValue[K]) => setOffers((current) => current.map((offer, itemIndex) => itemIndex === index ? { ...offer, [key]: value } : offer));
  const firstEligible = offers.find((offer) => offer.isActive && ["in_stock", "limited_stock", "pre_order"].includes(offer.stockStatus)) ?? offers.find((offer) => offer.isActive) ?? offers[0];

  useImperativeHandle(ref, () => ({
    applyImport(importedOffer) {
      setOffers((current) => {
      const base = current[0] ?? emptyOffer();
      const patched = { ...base, ...importedOffer };
      return current.length ? [patched, ...current.slice(1)] : [patched];
      });
    },
  }), []);

  return (
    <fieldset className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] sm:p-6" id="product-offers-section" tabIndex={-1}>
      <legend className="px-1 text-lg font-bold text-[#111827]">Offers</legend>
      <p className="mt-2 text-sm text-[#6B7280]">Add one offer per merchant. Draft products may be saved without offers; publishing requires an active available offer.</p>
      <input name="offerManifest" type="hidden" value={JSON.stringify(offers)} />
      <input name="offerId" type="hidden" value={firstEligible?.persisted ? firstEligible.id : ""} />
      <input name="merchantId" type="hidden" value={firstEligible?.merchantId ?? ""} />
      <input name="affiliateUrl" type="hidden" value={firstEligible?.affiliateUrl ?? ""} />
      <input name="currentPrice" type="hidden" value={firstEligible?.currentPrice ?? ""} />
      <input name="originalPrice" type="hidden" value={firstEligible?.originalPrice ?? ""} />
      <input name="currency" type="hidden" value={firstEligible?.currency ?? "INR"} />
      <input name="stockStatus" type="hidden" value={firstEligible?.stockStatus === "pre_order" ? "limited_stock" : firstEligible?.stockStatus ?? "unknown"} />
      {firstEligible?.isActive ? <input name="offerIsActive" type="hidden" value="on" /> : null}
      {error ? <p className="mt-3 text-sm font-medium text-[#B91C1C]" role="alert">{error}</p> : null}

      <div className="mt-5 space-y-4">
        {offers.map((offer, index) => (
          <article className="rounded-xl border border-[#E5E7EB] p-4" key={offer.id}>
            <div className="flex items-center justify-between gap-3"><h3 className="font-bold">Offer {index + 1}</h3><button className="min-h-11 rounded-[10px] border border-[#FCA5A5] px-4 text-sm font-semibold text-[#B91C1C]" disabled={disabled} onClick={() => setOffers((current) => current.filter((_, itemIndex) => itemIndex !== index))} type="button">Delete</button></div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div><label className="text-sm font-semibold" htmlFor={`product-offer-merchant-${index}`}>Merchant</label><select aria-invalid={index===0&&Boolean(fieldErrors.merchantId)} className={inputClass} id={`product-offer-merchant-${index}`} onChange={(event) => update(index, "merchantId", event.target.value)} required value={offer.merchantId}><option value="">Select a merchant</option>{merchants.map((merchant) => <option disabled={!merchant.isActive && merchant.id !== offer.merchantId} key={merchant.id} value={merchant.id}>{merchant.name}{merchant.isActive ? "" : " (inactive)"}</option>)}</select>{index===0&&fieldErrors.merchantId?<p className="mt-2 text-sm font-medium text-[#B91C1C]">{fieldErrors.merchantId}</p>:null}</div>
              <div><label className="text-sm font-semibold" htmlFor={`product-offer-title-${index}`}>Offer title (optional)</label><input className={inputClass} id={`product-offer-title-${index}`} maxLength={160} onChange={(event) => update(index, "offerTitle", event.target.value)} value={offer.offerTitle} /></div>
              <div className="lg:col-span-2"><label className="text-sm font-semibold" htmlFor={`product-offer-url-${index}`}>Affiliate URL</label><input aria-invalid={index===0&&Boolean(fieldErrors.affiliateUrl)} className={inputClass} id={`product-offer-url-${index}`} maxLength={2048} onChange={(event) => update(index, "affiliateUrl", event.target.value)} required type="url" value={offer.affiliateUrl} />{index===0&&fieldErrors.affiliateUrl?<p className="mt-2 text-sm font-medium text-[#B91C1C]">{fieldErrors.affiliateUrl}</p>:null}</div>
              <div><label className="text-sm font-semibold" htmlFor={`product-offer-current-${index}`}>Current price</label><input aria-invalid={index===0&&Boolean(fieldErrors.currentPrice)} className={inputClass} id={`product-offer-current-${index}`} min="0.01" onChange={(event) => update(index, "currentPrice", event.target.value ? Number(event.target.value) : null)} required step="0.01" type="number" value={offer.currentPrice ?? ""} />{index===0&&fieldErrors.currentPrice?<p className="mt-2 text-sm font-medium text-[#B91C1C]">{fieldErrors.currentPrice}</p>:null}</div>
              <div><label className="text-sm font-semibold" htmlFor={`product-offer-original-${index}`}>Original price (optional)</label><input aria-invalid={index===0&&Boolean(fieldErrors.originalPrice)} className={inputClass} id={`product-offer-original-${index}`} min="0.01" onChange={(event) => update(index, "originalPrice", event.target.value ? Number(event.target.value) : null)} step="0.01" type="number" value={offer.originalPrice ?? ""} />{index===0&&fieldErrors.originalPrice?<p className="mt-2 text-sm font-medium text-[#B91C1C]">{fieldErrors.originalPrice}</p>:null}</div>
              <div><label className="text-sm font-semibold" htmlFor={`product-offer-currency-${index}`}>Currency</label><input aria-invalid={index===0&&Boolean(fieldErrors.currency)} className={inputClass} id={`product-offer-currency-${index}`} maxLength={3} onChange={(event) => update(index, "currency", event.target.value.toUpperCase())} required value={offer.currency} />{index===0&&fieldErrors.currency?<p className="mt-2 text-sm font-medium text-[#B91C1C]">{fieldErrors.currency}</p>:null}</div>
              <div><label className="text-sm font-semibold" htmlFor={`product-offer-stock-${index}`}>Availability</label><select aria-invalid={index===0&&Boolean(fieldErrors.stockStatus)} className={inputClass} id={`product-offer-stock-${index}`} onChange={(event) => update(index, "stockStatus", event.target.value as OfferStockStatus)} value={offer.stockStatus}><option value="in_stock">In stock</option><option value="limited_stock">Limited stock</option><option value="pre_order">Pre-order</option><option value="out_of_stock">Out of stock</option><option value="unknown">Unknown</option></select>{index===0&&fieldErrors.stockStatus?<p className="mt-2 text-sm font-medium text-[#B91C1C]">{fieldErrors.stockStatus}</p>:null}</div>
              <div><label className="text-sm font-semibold" htmlFor={`product-offer-coupon-${index}`}>Coupon code (optional)</label><input className={inputClass} id={`product-offer-coupon-${index}`} maxLength={100} onChange={(event) => update(index, "couponCode", event.target.value)} value={offer.couponCode} /></div>
              <div><label className="text-sm font-semibold" htmlFor={`product-offer-shipping-${index}`}>Shipping note (optional)</label><input className={inputClass} id={`product-offer-shipping-${index}`} maxLength={300} onChange={(event) => update(index, "shippingNote", event.target.value)} value={offer.shippingNote} /></div>
              <div><label className="text-sm font-semibold" htmlFor={`product-offer-checked-${index}`}>Last checked</label><input className={inputClass} id={`product-offer-checked-${index}`} onChange={(event) => update(index, "lastCheckedAt", event.target.value)} type="datetime-local" value={offer.lastCheckedAt} /></div>
              <label className="flex min-h-12 items-center gap-3 rounded-[10px] border border-[#E5E7EB] px-4 text-sm font-semibold"><input checked={offer.isActive} className="h-5 w-5 accent-[#2563EB]" onChange={(event) => update(index, "isActive", event.target.checked)} type="checkbox" />Active offer</label>
            </div>
          </article>
        ))}
      </div>
      <button className="mt-4 min-h-12 rounded-[10px] border border-[#2563EB] px-5 font-semibold text-[#1D4ED8]" disabled={disabled} onClick={() => setOffers((current) => [...current, emptyOffer()])} type="button">Add offer</button>
    </fieldset>
  );
});
