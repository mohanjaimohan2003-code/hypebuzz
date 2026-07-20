import Image from "next/image";

const fallbackImage = "/products/aurora-headphones.svg";

export function ProductGallery({ imageUrl, productName }: { imageUrl: string | null; productName: string }) {
  const src = imageUrl ?? fallbackImage;
  return (
    <section aria-label={`${productName} gallery`} className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
      <div className="relative aspect-square">
        {src.startsWith("/") ? (
          <Image alt={productName} className="object-contain p-8 sm:p-12" fill priority sizes="(max-width: 1023px) 100vw, 50vw" src={src} />
        ) : (
          // The admin-controlled catalog accepts multiple future media hosts.
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={productName} className="h-full w-full object-contain p-8 sm:p-12" fetchPriority="high" src={src} />
        )}
      </div>
    </section>
  );
}
