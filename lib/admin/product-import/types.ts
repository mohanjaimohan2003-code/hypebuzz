import type { OfferStockStatus } from "@/lib/validation/offer";

export type ImportWarning = { field: string; message: string };

export type ImportedFaq = { question: string; answer: string };

export type NormalizedImportedProduct = {
  productName?: string;
  slug?: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  shortDescription?: string;
  description?: string;
  highlights?: string[];
  specifications?: Record<string, string>;
  merchant?: string;
  affiliateUrl?: string;
  currentPrice?: number;
  originalPrice?: number;
  currency?: string;
  stockStatus?: OfferStockStatus;
  activeOffer?: boolean;
  offerLabel?: string;
  discountPercentage?: number;
  featuredProduct?: boolean;
  trendingProduct?: boolean;
  status: "draft" | "published";
  seoTitle?: string;
  seoDescription?: string;
  searchTags?: string[];
  pros?: string[];
  considerations?: string[];
  faq?: ImportedFaq[];
};

export type ProductImportParseResult =
  | { success: true; product: NormalizedImportedProduct; warnings: ImportWarning[]; importedFields: string[] }
  | { success: false; error: string };

export type ImportReference = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

export type ProductImportApplication = {
  productName?: string;
  slug?: string;
  shortDescription?: string;
  longDescription?: string;
  highlights?: string[];
  specifications?: Record<string, string>;
  seoTitle?: string;
  seoDescription?: string;
  categoryId?: string;
  subcategory?: string;
  brandId?: string;
  brandName?: string;
  status: "draft" | "published";
  featuredProduct?: boolean;
  trendingProduct?: boolean;
  offer?: {
    merchantId?: string;
    affiliateUrl?: string;
    currentPrice?: number;
    originalPrice?: number;
    currency?: string;
    stockStatus?: OfferStockStatus;
    isActive?: boolean;
    offerTitle?: string;
  };
};

export type ProductImportPreview = {
  application: ProductImportApplication;
  product: NormalizedImportedProduct;
  warnings: ImportWarning[];
  importedFields: string[];
  categoryMessage?: string;
  categorySuggestion?: ImportReference;
};
