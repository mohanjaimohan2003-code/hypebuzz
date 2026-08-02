import Image from "next/image";

type Merchant = {
  name: string;
  slug: string;
  logoUrl: string | null;
};

const bundledMerchantLogos: Record<string, string> = {
  amazon: "/merchants/01cada77a0a7d326d85b7969fe26a728.jpg",
};

export function getBundledMerchantLogo(merchant: Pick<Merchant, "slug">) {
  return bundledMerchantLogos[merchant.slug.trim().toLowerCase()] ?? null;
}

export function MerchantLogo({ merchant, variant = "card" }: { merchant: Merchant; variant?: "card" | "cta" }) {
  const bundledLogo = getBundledMerchantLogo(merchant);
  const dimensions = variant === "cta" ? "h-9 w-11" : "h-10 w-10";
  const className = `${dimensions} shrink-0 rounded-[8px] bg-white object-contain`;

  if (bundledLogo) {
    return <Image alt={`${merchant.name} logo`} className={className} height={3222} src={bundledLogo} width={3083} />;
  }

  if (merchant.logoUrl) {
    // Merchant-hosted logos may come from domains configured by administrators.
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={`${merchant.name} logo`} className={className} src={merchant.logoUrl} />;
  }

  return <span aria-hidden="true" className={`flex ${dimensions} shrink-0 items-center justify-center rounded-[8px] bg-[#EFF6FF] font-bold text-[#1D4ED8]`}>{merchant.name.charAt(0).toUpperCase()}</span>;
}
