import type { CurrencyMarketItem, MarketItem } from "@/lib/types/market";

export const sampleFixedMarketItems = [
  { id: "gold-24k", label: "Gold 24K", value: "₹7,410/g", change: "+0.4%", direction: "up" },
  { id: "silver", label: "Silver", value: "₹92.80/g", change: "+0.2%", direction: "up" },
  { id: "nifty-50", label: "Nifty 50", value: "25,082", change: "+0.3%", direction: "up" },
  { id: "nifty-bank", label: "Nifty Bank", value: "56,940", change: "−0.1%", direction: "down" },
  { id: "nifty-next-50", label: "Nifty Next 50", value: "73,215", change: "+0.1%", direction: "up" },
  { id: "bitcoin-inr", label: "Bitcoin/INR", value: "₹9.48M", change: "+1.2%", direction: "up" },
  { id: "best-deals", label: "Today’s Best Deals", value: "Handpicked now", direction: "neutral" },
] satisfies readonly MarketItem[];

export const sampleCurrencyMarketItems = [
  { id: "usd-inr", code: "USD", label: "USD/INR", value: "₹86.12", change: "+0.08%", direction: "up" },
  { id: "eur-inr", code: "EUR", label: "EUR/INR", value: "₹100.54", change: "+0.12%", direction: "up" },
  { id: "gbp-inr", code: "GBP", label: "GBP/INR", value: "₹116.34", change: "−0.05%", direction: "down" },
  { id: "aed-inr", code: "AED", label: "AED/INR", value: "₹23.45", change: "+0.02%", direction: "up" },
  { id: "kwd-inr", code: "KWD", label: "KWD/INR", value: "₹281.79", change: "+0.06%", direction: "up" },
  { id: "jpy-inr", code: "JPY", label: "JPY/INR", value: "₹0.58", change: "−0.03%", direction: "down" },
  { id: "sgd-inr", code: "SGD", label: "SGD/INR", value: "₹67.38", change: "+0.09%", direction: "up" },
  { id: "aud-inr", code: "AUD", label: "AUD/INR", value: "₹56.31", change: "−0.04%", direction: "down" },
  { id: "cad-inr", code: "CAD", label: "CAD/INR", value: "₹62.77", change: "+0.01%", direction: "up" },
  { id: "sar-inr", code: "SAR", label: "SAR/INR", value: "₹22.96", change: "+0.03%", direction: "up" },
] satisfies readonly CurrencyMarketItem[];
