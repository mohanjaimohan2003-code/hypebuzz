"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";

type Merchant = {
  name: string;
  slug: string;
  logoUrl: string | null;
};

const bundledMerchantLogos: Record<string, string> = {
  amazon: "/merchants/01cada77a0a7d326d85b7969fe26a728.jpg",
  flipkart: "/merchants/flipkart.jpeg",
  myntra: "/merchants/myntra.webp",
  hypebuzz: "/brand/hypebuzz-logo.png",
};

function normalizeMerchantIdentity(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function getBundledMerchantLogo(merchant: Pick<Merchant, "slug"> & { name?: string }) {
  const slug = normalizeMerchantIdentity(merchant.slug);
  const name = normalizeMerchantIdentity(merchant.name ?? "");
  return bundledMerchantLogos[slug] ?? bundledMerchantLogos[name] ?? null;
}

export function MerchantLogo({ merchant, variant = "card" }: { merchant: Merchant; variant?: "card" | "cta" }) {
  const bundledLogo = getBundledMerchantLogo(merchant);
  const configuredLogo = merchant.logoUrl?.trim() || null;
  const logoSources = [configuredLogo, bundledLogo].filter((source, index, sources): source is string => Boolean(source) && sources.indexOf(source) === index);
  const [failedLogoCount, setFailedLogoCount] = useState(0);
  const logoSource = logoSources[failedLogoCount];
  const dimensions = variant === "cta" ? "h-9 w-11" : "h-10 w-10";
  const className = `${dimensions} shrink-0 rounded-[8px] bg-white object-contain p-1`;

  if (logoSource) {
    return <img alt="" aria-hidden="true" className={className} onError={() => setFailedLogoCount((count) => count + 1)} referrerPolicy="no-referrer" src={logoSource} />;
  }

  return <span aria-hidden="true" className={`flex ${dimensions} shrink-0 items-center justify-center rounded-[8px] bg-[#EFF6FF] font-bold text-[#1D4ED8]`}>{merchant.name.charAt(0).toUpperCase()}</span>;
}
