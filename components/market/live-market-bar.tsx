import {
  sampleCurrencyMarketItems,
  sampleFixedMarketItems,
} from "@/lib/data/sample-market-data";
import type { MarketItem } from "@/lib/types/market";
import { RotatingCurrencyCard } from "./rotating-currency-card";

function FixedMarketItem({ className, item }: { className?: string; item: MarketItem }) {
  const directionClass =
    item.direction === "down"
      ? "text-[#FCA5A5]"
      : item.direction === "up"
        ? "text-[#86EFAC]"
        : "text-slate-300";

  return (
    <div className={`min-w-0 shrink border-r border-white/10 px-2 py-0.5 ${className ?? ""}`}>
      <p className="truncate text-[10px] font-semibold leading-3 text-slate-400 xl:text-[11px]">{item.label}</p>
      <div className="flex min-w-0 items-baseline gap-1.5">
        <span className="truncate text-xs font-bold leading-4 tabular-nums text-white xl:text-sm">{item.value}</span>
        {item.change ? (
          <span className={`hidden text-[10px] font-semibold tabular-nums xl:inline ${directionClass}`}>
            {item.change}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function LiveMarketBar() {
  const [gold, silver, nifty50, niftyBank, niftyNext50, bitcoin, bestDeals] = sampleFixedMarketItems;

  return (
    <section aria-label="Sample market information" className="w-full bg-[#060A12] text-white">
      <div className="mx-auto max-w-[1440px] px-4 py-1.5 sm:px-6 lg:px-8">
        <div className="flex min-h-[52px] min-w-0 items-center gap-1.5 md:gap-1 lg:gap-1.5">
          <div className="shrink-0 pr-1 md:pr-2">
            <p className="whitespace-nowrap text-[11px] font-bold uppercase leading-4 text-white lg:text-xs">Live Market</p>
            <p className="whitespace-nowrap text-[10px] font-medium leading-4 text-[#60A5FA]">Sample data</p>
          </div>

          <FixedMarketItem className="hidden md:block md:max-w-[88px] xl:max-w-[104px]" item={gold} />
          <FixedMarketItem className="hidden xl:block xl:max-w-[100px]" item={silver} />
          <FixedMarketItem className="hidden md:block md:max-w-[88px] xl:max-w-[104px]" item={nifty50} />
          <FixedMarketItem className="hidden lg:block lg:max-w-[96px] xl:max-w-[112px]" item={niftyBank} />
          <FixedMarketItem className="hidden xl:block xl:max-w-[118px]" item={niftyNext50} />

          <div className="min-w-0 flex-1 md:w-[200px] md:flex-none lg:w-[230px] xl:w-[250px]">
            <RotatingCurrencyCard currencies={sampleCurrencyMarketItems} />
          </div>

          <FixedMarketItem className="hidden lg:block lg:max-w-[112px] xl:max-w-[126px]" item={bitcoin} />
          <FixedMarketItem className="hidden xl:block xl:max-w-[150px] xl:border-r-0" item={bestDeals} />
        </div>
      </div>
    </section>
  );
}
