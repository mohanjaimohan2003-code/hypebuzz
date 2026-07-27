"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Json, ProductImage, ProductStatus } from "@/lib/types/database";
import { isOfferEligibleForPublication, publicationErrorMessages } from "@/lib/offers/publication-contract";
import { cleanImportedReferenceDisplayName, normalizeReferenceName } from "@/lib/admin/product-import/match-record";
import { createBrandSlug } from "@/lib/validation/brand";
import { importedBrandProductionError } from "@/lib/admin/product-import/brand-error";
import { assessAdminIdentity } from "@/lib/auth/admin-identity";
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

function expiredSessionError(): ProductActionState {
  return {
    status: "error",
    message: "Your admin session has expired. Please sign in again.",
    fieldErrors: {},
  };
}

type ProductSupabaseClient = Awaited<ReturnType<typeof createClient>>;
type ProductAuthContext = {
  supabase: ProductSupabaseClient;
  authenticated: boolean;
  userId: string | null;
  requestRole: string | null;
  activeAdmin: boolean;
};

async function inspectProductAuthContext(): Promise<ProductAuthContext> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  let activeAdmin = false;
  let adminRole: string | null = null;

  if (authError) logSupabaseError("authenticate product save request", authError);

  if (user && !authError) {
    const { data: admin, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id, role, is_active")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .eq("is_active", true)
      .maybeSingle<{ user_id: string; role: string; is_active: boolean }>();
    activeAdmin = !adminError && Boolean(admin);
    adminRole = admin?.role ?? null;
    if (adminError) logSupabaseError("verify product save active admin", adminError);
  }

  if (process.env.NODE_ENV === "development") {
    console.info("Product save authentication", {
      authenticatedUserFound: Boolean(user) && !authError,
      authenticatedUserId: user?.id ?? null,
      requestRole: user?.role ?? null,
      adminRole,
      activeAdmin,
      authErrorCode: authError?.code ?? null,
      authErrorMessage: authError?.message ?? null,
    });
  }

  return {
    supabase,
    authenticated: Boolean(user) && !authError,
    userId: user?.id ?? null,
    requestRole: user?.role ?? null,
    activeAdmin,
  };
}

export async function diagnoseProductSaveAuthentication(): Promise<{
  authenticated: boolean;
  userIdPresent: boolean;
  activeAdmin: boolean;
}> {
  const auth = await inspectProductAuthContext();
  return {
    authenticated: auth.authenticated,
    userIdPresent: Boolean(auth.userId),
    activeAdmin: auth.activeAdmin,
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
      message: `Catalog change rejected by Supabase (${error.code}: ${error.message ?? "permission denied"}).`,
      fieldErrors: {},
    };
  }

  if (error?.code === "42703") {
    return {
      status: "error",
      message: `The production catalog schema is missing an expected column${diagnostic.column === "not reported" ? "." : `: ${diagnostic.column}.`} Apply the reviewed catalog migration before retrying.`,
      fieldErrors: {},
    };
  }

  return {
    status: "error",
    message: "The product could not be saved. Please try again or contact an administrator.",
    fieldErrors: {},
  };
}

function productInsertError(error: SupabaseDatabaseError, payloadKeys: string[]): ProductActionState {
  logSupabaseError("insert products", error);
  return {
    status: "error",
    message: [
      "Product insert failed",
      `PostgreSQL code: ${error.code ?? "unknown"}`,
      `Message: ${error.message ?? "Unknown database error."}`,
      `Details: ${error.details ?? "None"}`,
      `Hint: ${error.hint ?? "None"}`,
      `Payload keys: ${payloadKeys.join(", ")}`,
    ].join("\n"),
    fieldErrors: error.code === "23505" ? { slug: "This slug or another unique value already exists." }
      : error.code === "23503" ? { categoryId: "The selected category or brand is invalid." }
      : {},
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

type ImportedBrandReference = { id: string; name: string; slug: string; isActive: boolean };
export type ImportedBrandResolution =
  | { status: "selected" | "created"; brand: ImportedBrandReference; message: string }
  | { status: "selection_required"; brands: ImportedBrandReference[]; message: string }
  | { status: "error"; message: string };

function cleanImportedBrandName(value: string) {
  return cleanImportedReferenceDisplayName(value).slice(0, 120);
}

async function resolveImportedBrandAtSave(supabase: ProductSupabaseClient, rawName: string) {
  const name = cleanImportedBrandName(rawName);
  const slug = createBrandSlug(name);
  if (name.length < 2 || !slug) return { id: null, error: { code: "23502", message: "Imported brand name is invalid." } };
  const existing = await supabase.from("brands").select("id, name, slug").returns<Array<{ id: string; name: string; slug: string }>>();
  if (existing.error) return { id: null, error: existing.error };
  const normalized = normalizeReferenceName(name);
  const match = (existing.data ?? []).find((brand) => brand.slug === slug || normalizeReferenceName(brand.name) === normalized);
  if (match) return { id: match.id, error: null };
  const inserted = await supabase.from("brands").insert({ name, slug }).select("id").single<{ id: string }>();
  if (!inserted.error) return { id: inserted.data.id, error: null };
  if (inserted.error.code === "23505") {
    const concurrent = await supabase.from("brands").select("id").eq("slug", slug).maybeSingle<{ id: string }>();
    if (!concurrent.error && concurrent.data) return { id: concurrent.data.id, error: null };
  }
  return { id: null, error: inserted.error };
}

export async function resolveOrCreateImportedBrand(rawName: string): Promise<ImportedBrandResolution> {
  // Use one request-scoped cookie-aware client for authentication, admin
  // authorization, matching, and insertion. This prevents the write from
  // drifting onto a separate client whose session has not been verified.
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.info("Imported brand authentication", {
    getUserReturnedUser: Boolean(user),
    userId: user?.id ?? null,
    authErrorCode: authError?.code ?? null,
    authErrorMessage: authError?.message ?? null,
  });
  if (authError || !user) return { status: "error", message: assessAdminIdentity({ userId: user?.id ?? null, authFailed: Boolean(authError), admin: null, adminLookupFailed: false }).message };

  const adminResult = await supabase.from("admin_users")
    .select("user_id, role, is_active")
    .eq("user_id", user.id)
    .maybeSingle<{ user_id: string; role: string; is_active: boolean }>();
  console.info("Imported brand admin authorization", {
    userId: user.id,
    adminRowFound: Boolean(adminResult.data),
    adminRole: adminResult.data?.role ?? null,
    adminIsActive: adminResult.data?.is_active ?? null,
    lookupErrorCode: adminResult.error?.code ?? null,
    lookupErrorMessage: adminResult.error?.message ?? null,
  });
  if (adminResult.error) {
    logSupabaseError("verify imported brand admin", adminResult.error);
    return { status: "error", message: assessAdminIdentity({ userId: user.id, authFailed: false, admin: null, adminLookupFailed: true }).message };
  }
  const identity = assessAdminIdentity({ userId: user.id, authFailed: false, admin: adminResult.data, adminLookupFailed: false });
  if (!identity.allowed) return { status: "error", message: identity.message };

  const name = cleanImportedBrandName(rawName);
  const slug = createBrandSlug(name);
  if (name.length < 2 || !slug) return { status: "error", message: "The imported brand name is not valid." };

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

  // Use only the two required columns from migration 001. Production may not
  // yet contain optional migration-009 fields such as description/website_url;
  // is_active already defaults to true.
  const inserted = await supabase.from("brands").insert({ name, slug })
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
    if (!concurrent.error && concurrent.matches.length === 1) return { status: "selected", brand: concurrent.matches[0], message: `Brand '${concurrent.matches[0].name}' already exists and has been selected.` };
    if (!concurrent.error && concurrent.matches.length > 1) return { status: "selection_required", brands: concurrent.matches, message: `Brand '${name}' matched multiple records. Select the correct brand.` };
  }
  if (process.env.NODE_ENV === "development") {
    return {
      status: "error",
      message: `[insert imported brand] ${inserted.error?.code ?? "unknown"}: ${inserted.error?.message ?? "Supabase returned no inserted brand."}${inserted.error?.details ? ` Details: ${inserted.error.details}` : ""}${inserted.error?.hint ? ` Hint: ${inserted.error.hint}` : ""}`,
    };
  }
  return { status: "error", message: importedBrandProductionError(inserted.error, name) };
}

async function categoryExists(supabase: ProductSupabaseClient, categoryId: string): Promise<{
  exists: boolean;
  active: boolean;
  error?: SupabaseDatabaseError;
}> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, is_active")
    .eq("id", categoryId)
    .maybeSingle();

  if (error) return { exists: false, active: false, error };
  return { exists: Boolean(data), active: data?.is_active === true };
}

async function saveProductWithOffer(supabase: ProductSupabaseClient, userId: string, productId: string | null, values: ProductFormValues, formData: FormData, primaryImageUrl: string | null = null) {
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
  const productPayloadKeys = ["name", "slug", "short_description", "category_id", "primary_image_url", "is_featured", "is_trending", "status"];
  console.info("Product insert diagnostic", {
    authenticatedUserId: userId,
    expectedAdminUserId: "52cef260-f9db-4f9b-b970-08761a0aaae5",
    authenticatedUserMatchesExpectedAdmin: userId === "52cef260-f9db-4f9b-b970-08761a0aaae5",
    payloadColumnNames: productPayloadKeys,
    slug: values.slug,
    category_id: values.categoryId,
    brand_id: values.brandId,
    status: values.status,
  });
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
  if (result.error) {
    console.error("Product insert failed", {
      payloadColumnNames: productPayloadKeys,
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
    });
  }
  return result;
}

async function validateBrandReference(supabase: ProductSupabaseClient, brandId: string) {
  if (!brandId) return { exists: true, error: null };
  const { data, error } = await supabase.from("brands").select("id").eq("id", brandId).maybeSingle();
  return { exists: Boolean(data), error };
}

async function validateProductOfferMerchants(supabase: ProductSupabaseClient, values: ProductFormValues) {
  const activeMerchantIds = [...new Set(
    values.offers.filter((offer) => offer.isActive).map((offer) => offer.merchantId),
  )];
  if (!activeMerchantIds.length) return { valid: true, error: null };
  const result = await supabase.from("merchants").select("id").in("id", activeMerchantIds)
    .eq("is_active", true).returns<Array<{ id: string }>>();
  return {
    valid: !result.error && (result.data ?? []).length === activeMerchantIds.length,
    error: result.error,
  };
}

async function saveProductDetails(supabase: ProductSupabaseClient, productId: string, values: ProductFormValues) {
  const supportedPayload: Record<string, string | Json> = {
    brand_id: values.brandId,
    specifications: values.specifications as Json,
  };
  if (values.longDescription) supportedPayload.description = values.longDescription;
  const result = await supabase.from("products").update(supportedPayload).eq("id", productId).select("id").maybeSingle();
  if (result.error) logSupabaseError("update supported product details", result.error);
  return result;
}

const IMAGE_BUCKET = "product-images";
async function imageExtension(file: File) { const b = new Uint8Array(await file.slice(0,12).arrayBuffer()); if (b[0]===0xff&&b[1]===0xd8&&b[2]===0xff) return "jpg"; if (b[0]===0x89&&b[1]===0x50&&b[2]===0x4e&&b[3]===0x47) return "png"; if (String.fromCharCode(...b.slice(0,4))==="RIFF"&&String.fromCharCode(...b.slice(8,12))==="WEBP") return "webp"; return null; }
function safeFileName(name: string) { return name.replace(/\.[^.]+$/,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,60)||"product"; }
type SavedImage = { id:string; image_url:string; storage_path:string|null; source_type:"upload"|"external"; alt_text:string; sort_order:number; is_primary:boolean };
async function syncProductImages(supabase:ProductSupabaseClient, productId:string, productName:string, values:ProductFormValues, formData:FormData) {
  const files=formData.getAll("uploadedImages").filter((x):x is File=>x instanceof File&&x.size>0); const existingResult=await supabase.from("product_images").select("*").eq("product_id",productId).returns<ProductImage[]>();
  if(existingResult.error) return operationErrorMessage("select product_images before replacement", existingResult.error, "Product images could not be loaded."); const existing=new Map((existingResult.data??[]).map(x=>[x.id,x])); const rows:SavedImage[]=[]; const uploaded:string[]=[];
  for(let index=0;index<values.imageManifest.length;index++){const item=values.imageManifest[index]; if(item.kind==="existing"){const found=existing.get(item.id!);if(!found){if(uploaded.length){const cleanup=await supabase.storage.from(IMAGE_BUCKET).remove(uploaded);if(cleanup.error)logSupabaseError("remove uploaded images after validation failure",cleanup.error);}return "An existing image is no longer available. Refresh and try again.";}rows.push({id:found.id,image_url:found.image_url,storage_path:found.storage_path,source_type:found.source_type,alt_text:found.alt_text??`${productName} product image ${index+1}`,sort_order:index,is_primary:item.isPrimary});continue;} const id=crypto.randomUUID();if(item.kind==="external"){rows.push({id,image_url:item.url!,storage_path:null,source_type:"external",alt_text:`${productName} product image ${index+1}`,sort_order:index,is_primary:item.isPrimary});continue;} const file=files[item.fileIndex!];const ext=await imageExtension(file);if(!ext){if(uploaded.length){const cleanup=await supabase.storage.from(IMAGE_BUCKET).remove(uploaded);if(cleanup.error)logSupabaseError("remove uploaded images after invalid file",cleanup.error);}return "Only genuine JPG, PNG, or WebP images are allowed.";}const path=`products/${productId}/${crypto.randomUUID()}-${safeFileName(file.name)}.${ext}`;const result=await supabase.storage.from(IMAGE_BUCKET).upload(path,file,{contentType:ext==="jpg"?"image/jpeg":`image/${ext}`,upsert:false});if(result.error){if(uploaded.length){const cleanup=await supabase.storage.from(IMAGE_BUCKET).remove(uploaded);if(cleanup.error)logSupabaseError("remove uploaded images after upload failure",cleanup.error);}return operationErrorMessage("upload image to product-images storage",result.error,"This image could not be uploaded. Please try again.");}uploaded.push(path);rows.push({id,image_url:`/product-images/${id}`,storage_path:path,source_type:"upload",alt_text:`${productName} product image ${index+1}`,sort_order:index,is_primary:item.isPrimary});}
  if(rows.length&&!rows.some(x=>x.is_primary))rows[0].is_primary=true;const replaced=await supabase.rpc("replace_product_images",{p_product_id:productId,p_images:rows as unknown as Json});if(replaced.error){if(uploaded.length){const cleanup=await supabase.storage.from(IMAGE_BUCKET).remove(uploaded);if(cleanup.error)logSupabaseError("remove uploaded images after product_images failure",cleanup.error);}return operationErrorMessage("insert product_images via replace_product_images",replaced.error,"Product images could not be saved. Please try again.");}const retained=new Set(rows.map(x=>x.id));const removed=(existingResult.data??[]).filter(x=>!retained.has(x.id)&&x.storage_path).map(x=>x.storage_path!);if(removed.length){const cleanup=await supabase.storage.from(IMAGE_BUCKET).remove(removed);if(cleanup.error)logSupabaseError("remove replaced product images from storage",cleanup.error);}return null;
}

async function syncProductOffers(supabase: ProductSupabaseClient, productId: string, values: ProductFormValues) {
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
  const auth = await inspectProductAuthContext();
  if (!auth.authenticated) return expiredSessionError();
  if (!auth.activeAdmin) return authorizationError();
  const { supabase } = auth;

  const validation = validateProductForm(formData);
  if (!validation.success) return validation.state;

  const importedBrandName = String(formData.get("importedBrandName") ?? "").trim();
  if (!validation.data.brandId && importedBrandName) {
    const resolvedBrand = await resolveImportedBrandAtSave(supabase, importedBrandName);
    if (resolvedBrand.error || !resolvedBrand.id) return databaseError(resolvedBrand.error, "resolve or create brand during product save");
    validation.data.brandId = resolvedBrand.id;
  }

  const category = await categoryExists(supabase, validation.data.categoryId);
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
  const merchants = await validateProductOfferMerchants(supabase, validation.data);
  if (merchants.error) return databaseError(merchants.error, "insert");
  if (!merchants.valid) return { status: "error", message: publicationErrorMessages.OFFER_MERCHANT_INACTIVE, fieldErrors: { offerList: publicationErrorMessages.OFFER_MERCHANT_INACTIVE } };
  const brand = await validateBrandReference(supabase, validation.data.brandId);
  if (brand.error) return databaseError(brand.error, "insert");
  if (!brand.exists) return { status: "error", message: "The selected brand no longer exists.", fieldErrors: { brandId: "Choose an available brand." } };

  const initialPrimary = validation.data.imageManifest.find(x=>x.isPrimary&&x.kind==="external")?.url ?? validation.data.imageManifest.find(x=>x.kind==="external")?.url ?? null;
  const productPayloadKeys = ["name", "slug", "short_description", "category_id", "primary_image_url", "is_featured", "is_trending", "status"];
  const { data, error } = await saveProductWithOffer(supabase, auth.userId!, null, validation.data, formData, initialPrimary);
  if (error) return productInsertError(error, productPayloadKeys);
  if (!data) return { status:"error",message:"Product insert failed\nPostgreSQL code: unknown\nMessage: Supabase returned no product ID.\nDetails: None\nHint: None\nPayload keys: " + productPayloadKeys.join(", "),fieldErrors:{} };
  const brandResult = await saveProductDetails(supabase, data, validation.data);
  if (brandResult.error || !brandResult.data) { const cleanup=await supabase.rpc("delete_failed_product", { p_product_id: data }); if(cleanup.error)logSupabaseError("delete failed product after supported product detail update",cleanup.error); return databaseError(brandResult.error, "update supported product details"); }
  const imageError=await syncProductImages(supabase,data,validation.data.name,validation.data,formData);
  if(imageError){const cleanup=await supabase.rpc("delete_failed_product",{p_product_id:data});if(cleanup.error)logSupabaseError("delete failed product after image failure",cleanup.error);return {status:"error",message:imageError,fieldErrors:{imageUrl:imageError}};}
  const offerError = await syncProductOffers(supabase, data, validation.data);
  if (offerError) { const cleanup=await supabase.rpc("delete_failed_product", { p_product_id: data }); if(cleanup.error)logSupabaseError("delete failed product after product_offers failure",cleanup.error); return { status: "error", message: offerError, fieldErrors: { offerList: offerError } }; }

  revalidateProductRoutes();
  redirect("/admin/products?notice=created");
}

export async function updateProduct(
  productId: string,
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const auth = await inspectProductAuthContext();
  if (!auth.authenticated) return expiredSessionError();
  if (!auth.activeAdmin) return authorizationError();
  const { supabase } = auth;

  if (!isUuid(productId)) {
    return { status: "error", message: "The product could not be found.", fieldErrors: {} };
  }

  const validation = validateProductForm(formData);
  if (!validation.success) return validation.state;

  const category = await categoryExists(supabase, validation.data.categoryId);
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
  const merchants = await validateProductOfferMerchants(supabase, validation.data);
  if (merchants.error) return databaseError(merchants.error, "update");
  if (!merchants.valid) return { status: "error", message: publicationErrorMessages.OFFER_MERCHANT_INACTIVE, fieldErrors: { offerList: publicationErrorMessages.OFFER_MERCHANT_INACTIVE } };
  const brand = await validateBrandReference(supabase, validation.data.brandId);
  if (brand.error) return databaseError(brand.error, "update");
  if (!brand.exists) return { status: "error", message: "The selected brand no longer exists.", fieldErrors: { brandId: "Choose an available brand." } };

  const current=await supabase.from("products").select("primary_image_url").eq("id",productId).maybeSingle<{primary_image_url:string|null}>();
  const { data, error } = await saveProductWithOffer(supabase, auth.userId!, productId, validation.data, formData, current.data?.primary_image_url??null);

  if (error) return databaseError(error, "update products via save_product_with_offer");
  if (!data) {
    return { status: "error", message: "The product could not be found.", fieldErrors: {} };
  }
  const brandResult = await saveProductDetails(supabase, productId, validation.data);
  if (brandResult.error || !brandResult.data) return databaseError(brandResult.error, "update products rich fields (description, highlights, specifications, SEO)");
  const imageError=await syncProductImages(supabase,productId,validation.data.name,validation.data,formData);
  if(imageError)return {status:"error",message:imageError,fieldErrors:{imageUrl:imageError}};
  const offerError = await syncProductOffers(supabase, productId, validation.data);
  if (offerError) return { status: "error", message: offerError, fieldErrors: { offerList: offerError } };

  revalidateProductRoutes();
  redirect("/admin/products?notice=updated");
}

export async function archiveProduct(
  productId: string,
  _previousState: ProductActionState,
): Promise<ProductActionState> {
  void _previousState;
  const auth = await inspectProductAuthContext();
  if (!auth.authenticated) return expiredSessionError();
  if (!auth.activeAdmin) return authorizationError();

  if (!isUuid(productId)) {
    return { status: "error", message: "The product could not be found.", fieldErrors: {} };
  }

  const { supabase } = auth;
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

export async function permanentlyDeleteProduct(
  productId: string,
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const auth = await inspectProductAuthContext();
  if (!auth.authenticated) return expiredSessionError();
  if (!auth.activeAdmin) return authorizationError();
  if (!isUuid(productId)) return { status: "error", message: "Product not found.", fieldErrors: {} };
  if (String(formData.get("confirmation") ?? "") !== "DELETE") {
    return { status: "error", message: "Type DELETE exactly to confirm permanent deletion.", fieldErrors: {} };
  }

  const { supabase } = auth;
  const productResult = await supabase.from("products")
    .select("id, status")
    .eq("id", productId)
    .maybeSingle<{ id: string; status: ProductStatus }>();
  if (productResult.error) {
    if (productResult.error.code === "42501") return { status: "error", message: "Permission denied while checking this product.", fieldErrors: {} };
    return { status: "error", message: "Database deletion failed while checking this product.", fieldErrors: {} };
  }
  if (!productResult.data) return { status: "error", message: "Product not found.", fieldErrors: {} };
  if (productResult.data.status !== "archived") {
    return { status: "error", message: "Only archived products can be permanently deleted.", fieldErrors: {} };
  }

  const imagesResult = await supabase.from("product_images")
    .select("storage_path")
    .eq("product_id", productId)
    .not("storage_path", "is", null)
    .returns<Array<{ storage_path: string | null }>>();
  if (imagesResult.error) return { status: "error", message: "Database deletion failed while loading uploaded images.", fieldErrors: {} };
  const storagePaths = [...new Set((imagesResult.data ?? []).flatMap((image) => image.storage_path ? [image.storage_path] : []))];
  if (storagePaths.length) {
    const storageResult = await supabase.storage.from(IMAGE_BUCKET).remove(storagePaths);
    if (storageResult.error) {
      logSupabaseError("delete archived product storage objects", storageResult.error);
      return { status: "error", message: "Storage deletion failed. The product was not deleted.", fieldErrors: {} };
    }
  }

  const deleted = await supabase.rpc("permanently_delete_archived_product", { p_product_id: productId });
  if (deleted.error) {
    logSupabaseError("permanently delete archived product", deleted.error);
    if (deleted.error.code === "42501") return { status: "error", message: "Permission denied. Active admin access is required.", fieldErrors: {} };
    if (deleted.error.code === "P0002") return { status: "error", message: "Product not found.", fieldErrors: {} };
    if (deleted.error.code === "55000") return { status: "error", message: "Only archived products can be permanently deleted.", fieldErrors: {} };
    if (deleted.error.code === "23503") return { status: "error", message: "A related record prevented deletion. No database rows were deleted.", fieldErrors: {} };
    return { status: "error", message: `Database deletion failed (${deleted.error.code ?? "unknown"}: ${deleted.error.message}).`, fieldErrors: {} };
  }

  revalidateProductRoutes();
  redirect("/admin/products?notice=deleted");
}
