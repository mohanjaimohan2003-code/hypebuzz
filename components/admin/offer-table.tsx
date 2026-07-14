import type { AdminOfferListItem } from "@/lib/data/admin-offers";
import { calculateDiscountPercent } from "@/lib/validation/offer";
import { MerchantBadge } from "./merchant-badge";
import { OfferActions } from "./offer-actions";
import { StatusBadge } from "./offer-status-badge";
import { PriceDisplay } from "./price-badge";
import { StockBadge } from "./stock-badge";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : dateFormatter.format(date);
}

function Discount({ offer }: { offer: AdminOfferListItem }) {
  const discount = calculateDiscountPercent(offer.currentPrice, offer.originalPrice);
  return discount === null ? <span className="text-sm text-[#9CA3AF]">—</span> : <span className="inline-flex rounded-full bg-[#EFF6FF] px-2.5 py-1 text-xs font-bold text-[#1D4ED8]">{discount}%</span>;
}

function AffiliateUrl({ offer }: { offer: AdminOfferListItem }) {
  return (
    <a
      aria-label={`Open affiliate URL for ${offer.productName} at ${offer.merchantName}`}
      className="block max-w-64 truncate text-sm font-medium text-[#1D4ED8] underline decoration-[#93C5FD] underline-offset-2 hover:text-[#1E40AF] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
      href={offer.affiliateUrl}
      rel="noopener noreferrer"
      target="_blank"
      title={offer.affiliateUrl}
    >
      {offer.affiliateUrl}
    </a>
  );
}

export function OffersTable({ offers }: { offers: AdminOfferListItem[] }) {
  return (
    <>
      <div className="space-y-4 lg:hidden">
        {offers.map((offer) => (
          <article key={offer.id} className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-semibold text-[#111827]">{offer.productName}</h2>
                <div className="mt-2"><MerchantBadge name={offer.merchantName} /></div>
              </div>
              <StatusBadge isActive={offer.isActive} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-[#E5E7EB] pt-4 text-sm">
              <div className="col-span-2 min-w-0"><dt className="text-[#6B7280]">Affiliate URL</dt><dd className="mt-1"><AffiliateUrl offer={offer} /></dd></div>
              <div><dt className="text-[#6B7280]">Current price</dt><dd className="mt-1"><PriceDisplay currency={offer.currency} value={offer.currentPrice} /></dd></div>
              <div><dt className="text-[#6B7280]">Original price</dt><dd className="mt-1">{offer.originalPrice === null ? <span className="text-[#9CA3AF]">Not set</span> : <PriceDisplay currency={offer.currency} muted value={offer.originalPrice} />}</dd></div>
              <div><dt className="text-[#6B7280]">Discount</dt><dd className="mt-1">{offer.originalPrice === null ? <span className="text-[#9CA3AF]">Not set</span> : <Discount offer={offer} />}</dd></div>
              <div><dt className="text-[#6B7280]">Currency</dt><dd className="mt-1 font-semibold text-[#111827]">{offer.currency}</dd></div>
              <div><dt className="text-[#6B7280]">Stock</dt><dd className="mt-1"><StockBadge status={offer.stockStatus} /></dd></div>
              <div className="col-span-2"><dt className="text-[#6B7280]">Last updated</dt><dd className="mt-1 font-medium text-[#111827]"><time dateTime={offer.updatedAt}>{formatDate(offer.updatedAt)}</time></dd></div>
            </dl>
            <div className="mt-4 border-t border-[#E5E7EB] pt-4"><OfferActions {...offer} offerId={offer.id} /></div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[94rem] border-collapse text-left">
          <caption className="sr-only">Affiliate offers sorted by most recently updated</caption>
          <thead className="bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
            <tr>
              <th className="px-5 py-3" scope="col">Product</th><th className="px-5 py-3" scope="col">Merchant</th><th className="px-5 py-3" scope="col">Affiliate URL</th><th className="px-5 py-3" scope="col">Current price</th><th className="px-5 py-3" scope="col">Original price</th><th className="px-5 py-3" scope="col">Discount</th><th className="px-5 py-3" scope="col">Currency</th><th className="px-5 py-3" scope="col">Stock status</th><th className="px-5 py-3" scope="col">Status</th><th className="px-5 py-3" scope="col">Last updated</th><th className="px-5 py-3" scope="col">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {offers.map((offer) => (
              <tr key={offer.id} className="align-middle">
                <th className="max-w-xs px-5 py-4 text-sm font-semibold text-[#111827]" scope="row">{offer.productName}</th>
                <td className="px-5 py-4"><MerchantBadge name={offer.merchantName} /></td>
                <td className="max-w-64 px-5 py-4"><AffiliateUrl offer={offer} /></td>
                <td className="px-5 py-4"><PriceDisplay currency={offer.currency} value={offer.currentPrice} /></td>
                <td className="px-5 py-4">{offer.originalPrice === null ? <span className="text-sm text-[#9CA3AF]">Not set</span> : <PriceDisplay currency={offer.currency} muted value={offer.originalPrice} />}</td>
                <td className="px-5 py-4">{offer.originalPrice === null ? <span className="text-sm text-[#9CA3AF]">Not set</span> : <Discount offer={offer} />}</td>
                <td className="px-5 py-4 text-sm font-semibold text-[#111827]">{offer.currency}</td><td className="px-5 py-4"><StockBadge status={offer.stockStatus} /></td><td className="px-5 py-4"><StatusBadge isActive={offer.isActive} /></td>
                <td className="px-5 py-4 text-sm text-[#6B7280]"><time dateTime={offer.updatedAt}>{formatDate(offer.updatedAt)}</time></td>
                <td className="px-5 py-4"><OfferActions {...offer} offerId={offer.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
