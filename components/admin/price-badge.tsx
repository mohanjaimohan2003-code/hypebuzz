function formatPrice(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function PriceDisplay({
  value,
  currency,
  muted = false,
}: {
  value: number;
  currency: string;
  muted?: boolean;
}) {
  return (
    <span className={muted ? "text-sm text-[#6B7280]" : "text-sm font-bold text-[#1D4ED8]"}>
      {formatPrice(value, currency)}
    </span>
  );
}
