export type MarketDirection = "up" | "down" | "neutral";

export type MarketItem = {
  id: string;
  label: string;
  value: string;
  change?: string;
  direction: MarketDirection;
};

export type CurrencyMarketItem = MarketItem & {
  code: string;
};
