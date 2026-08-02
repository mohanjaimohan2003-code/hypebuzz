export const COMPARE_STORAGE_KEY = "hypebuzz.compare.productIds";
export const COMPARE_CHANGE_EVENT = "hypebuzz:compare-change";
export const MAX_COMPARE_PRODUCTS = 4;

export function parseCompareSelection(value:string|null) {
  try {
    const parsed=JSON.parse(value??"[]") as unknown;
    if(!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((id):id is string=>typeof id==="string"&&/^[0-9a-f-]{36}$/i.test(id)))].slice(0,MAX_COMPARE_PRODUCTS);
  } catch { return []; }
}

