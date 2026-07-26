import { normalizeImportedProduct } from "./normalize";
import type { ProductImportParseResult } from "./types";

export const MAX_PRODUCT_IMPORT_BYTES = 100 * 1024;
const forbiddenKeys = new Set(["__proto__", "prototype", "constructor"]);

function containsForbiddenKey(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsForbiddenKey);
  return Object.entries(value).some(([key, child]) => forbiddenKeys.has(key) || containsForbiddenKey(child));
}

export function parseProductImportJson(input: string): ProductImportParseResult {
  if (new TextEncoder().encode(input).byteLength > MAX_PRODUCT_IMPORT_BYTES) {
    return { success: false, error: "Product JSON must be 100 KB or smaller." };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return { success: false, error: "Invalid JSON. Check commas, quotation marks and brackets." };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { success: false, error: "Product JSON must contain one product object." };
  }
  if (containsForbiddenKey(parsed)) {
    return { success: false, error: "Product JSON contains a forbidden object key." };
  }
  const { product, warnings } = normalizeImportedProduct(parsed as Record<string, unknown>);
  if (Object.hasOwn(parsed, "productName") || Object.hasOwn(parsed, "name") || Object.hasOwn(parsed, "title") || Object.hasOwn(parsed, "product_name")) {
    if (!product.productName) warnings.unshift({ field: "productName", message: "Product Name must be non-empty text." });
  }
  const importedFields = Object.keys(product).filter((field) => field !== "status" || Object.hasOwn(parsed, "status"));
  return { success: true, product, warnings, importedFields };
}
