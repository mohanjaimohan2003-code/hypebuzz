"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { AdminIcon } from "./admin-icon";

function Placeholder({ name, className }: { name: string; className: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center border border-[#E5E7EB] bg-[#F8FAFC] text-[#6B7280] ${className}`}>
      <AdminIcon className="h-6 w-6" name="brands" />
      <span className="sr-only">No logo available for {name}</span>
    </span>
  );
}

function RemoteLogo({ logoUrl, name, className }: { logoUrl: string; name: string; className: string }) {
  const [hasError, setHasError] = useState(false);
  if (hasError) return <Placeholder className={className} name={name} />;

  return (
    <img
      alt={`${name} logo`}
      className={`shrink-0 border border-[#E5E7EB] bg-white object-contain ${className}`}
      loading="lazy"
      onError={() => setHasError(true)}
      referrerPolicy="no-referrer"
      src={logoUrl}
    />
  );
}

export function BrandLogoPreview({ logoUrl, name, large = false }: { logoUrl: string | null; name: string; large?: boolean }) {
  const className = large ? "h-24 w-24 rounded-2xl p-2" : "h-14 w-14 rounded-[10px] p-1.5";
  return logoUrl ? <RemoteLogo key={logoUrl} className={className} logoUrl={logoUrl} name={name} /> : <Placeholder className={className} name={name} />;
}
