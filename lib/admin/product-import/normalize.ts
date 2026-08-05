import type { ImportWarning, NormalizedImportedOffer, NormalizedImportedProduct } from "./types";

export const MAX_JSON_IMPORT_OFFERS = 5;

const aliases = {
  productName: ["productName", "name", "title", "product_name"],
  shortDescription: ["shortDescription", "short_description"],
  description: ["description", "longDescription", "detailedDescription"],
  currentPrice: ["currentPrice", "price", "salePrice"],
  originalPrice: ["originalPrice", "mrp", "original_price"],
  affiliateUrl: ["affiliateUrl", "affiliate_link", "productUrl"],
  featuredProduct: ["featuredProduct", "isFeatured"],
  trendingProduct: ["trendingProduct", "isTrending"],
  stockStatus: ["stockStatus", "stock", "availability"],
} as const;

type RawRecord = Record<string, unknown>;

function aliased(record: RawRecord, field: keyof typeof aliases) {
  for (const key of aliases[field]) if (Object.hasOwn(record, key)) return record[key];
  return undefined;
}

function direct(record: RawRecord, key: string) {
  return Object.hasOwn(record, key) ? record[key] : undefined;
}

export function normalizeSlug(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 160)
    .replace(/-+$/g, "");
}

export function normalizeBoolean(value: unknown): boolean | undefined {
  if (value === true || value === false) return value;
  if (value === 1 || value === "1" || (typeof value === "string" && ["true", "yes"].includes(value.trim().toLowerCase()))) return true;
  if (value === 0 || value === "0" || (typeof value === "string" && ["false", "no"].includes(value.trim().toLowerCase()))) return false;
  return undefined;
}

export function normalizePrice(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : undefined;
  if (typeof value !== "string") return undefined;
  const cleaned = value.trim().replace(/[₹,\s]/g, "");
  if (!/^\d+(?:\.\d{1,2})?$/.test(cleaned)) return undefined;
  const price = Number(cleaned);
  return Number.isFinite(price) && price >= 0 ? price : undefined;
}

function stringValue(value: unknown, field: string, warnings: ImportWarning[]) {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    warnings.push({ field, message: `${field} must be text.` });
    return undefined;
  }
  return value.trim();
}

function uniqueStrings(value: unknown, field: string, warnings: ImportWarning[]) {
  if (value === undefined) return undefined;
  const source = typeof value === "string" && field === "searchTags" ? value.split(",") : value;
  if (!Array.isArray(source)) {
    warnings.push({ field, message: `${field} must be an array of text values${field === "searchTags" ? " or comma-separated text" : ""}.` });
    return undefined;
  }
  const invalid = source.some((item) => typeof item !== "string");
  if (invalid) warnings.push({ field, message: `${field} contained non-text items, which were ignored.` });
  return [...new Set(source.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean))];
}

function stockStatus(value: unknown, warnings: ImportWarning[]) {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    warnings.push({ field: "stockStatus", message: "Stock Status must be text." });
    return undefined;
  }
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const mapping: Record<string, NormalizedImportedProduct["stockStatus"]> = {
    in_stock: "in_stock", available: "in_stock",
    out_of_stock: "out_of_stock", unavailable: "out_of_stock",
    preorder: "pre_order", pre_order: "pre_order",
    limited: "limited_stock", limited_stock: "limited_stock", unknown: "unknown",
  };
  const result = mapping[normalized];
  if (!result) warnings.push({ field: "stockStatus", message: `Stock Status '${value}' is not supported.` });
  return result;
}

export function normalizeImportedOffer(record:RawRecord,index:number,warnings:ImportWarning[]):NormalizedImportedOffer {
  const prefix=`Offer ${index+1}`;const result:NormalizedImportedOffer={};
  const merchant=stringValue(direct(record,"merchant"),`${prefix} merchant`,warnings);if(merchant)result.merchant=merchant;
  const currentRaw=aliased(record,"currentPrice"),originalRaw=aliased(record,"originalPrice");const current=normalizePrice(currentRaw),original=normalizePrice(originalRaw);
  if(currentRaw!==undefined&&(!current||current<=0))warnings.push({field:`offers.${index}.currentPrice`,message:`${merchant??prefix} current price must be greater than 0.`});else if(current!==undefined)result.currentPrice=current;
  if(originalRaw!==undefined&&original===undefined)warnings.push({field:`offers.${index}.originalPrice`,message:`${merchant??prefix} original price is invalid.`});else if(original!==undefined)result.originalPrice=original;
  const urlRaw=aliased(record,"affiliateUrl");const url=stringValue(urlRaw,`${prefix} affiliate URL`,warnings);if(url){try{const parsed=new URL(url);if(!["http:","https:"].includes(parsed.protocol)||url.length>2048)throw new Error();result.affiliateUrl=url;}catch{warnings.push({field:`offers.${index}.affiliateUrl`,message:`${merchant??prefix} affiliate URL is invalid.`});}}else if(urlRaw!==undefined)warnings.push({field:`offers.${index}.affiliateUrl`,message:`${merchant??prefix} affiliate URL is required before saving this offer.`});
  const currency=stringValue(direct(record,"currency"),`${prefix} currency`,warnings)?.toUpperCase();if(currency&&/^[A-Z]{3}$/.test(currency))result.currency=currency;else if(currency)warnings.push({field:`offers.${index}.currency`,message:`${merchant??prefix} currency must be a three-letter code.`});
  const availability=stockStatus(aliased(record,"stockStatus"),warnings);if(availability)result.stockStatus=availability;
  const active=normalizeBoolean(direct(record,"activeOffer")??direct(record,"isActive"));if(active!==undefined)result.activeOffer=active;
  const label=stringValue(direct(record,"offerLabel")??direct(record,"offerTitle")??direct(record,"merchantProductTitle"),`${prefix} offer label`,warnings);if(label)result.offerLabel=label;
  const coupon=stringValue(direct(record,"couponCode")??direct(record,"coupon"),`${prefix} coupon`,warnings);if(coupon)result.couponCode=coupon;
  const shipping=stringValue(direct(record,"shippingNote")??direct(record,"shippingInformation"),`${prefix} shipping note`,warnings);if(shipping)result.shippingNote=shipping;
  const checked=stringValue(direct(record,"lastCheckedAt"),`${prefix} last checked`,warnings);if(checked&&!Number.isNaN(Date.parse(checked)))result.lastCheckedAt=new Date(checked).toISOString().slice(0,16);
  return result;
}

export function normalizeImportedProduct(record: RawRecord) {
  const warnings: ImportWarning[] = [];
  const productName = stringValue(aliased(record, "productName"), "Product Name", warnings);
  const rawSlug = stringValue(direct(record, "slug"), "Slug", warnings);
  const normalizedSlug = rawSlug ? normalizeSlug(rawSlug) : productName ? normalizeSlug(productName) : undefined;
  if (rawSlug && normalizedSlug !== rawSlug) warnings.push({ field: "slug", message: `Slug was normalized to '${normalizedSlug}'.` });

  const currentRaw = aliased(record, "currentPrice");
  const originalRaw = aliased(record, "originalPrice");
  const currentPrice = normalizePrice(currentRaw);
  const originalPrice = normalizePrice(originalRaw);
  if (currentRaw !== undefined && currentPrice === undefined) warnings.push({ field: "currentPrice", message: "Current Price must be a valid non-negative number." });
  if (originalRaw !== undefined && originalPrice === undefined) warnings.push({ field: "originalPrice", message: "Original Price must be a valid non-negative number." });

  const affiliateUrl = stringValue(aliased(record, "affiliateUrl"), "Affiliate URL", warnings);
  let validAffiliateUrl = affiliateUrl;
  if (affiliateUrl) {
    try {
      const parsed = new URL(affiliateUrl);
      if (!["http:", "https:"].includes(parsed.protocol) || affiliateUrl.length > 2048) throw new Error();
    } catch {
      warnings.push({ field: "affiliateUrl", message: "The affiliate URL is not valid." });
      validAffiliateUrl = undefined;
    }
  }

  const currencyRaw = stringValue(direct(record, "currency"), "Currency", warnings);
  const currency = currencyRaw?.toUpperCase();
  const validCurrency = currency && /^[A-Z]{3}$/.test(currency) ? currency : undefined;
  if (currencyRaw && !validCurrency) warnings.push({ field: "currency", message: "Currency must be a three-letter code such as INR." });

  const statusRaw = direct(record, "status");
  let status: "draft" | "published" = "draft";
  if (typeof statusRaw === "string" && statusRaw.trim().toLowerCase() === "published") status = "published";
  else if (statusRaw !== undefined && !(typeof statusRaw === "string" && ["draft", "inactive"].includes(statusRaw.trim().toLowerCase()))) {
    warnings.push({ field: "status", message: "Unsupported status was changed to draft." });
  }
  if (typeof statusRaw === "string" && statusRaw.trim().toLowerCase() === "inactive") {
    warnings.push({ field: "status", message: "Inactive is not a product form status and was mapped to draft." });
  }

  const specificationsRaw = direct(record, "specifications");
  let specifications: Record<string, string> | undefined;
  if (specificationsRaw !== undefined) {
    if (specificationsRaw && typeof specificationsRaw === "object" && !Array.isArray(specificationsRaw)) {
      specifications = Object.fromEntries(Object.entries(specificationsRaw)
        .filter(([key, value]) => key.trim() && ["string", "number", "boolean"].includes(typeof value))
        .map(([key, value]) => [key.trim(), String(value).trim()]).filter(([, value]) => value));
    } else warnings.push({ field: "specifications", message: "Specifications must be a key-value object." });
  }

  const faqRaw = direct(record, "faq");
  let faq: NormalizedImportedProduct["faq"];
  if (faqRaw !== undefined) {
    if (Array.isArray(faqRaw)) {
      faq = faqRaw.flatMap((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return [];
        const question = (item as RawRecord).question;
        const answer = (item as RawRecord).answer;
        return typeof question === "string" && question.trim() && typeof answer === "string" && answer.trim()
          ? [{ question: question.trim(), answer: answer.trim() }]
          : [];
      });
      if (faq.length !== faqRaw.length) warnings.push({ field: "faq", message: "Incomplete FAQ entries were ignored." });
    } else warnings.push({ field: "faq", message: "FAQ must be an array of question-answer objects." });
  }

  const result: NormalizedImportedProduct = {
    ...(productName ? { productName } : {}),
    ...(normalizedSlug ? { slug: normalizedSlug } : {}),
    status,
  };
  const offersRaw=direct(record,"offers");
  if(Array.isArray(offersRaw)) result.offers=offersRaw.filter((offer):offer is RawRecord=>Boolean(offer)&&typeof offer==="object"&&!Array.isArray(offer)).map((offer,index)=>normalizeImportedOffer(offer,index,warnings));
  const stringFields = ["brand", "category", "subcategory", "seoTitle", "seoDescription", "merchant", "offerLabel"] as const;
  for (const field of stringFields) {
    const value = stringValue(direct(record, field), field, warnings);
    if (value) Object.assign(result, { [field]: value });
  }
  const shortDescription = stringValue(aliased(record, "shortDescription"), "Short Description", warnings);
  const description = stringValue(aliased(record, "description"), "Description", warnings);
  if (shortDescription !== undefined) result.shortDescription = shortDescription;
  if (description !== undefined) result.description = description;
  if (currentPrice !== undefined) result.currentPrice = currentPrice;
  if (originalPrice !== undefined) result.originalPrice = originalPrice;
  if (validAffiliateUrl) result.affiliateUrl = validAffiliateUrl;
  if (validCurrency) result.currency = validCurrency;
  const normalizedStock = stockStatus(aliased(record, "stockStatus"), warnings);
  if (normalizedStock) result.stockStatus = normalizedStock;
  for (const [field, raw] of [
    ["activeOffer", direct(record, "activeOffer")],
    ["featuredProduct", aliased(record, "featuredProduct")],
    ["trendingProduct", aliased(record, "trendingProduct")],
  ] as const) {
    const value = normalizeBoolean(raw);
    if (raw !== undefined && value === undefined) warnings.push({ field, message: `${field} must be true/false, yes/no, or 1/0.` });
    if (value !== undefined) Object.assign(result, { [field]: value });
  }
  for (const field of ["highlights", "searchTags", "pros", "considerations"] as const) {
    const values = uniqueStrings(direct(record, field), field, warnings);
    if (values) Object.assign(result, { [field]: values });
  }
  if (specifications) result.specifications = specifications;
  if (faq) result.faq = faq;
  const suppliedDiscount = normalizePrice(direct(record, "discountPercentage"));
  if (suppliedDiscount !== undefined && suppliedDiscount <= 100) result.discountPercentage = Math.round(suppliedDiscount);
  else if (currentPrice !== undefined && originalPrice !== undefined && originalPrice > currentPrice && currentPrice > 0) {
    result.discountPercentage = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }
  return { product: result, warnings };
}
