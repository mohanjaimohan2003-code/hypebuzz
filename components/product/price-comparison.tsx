import type { PublicProductOffer } from "@/lib/data/public-product";

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

function MerchantLogo({ offer }: { offer: PublicProductOffer }) {
  if (offer.merchant.logoUrl) {
    // Merchant logos may be hosted by any approved merchant.
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt="" className="h-10 w-10 rounded-[10px] object-contain" src={offer.merchant.logoUrl} />;
  }
  return <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#EFF6FF] font-bold text-[#1D4ED8]">{offer.merchant.name.charAt(0)}</span>;
}

export function PriceComparison({ offers }: { offers: PublicProductOffer[] }) {
  return (
    <section aria-labelledby="deals-heading" className="scroll-mt-24" id="deals">
      <div className="flex items-end justify-between gap-4">
        <div><p className="text-sm font-semibold text-[#2563EB]">Compare stores</p><h2 className="mt-1 text-2xl font-bold text-[#111827]" id="deals-heading">Price comparison</h2></div>
        <p className="text-sm text-[#6B7280]">{offers.length} {offers.length === 1 ? "offer" : "offers"}</p>
      </div>
      <p className="mt-2 text-sm text-[#6B7280]">We may earn a commission from qualifying purchases. You complete your purchase with the merchant.</p>
      {offers.length ? (
        <div className="mt-5 space-y-3">
          {offers.map((offer) => (
            <article className={`rounded-2xl border bg-white p-4 sm:p-5 ${offer.isLowestPrice ? "border-[#2563EB] ring-2 ring-[#DBEAFE]" : "border-[#E5E7EB]"}`} key={offer.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <MerchantLogo offer={offer} />
                  <div className="min-w-0"><h3 className="font-semibold text-[#111827]">{offer.merchant.name}</h3><p className="text-sm text-[#6B7280]">{offer.availability ?? "Stock status unavailable"}</p></div>
                  {offer.isLowestPrice ? <span className="ml-auto rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-bold text-[#1D4ED8]">Lowest price</span> : null}
                </div>
                <div className="flex items-end justify-between gap-4 sm:block sm:min-w-32 sm:text-right">
                  <div><p className="text-xl font-bold tabular-nums text-[#111827]">{money(offer.currentPrice, offer.currency)}</p>{offer.originalPrice ? <p className="text-sm text-[#6B7280] line-through">{money(offer.originalPrice, offer.currency)}</p> : null}</div>
                  {offer.discount ? <p className="text-sm font-semibold text-[#15803D]">Save {Math.round(offer.discount)}%</p> : null}
                </div>
                <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] border border-[#EA580C] bg-[#F97316] px-5 text-sm font-bold text-[#111827] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" href={`/go/${offer.id}`} rel="sponsored nofollow noopener noreferrer" target="_blank">Buy now at {offer.merchant.name}<span aria-hidden="true">↗</span></a>
              </div>
            </article>
          ))}
        </div>
      ) : <div className="mt-5 rounded-2xl border border-[#E5E7EB] bg-white p-6 text-sm text-[#6B7280]">There are no active merchant offers for this product right now.</div>}
    </section>
  );
}
