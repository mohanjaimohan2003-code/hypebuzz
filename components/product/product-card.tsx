import Image from "next/image";
import Link from "next/link";
import { CompareButton, WishlistButton } from "./product-card-actions";

export type ProductCardProduct = {
  id: string; name: string; brand: string; imageSrc: string; imageAlt: string;
  price?: number; currency?: string; storeCount: number; productHref: string;
  dealsHref: string; badge?: string; initiallyWishlisted?: boolean;
};

const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2";

export function ProductCard({ product }: { product: ProductCardProduct }) {
  const price = product.price === undefined ? null : new Intl.NumberFormat("en-IN", { style: "currency", currency: product.currency ?? "INR", maximumFractionDigits: 0 }).format(product.price);
  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_2px_8px_rgba(17,24,39,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-[#BFDBFE] hover:shadow-[0_12px_24px_rgba(17,24,39,0.10)] motion-reduce:transform-none motion-reduce:transition-none">
      <div className="relative aspect-[4/3] overflow-hidden bg-white">
        <Link aria-label={`View ${product.name}`} className={`block h-full w-full ${focus}`} href={product.productHref}>
          {product.imageSrc.startsWith("/") ? <Image alt={product.imageAlt} className="object-contain p-5 transition-transform duration-200 group-hover:scale-[1.03] motion-reduce:transform-none" fill sizes="(max-width: 639px) 78vw, (max-width: 1023px) 38vw, 20vw" src={product.imageSrc} /> : (
            // Catalog images can come from approved merchant and media hosts.
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={product.imageAlt} className="h-full w-full object-contain p-5 transition-transform duration-200 group-hover:scale-[1.03] motion-reduce:transform-none" loading="lazy" src={product.imageSrc} />
          )}
        </Link>
        {product.badge ? <span className="absolute left-3 top-3 rounded-md bg-[#1D4ED8] px-2 py-1 text-[11px] font-bold text-white">{product.badge}</span> : null}
        <div className="absolute right-2 top-2 scale-90"><WishlistButton initiallyWishlisted={product.initiallyWishlisted} productName={product.name} /></div>
      </div>
      <div className="flex flex-1 flex-col border-t border-[#F1F5F9] p-4">
        <p className="text-xs font-medium text-[#6B7280]">{product.brand}</p>
        <h3 className="mt-1 min-h-12 text-[15px] font-semibold leading-6 text-[#111827]"><Link className={`rounded-sm hover:text-[#1D4ED8] ${focus}`} href={product.productHref} title={product.name}><span className="line-clamp-2">{product.name}</span></Link></h3>
        <div className="mt-3">{price ? <><p className="text-xs text-[#6B7280]">From</p><p className="text-xl font-bold leading-7 text-[#1455E8]">{price}</p><p className="text-xs text-[#6B7280]">Across {product.storeCount} {product.storeCount === 1 ? "store" : "stores"}</p></> : <><p className="text-sm font-semibold text-[#111827]">Offers unavailable</p><p className="mt-1 text-xs text-[#6B7280]">Check the product page for updates.</p></>}</div>
        <div className="mt-auto grid grid-cols-[auto_1fr] gap-2 pt-4"><CompareButton productName={product.name} /><Link className={`flex min-h-11 items-center justify-center rounded-[10px] border border-[#2563EB] px-3 text-sm font-bold text-[#1D4ED8] transition-colors hover:bg-[#2563EB] hover:text-white ${focus}`} href={product.dealsHref}>View deals</Link></div>
      </div>
    </article>
  );
}
