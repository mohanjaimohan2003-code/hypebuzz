import { MAX_JSON_IMPORT_OFFERS, normalizeImportedProduct } from "./normalize";
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
  const root = parsed as Record<string, unknown>;
  let productRecord = root;
  if (Object.hasOwn(root, "product")) {
    if (!root.product || typeof root.product !== "object" || Array.isArray(root.product)) {
      return { success: false, error: "Product must be an object containing the master product fields." };
    }
    productRecord = { ...(root.product as Record<string, unknown>), ...(Object.hasOwn(root, "offers") ? { offers: root.offers } : {}) };
  }
  if(Object.hasOwn(parsed,"offers")){
    const offers=(parsed as Record<string,unknown>).offers;
    if(!Array.isArray(offers))return{success:false,error:"Offers must be an array."};
    if(offers.length===0)return{success:false,error:"At least one merchant offer is required."};
    if(offers.length>MAX_JSON_IMPORT_OFFERS)return{success:false,error:"Maximum 5 merchant offers are currently supported in one product import."};
    if(offers.some((offer)=>!offer||typeof offer!=="object"||Array.isArray(offer)))return{success:false,error:"Every merchant offer must be an object."};
    const names=offers.map((offer)=>String((offer as Record<string,unknown>).merchant??"").trim());
    const seen=new Set<string>();for(const name of names){const normalized=name.toLowerCase().replace(/\s+/g," ");if(normalized&&seen.has(normalized))return{success:false,error:`${name} appears more than once in this product import. Keep only one offer per merchant.`};seen.add(normalized);}
  }
  const { product, warnings } = normalizeImportedProduct(productRecord);
  if (Object.hasOwn(productRecord, "productName") || Object.hasOwn(productRecord, "name") || Object.hasOwn(productRecord, "title") || Object.hasOwn(productRecord, "product_name")) {
    if (!product.productName) warnings.unshift({ field: "productName", message: "Product Name must be non-empty text." });
  }
  const importedFields = Object.keys(product).filter((field) => field !== "status" || Object.hasOwn(productRecord, "status"));
  const supportedInputFields = new Set(["productName", "name", "title", "product_name", "slug", "brand", "category", "subcategory", "shortDescription", "short_description", "description", "longDescription", "detailedDescription", "highlights", "specifications", "merchant", "affiliateUrl", "affiliate_link", "productUrl", "currentPrice", "price", "salePrice", "originalPrice", "mrp", "original_price", "currency", "stockStatus", "stock", "availability", "activeOffer", "offerLabel", "featuredProduct", "isFeatured", "trendingProduct", "isTrending", "seoTitle", "seoDescription", "searchTags", "pros", "considerations", "faq", "status", "offers"]);
  if (!Object.keys(productRecord).some((field) => supportedInputFields.has(field))) return { success: false, error: "No supported product or offer fields were found in this JSON." };
  return { success: true, product, warnings, importedFields };
}
