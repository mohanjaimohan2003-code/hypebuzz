"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { Json, ProductImage } from "@/lib/types/database";
import { isOfferEligibleForPublication, publicationErrorMessages } from "@/lib/offers/publication-contract";
import { richFieldsDatabasePayload } from "@/lib/products/rich-fields";
import { cleanImportedReferenceDisplayName, normalizeReferenceName } from "@/lib/admin/product-import/match-record";
import { createBrandSlug } from "@/lib/validation/brand";
import {
  isUuid,
  validateProductForm,
  type ProductActionState,
  type ProductFormValues,
} from "@/lib/validation/product";

function authorizationError(): ProductActionState {
  return {
    status: "error",
    message: "Your admin session is not authorized for this action.",
    fieldErrors: {},
  };
}

type SupabaseDatabaseError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

function logSupabaseError(step: string, error: SupabaseDatabaseError | null) {
  console.error({
    step,
    code: error?.code ?? "unknown",
    message: error?.message ?? "Supabase returned an unknown database error.",
    details: error?.details ?? null,
    hint: error?.hint ?? null,
  });
}

function operationErrorMessage(step: string, error: SupabaseDatabaseError, productionMessage: string) {
  logSupabaseError(step, error);
  if (process.env.NODE_ENV !== "development") return productionMessage;
  return `[${step}] ${error.code ?? "unknown"}: ${error.message ?? "Unknown Supabase error."}${error.details ? ` Details: ${error.details}` : ""}${error.hint ? ` Hint: ${error.hint}` : ""}`;
}

function extractDatabaseObject(
  error: SupabaseDatabaseError,
  kind: "table" | "column" | "constraint",
) {
  const text = [error.message, error.details, error.hint].filter(Boolean).join(" ");
  const patterns = {
    table: [/table [\"']?([\w.]+)[\"']?/i, /relation [\"']?([\w.]+)[\"']?/i],
    column: [/column [\"']?([\w.]+)[\"']?/i],
    constraint: [/constraint [\"']?([\w.]+)[\"']?/i],
  };

  for (const pattern of patterns[kind]) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1];
  }

  return "not reported";
}

function databaseError(
  error: SupabaseDatabaseError | null,
  operation: string,
): ProductActionState {
  const reportedTable = extractDatabaseObject(error ?? {}, "table");
  const diagnostic = {
    operation,
    code: error?.code ?? "unknown",
    message: error?.message ?? "Supabase returned an unknown database error.",
    table: reportedTable === "not reported" ? "products" : reportedTable,
    column: extractDatabaseObject(error ?? {}, "column"),
    constraint: extractDatabaseObject(error ?? {}, "constraint"),
    details: error?.details ?? "not reported",
    hint: error?.hint ?? "not reported",
  };

  logSupabaseError(operation, error);

  if (process.env.NODE_ENV === "development") {
    return {
      status: "error",
      message: `[${operation}] ${diagnostic.code}: ${diagnostic.message}${error?.details ? ` Details: ${error.details}` : ""}${error?.hint ? ` Hint: ${error.hint}` : ""}`,
      fieldErrors: {},
    };
  }

  if (error?.code === "23505") {
    return {
      status: "error",
      message: "That slug is already in use. Choose a different slug.",
      fieldErrors: { slug: "This slug is already assigned to another product." },
    };
  }

  if (error?.code === "23503") {
    return {
      status: "error",
      message: "The selected category no longer exists.",
      fieldErrors: { categoryId: "Choose an available category." },
    };
  }

  if (error?.code === "23502") {
    return {
      status: "error",
      message: `A required product value is missing${diagnostic.column === "not reported" ? "." : `: ${diagnostic.column}.`}`,
      fieldErrors: {},
    };
  }

  if (error?.code === "22P02") {
    return {
      status: "error",
      message: "A product value has an invalid database format.",
      fieldErrors: {},
    };
  }

  if (error?.code === "42501") {
    return {
      status: "error",
      message: "Your database grants or admin RLS policies do not allow this catalog change.",
      fieldErrors: {},
    };
  }

  return {
    status: "error",
    message: "The product could not be saved. Please try again or contact an administrator.",
    fieldErrors: {},
  };
}

function revalidateProductRoutes() {
  revalidatePath("/admin");
  revalidatePath("/admin/products", "layout");
  revalidatePath("/");
  revalidatePath("/trending");
  revalidatePath("/categories/[slug]", "page");
  revalidatePath("/products/[slug]", "page");
}

async function isAuthorizedAdmin() {
  const access = await getAdminAccess();
  return access.status === "authenticated";
}

type ImportedBrandReference = { id: string; name: string; slug: string; isActive: boolean };
export type ImportedBrandResolution =
  | { status: "selected" | "created"; brand: ImportedBrandReference; message: string }
  | { status: "selection_required"; brands: ImportedBrandReference[]; message: string }
  | { status: "error"; message: string };

function cleanImportedBrandName(value: string) {
  return cleanImportedReferenceDisplayName(value).slice(0, 120);
}

export async function resolveOrCreateImportedBrand(rawName: string): Promise<ImportedBrandResolution> {
  if (!(await isAuthorizedAdmin())) return { status: "error", message: "Your admin session is not authorized to create brands." };
  const name = cleanImportedBrandName(rawName);
  const slug = createBrandSlug(name);
  if (name.length < 2 || !slug) return { status: "error", message: "The imported brand name is not valid." };

  const supabase = await createClient();
  async function findMatches() {
    const result = await supabase.from("brands").select("id, name, slug, is_active").returns<Array<{ id: string; name: string; slug: string; is_active: boolean }>>();
    if (result.error) return { error: result.error, matches: [] as ImportedBrandReference[] };
    const normalized = normalizeReferenceName(name);
    const matches = (result.data ?? []).filter((brand) => brand.slug.toLowerCase() === slug
      || brand.name.toLowerCase() === name.toLowerCase()
      || normalizeReferenceName(brand.name) === normalized)
      .map((brand) => ({ id: brand.id, name: brand.name, slug: brand.slug, isActive: brand.is_active }));
    return { error: null, matches: [...new Map(matches.map((brand) => [brand.id, brand])).values()] };
  }

  const existing = await findMatches();
  if (existing.error) return { status: "error", message: operationErrorMessage("find imported brand", existing.error, "Brands could not be checked before import.") };
  if (existing.matches.length === 1) return { status: "selected", brand: existing.matches[0], message: `Brand '${existing.matches[0].name}' was selected.` };
  if (existing.matches.length > 1) return { status: "selection_required", brands: existing.matches, message: `Brand '${name}' matched multiple records. Select the correct brand.` };

  const inserted = await supabase.from("brands").insert({ name, slug, is_active: true, description: null, logo_url: null, website_url: null })
    .select("id, name, slug, is_active").single<{ id: string; name: string; slug: string; is_active: boolean }>();
  if (inserted.error) {
    console.error({
      step: "insert imported brand",
      code: inserted.error.code,
      message: inserted.error.message,
      details: inserted.error.details,
      hint: inserted.error.hint,
    });
  }
  if (!inserted.error && inserted.data) {
    revalidatePath("/admin/brands", "layout");
    return { status: "created", brand: { id: inserted.data.id, name: inserted.data.name, slug: inserted.data.slug, isActive: inserted.data.is_active }, message: `Brand '${inserted.data.name}' was created and selected. You can add its logo later.` };
  }
  if (inserted.error?.code === "23505") {
    const concurrent = await findMatches();
    if (!concurrent.error && concurrent.matches.length === 1) return { status: "selected", brand: concurrent.matches[0], message: `Brand '${concurrent.matches[0].name}' was selected.` };
    if (!concurrent.error && concurrent.matches.length > 1) return { status: "selection_required", brands: concurrent.matches, message: `Brand '${name}' matched multiple records. Select the correct brand.` };
  }
  if (process.env.NODE_ENV === "development") {
    return {
      status: "error",
      message: `[insert imported brand] ${inserted.error?.code ?? "unknown"}: ${inserted.error?.message ?? "Supabase returned no inserted brand."}${inserted.error?.details ? ` Details: ${inserted.error.details}` : ""}${inserted.error?.hint ? ` Hint: ${inserted.error.hint}` : ""}`,
    };
  }
  return { status: "error", message: "The imported brand could not be created." };
}

async function categoryExists(categoryId: string): Promise<{
  exists: boolean;
  active: boolean;
  error?: SupabaseDatabaseError;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, is_active")
    .eq("id", categoryId)
    .maybeSingle();

  if (error) return { exists: false, active: false, error };
  return { exists: Boolean(data), active: data?.is_active === true };
}

async function saveProductWithOffer(productId: string | null, values: ProductFormValues, formData: FormData, primaryImageUrl: string | null = null) {
  const offerIdValue = String(formData.get("offerId") ?? "").trim();
  const primaryOffer = values.offers.find((offer) => isOfferEligibleForPublication({
    affiliateUrl: offer.affiliateUrl,
    currentPrice: offer.currentPrice,
    originalPrice: offer.originalPrice,
    currency: offer.currency,
    availability: offer.stockStatus,
    isActive: offer.isActive,
    // Active merchant IDs are re-read by validateProductOfferMerchants.
    merchantIsActive: true,
  })) ?? values.offers[0];
  const offerId = primaryOffer?.persisted === true && isUuid(primaryOffer.id) ? primaryOffer.id : (isUuid(offerIdValue) ? offerIdValue : null);
  const hasOffer = Boolean(primaryOffer);
  const supabase = await createClient();
  const result = await supabase.rpc("save_product_with_offer", {
    p_product_id: productId,
    p_name: values.name,
    p_slug: values.slug,
    p_short_description: values.shortDescription || null,
    p_category_id: values.categoryId,
    p_primary_image_url: primaryImageUrl,
    p_is_featured: values.isFeatured,
    p_is_trending: values.isTrending,
    p_status: values.status,
    p_offer_id: hasOffer ? offerId : null,
    p_merchant_id: hasOffer ? primaryOffer.merchantId : null,
    p_affiliate_url: hasOffer ? primaryOffer.affiliateUrl : null,
    p_current_price: hasOffer ? primaryOffer.currentPrice : null,
    p_original_price: hasOffer ? primaryOffer.originalPrice : null,
    p_currency: hasOffer ? primaryOffer.currency : null,
    p_availability: hasOffer ? primaryOffer.stockStatus : null,
    p_offer_is_active: hasOffer ? primaryOffer.isActive : null,
  });
  if (result.error) logSupabaseError(productId ? "update products via save_product_with_offer" : "insert products via save_product_with_offer", result.error);
  return result;
}

async function validateBrandReference(brandId: string) {
  if (!brandId) return { exists: true, error: null };
  const supabase = await createClient();
  const { data, error } = await supabase.from("brands").select("id").eq("id", brandId).maybeSingle();
  return { exists: Boolean(data), error };
}

async function validateProductOfferMerchants(values: ProductFormValues) {
  const activeMerchantIds = [...new Set(
    values.offers.filter((offer) => offer.isActive).map((offer) => offer.merchantId),
  )];
  if (!activeMerchantIds.length) return { valid: true, error: null };
  const supabase = await createClient();
  const result = await supabase.from("merchants").select("id").in("id", activeMerchantIds)
    .eq("is_active", true).returns<Array<{ id: string }>>();
  return {
    valid: !result.error && (result.data ?? []).length === activeMerchantIds.length,
    error: result.error,
  };
}

async function saveProductDetails(productId: string, values: ProductFormValues) {
  const supabase = await createClient();
  const result = await supabase.from("products").update({
    brand_id: values.brandId || null,
    ...richFieldsDatabasePayload(values),
  }).eq("id", productId).select("id").maybeSingle();
  if (result.error) logSupabaseError("update products rich fields (description, highlights, specifications, SEO)", result.error);
  return result;
}

const IMAGE_BUCKET = "product-images";
async function imageExtension(file: File) { const b = new Uint8Array(await file.slice(0,12).arrayBuffer()); if (b[0]===0xff&&b[1]===0xd8&&b[2]===0xff) return "jpg"; if (b[0]===0x89&&b[1]===0x50&&b[2]===0x4e&&b[3]===0x47) return "png"; if (String.fromCharCode(...b.slice(0,4))==="RIFF"&&String.fromCharCode(...b.slice(8,12))==="WEBP") return "webp"; return null; }
function safeFileName(name: string) { return name.replace(/\.[^.]+$/,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,60)||"product"; }
type SavedImage = { id:string; image_url:string; storage_path:string|null; source_type:"upload"|"external"; alt_text:string; sort_order:number; is_primary:boolean };
async function syncProductImages(productId:string, productName:string, values:ProductFormValues, formData:FormData) {
  const supabase=await createClient(); const files=formData.getAll("uploadedImages").filter((x):x is File=>x instanceof File&&x.size>0); const existingResult=await supabase.from("product_images").select("*").eq("product_id",productId).returns<ProductImage[]>();
  if(existingResult.error) return operationErrorMessage("select product_images before replacement", existingResult.error, "Product images could not be loaded."); const existing=new Map((existingResult.data??[]).map(x=>[x.id,x])); const rows:SavedImage[]=[]; const uploaded:string[]=[];
  for(let index=0;index<values.imageManifest.length;index++){const item=values.imageManifest[index]; if(item.kind==="existing"){const found=existing.get(item.id!);if(!found){if(uploaded.length){const cleanup=await supabase.storage.from(IMAGE_BUCKET).remove(uploaded);if(cleanup.error)logSupabaseError("remove uploaded images after validation failure",cleanup.error);}return "An existing image is no longer available. Refresh and try again.";}rows.push({id:found.id,image_url:found.image_url,storage_path:found.storage_path,source_type:found.source_type,alt_text:found.alt_text??`${productName} product image ${index+1}`,sort_order:index,is_primary:item.isPrimary});continue;} const id=crypto.randomUUID();if(item.kind==="external"){rows.push({id,image_url:item.url!,storage_path:null,source_type:"external",alt_text:`${productName} product image ${index+1}`,sort_order:index,is_primary:item.isPrimary});continue;} const file=files[item.fileIndex!];const ext=await imageExtension(file);if(!ext){if(uploaded.length){const cleanup=await supabase.storage.from(IMAGE_BUCKET).remove(uploaded);if(cleanup.error)logSupabaseError("remove uploaded images after invalid file",cleanup.error);}return "Only genuine JPG, PNG, or WebP images are allowed.";}const path=`products/${productId}/${crypto.randomUUID()}-${safeFileName(file.name)}.${ext}`;const result=await supabase.storage.from(IMAGE_BUCKET).upload(path,file,{contentType:ext==="jpg"?"image/jpeg":`image/${ext}`,upsert:false});if(result.error){if(uploaded.length){const cleanup=await supabase.storage.from(IMAGE_BUCKET).remove(uploaded);if(cleanup.error)logSupabaseError("remove uploaded images after upload failure",cleanup.error);}return operationErrorMessage("upload image to product-images storage",result.error,"This image could not be uploaded. Please try again.");}uploaded.push(path);rows.push({id,image_url:`/product-images/${id}`,storage_path:path,source_type:"upload",alt_text:`${productName} product image ${index+1}`,sort_order:index,is_primary:item.isPrimary});}
  if(rows.length&&!rows.some(x=>x.is_primary))rows[0].is_primary=true;const replaced=await supabase.rpc("replace_product_images",{p_product_id:productId,p_images:rows as unknown as Json});if(replaced.error){if(uploaded.length){const cleanup=await supabase.storage.from(IMAGE_BUCKET).remove(uploaded);if(cleanup.error)logSupabaseError("remove uploaded images after product_images failure",cleanup.error);}return operationErrorMessage("insert product_images via replace_product_images",replaced.error,"Product images could not be saved. Please try again.");}const retained=new Set(rows.map(x=>x.id));const removed=(existingResult.data??[]).filter(x=>!retained.has(x.id)&&x.storage_path).map(x=>x.storage_path!);if(removed.length){const cleanup=await supabase.storage.from(IMAGE_BUCKET).remove(removed);if(cleanup.error)logSupabaseError("remove replaced product images from storage",cleanup.error);}return null;
}

async function syncProductOffers(productId: string, values: ProductFormValues) {
  const supabase = await createClient();
  const activeMerchantIds = [...new Set(values.offers.filter((offer) => offer.isActive).map((offer) => offer.merchantId))];
  if (activeMerchantIds.length) {
    const result = await supabase.from("merchants").select("id").in("id", activeMerchantIds).eq("is_active", true).returns<Array<{ id: string }>>();
    if (result.error || (result.data ?? []).length !== activeMerchantIds.length) return "Active offers must use active merchants.";
  }
  const rows = values.offers.map((offer) => ({
    id: offer.id,
    merchant_id: offer.merchantId,
    affiliate_url: offer.affiliateUrl,
    current_price: offer.currentPrice,
    original_price: offer.originalPrice,
    currency: offer.currency,
    availability: offer.stockStatus,
    is_active: offer.isActive,
    coupon_code: offer.couponCode,
    shipping_note: offer.shippingNote,
    offer_title: offer.offerTitle,
    last_checked_at: offer.lastCheckedAt ? new Date(offer.lastCheckedAt).toISOString() : null,
  }));
  const result = await supabase.rpc("replace_product_offers", { p_product_id: productId, p_offers: rows as unknown as Json });
  if (result.error) {
    return operationErrorMessage("insert product_offers via replace_product_offers", result.error,
      result.error.code === "23505" ? "Only one active offer per merchant is allowed." : "Product offers could not be saved. Please try again.");
  }
  return null;
}

function inactivePublishedCategoryError(): ProductActionState {
  return {
    status: "error",
    message: "Published products must use an active category.",
    fieldErrors: { categoryId: "Activate this category or choose an active category." },
  };
}

export async function createProduct(
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  if (!(await isAuthorizedAdmin())) return authorizationError();

  const validation = validateProductForm(formData);
  if (!validation.success) return validation.state;

  const category = await categoryExists(validation.data.categoryId);
  if (category.error) return databaseError(category.error, "insert");
  if (!category.exists) {
    return {
      status: "error",
      message: "The selected category is no longer available.",
      fieldErrors: { categoryId: "Choose an available category." },
    };
  }
  if (validation.data.status === "published" && !category.active) {
    return inactivePublishedCategoryError();
  }
  const merchants = await validateProductOfferMerchants(validation.data);
  if (merchants.error) return databaseError(merchants.error, "insert");
  if (!merchants.valid) return { status: "error", message: publicationErrorMessages.OFFER_MERCHANT_INACTIVE, fieldErrors: { offerList: publicationErrorMessages.OFFER_MERCHANT_INACTIVE } };
  const brand = await validateBrandReference(validation.data.brandId);
  if (brand.error) return databaseError(brand.error, "insert");
  if (!brand.exists) return { status: "error", message: "The selected brand no longer exists.", fieldErrors: { brandId: "Choose an available brand." } };

  const initialPrimary = validation.data.imageManifest.find(x=>x.isPrimary&&x.kind==="external")?.url ?? validation.data.imageManifest.find(x=>x.kind==="external")?.url ?? null;
  const { data, error } = await saveProductWithOffer(null, validation.data, formData, initialPrimary);

  if (error) return databaseError(error, "insert products via save_product_with_offer");
  if (!data) return { status:"error",message:"The product could not be created.",fieldErrors:{} };
  const brandResult = await saveProductDetails(data, validation.data);
  if (brandResult.error || !brandResult.data) { const supabase = await createClient(); const cleanup=await supabase.rpc("delete_failed_product", { p_product_id: data }); if(cleanup.error)logSupabaseError("delete failed product after rich-field update",cleanup.error); return databaseError(brandResult.error, "update products rich fields (description, highlights, specifications, SEO)"); }
  const imageError=await syncProductImages(data,validation.data.name,validation.data,formData);
  if(imageError){const supabase=await createClient();const cleanup=await supabase.rpc("delete_failed_product",{p_product_id:data});if(cleanup.error)logSupabaseError("delete failed product after image failure",cleanup.error);return {status:"error",message:imageError,fieldErrors:{imageUrl:imageError}};}
  const offerError = await syncProductOffers(data, validation.data);
  if (offerError) { const supabase = await createClient(); const cleanup=await supabase.rpc("delete_failed_product", { p_product_id: data }); if(cleanup.error)logSupabaseError("delete failed product after product_offers failure",cleanup.error); return { status: "error", message: offerError, fieldErrors: { offerList: offerError } }; }

  revalidateProductRoutes();
  redirect("/admin/products?notice=created");
}

export async function updateProduct(
  productId: string,
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  if (!(await isAuthorizedAdmin())) return authorizationError();

  if (!isUuid(productId)) {
    return { status: "error", message: "The product could not be found.", fieldErrors: {} };
  }

  const validation = validateProductForm(formData);
  if (!validation.success) return validation.state;

  const category = await categoryExists(validation.data.categoryId);
  if (category.error) return databaseError(category.error, "update");
  if (!category.exists) {
    return {
      status: "error",
      message: "The selected category is no longer available.",
      fieldErrors: { categoryId: "Choose an available category." },
    };
  }
  if (validation.data.status === "published" && !category.active) {
    return inactivePublishedCategoryError();
  }
  const merchants = await validateProductOfferMerchants(validation.data);
  if (merchants.error) return databaseError(merchants.error, "update");
  if (!merchants.valid) return { status: "error", message: publicationErrorMessages.OFFER_MERCHANT_INACTIVE, fieldErrors: { offerList: publicationErrorMessages.OFFER_MERCHANT_INACTIVE } };
  const brand = await validateBrandReference(validation.data.brandId);
  if (brand.error) return databaseError(brand.error, "update");
  if (!brand.exists) return { status: "error", message: "The selected brand no longer exists.", fieldErrors: { brandId: "Choose an available brand." } };

  const supabase=await createClient(); const current=await supabase.from("products").select("primary_image_url").eq("id",productId).maybeSingle<{primary_image_url:string|null}>();
  const { data, error } = await saveProductWithOffer(productId, validation.data, formData, current.data?.primary_image_url??null);

  if (error) return databaseError(error, "update products via save_product_with_offer");
  if (!data) {
    return { status: "error", message: "The product could not be found.", fieldErrors: {} };
  }
  const brandResult = await saveProductDetails(productId, validation.data);
  if (brandResult.error || !brandResult.data) return databaseError(brandResult.error, "update products rich fields (description, highlights, specifications, SEO)");
  const imageError=await syncProductImages(productId,validation.data.name,validation.data,formData);
  if(imageError)return {status:"error",message:imageError,fieldErrors:{imageUrl:imageError}};
  const offerError = await syncProductOffers(productId, validation.data);
  if (offerError) return { status: "error", message: offerError, fieldErrors: { offerList: offerError } };

  revalidateProductRoutes();
  redirect("/admin/products?notice=updated");
}

export async function archiveProduct(
  productId: string,
  _previousState: ProductActionState,
): Promise<ProductActionState> {
  void _previousState;
  if (!(await isAuthorizedAdmin())) return authorizationError();

  if (!isUuid(productId)) {
    return { status: "error", message: "The product could not be found.", fieldErrors: {} };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .update({ status: "archived" })
    .eq("id", productId)
    .select("id")
    .maybeSingle();

  if (error) return databaseError(error, "archive product");
  if (!data) {
    return { status: "error", message: "The product could not be found.", fieldErrors: {} };
  }

  revalidateProductRoutes();
  redirect("/admin/products?notice=archived");
}
