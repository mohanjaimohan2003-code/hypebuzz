"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Json, ProductImage, ProductStatus } from "@/lib/types/database";
import { publicationErrorMessages } from "@/lib/offers/publication-contract";
import { createBrandSlug } from "@/lib/validation/brand";
import { matchingProductForCreate, nextAvailableProductSlug } from "@/lib/products/slug-conflict";
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
  activeAdmin: boolean;
};

async function inspectProductAuthContext(): Promise<ProductAuthContext> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  let activeAdmin = false;

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
    if (adminError) logSupabaseError("verify product save active admin", adminError);
  }

  return {
    supabase,
    authenticated: Boolean(user) && !authError,
    userId: user?.id ?? null,
    activeAdmin,
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

function exactDatabaseException(prefix: string, error: SupabaseDatabaseError | null) {
  return `${prefix}\nCode: ${error?.code ?? "unknown"}\nMessage: ${error?.message ?? "Unknown database error."}\nDetails: ${error?.details ?? "None"}\nHint: ${error?.hint ?? "None"}`;
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

async function validateBrandReference(supabase: ProductSupabaseClient, brandId: string) {
  if (!brandId) return { exists: true, error: null };
  const { data, error } = await supabase.from("brands").select("id").eq("id", brandId).maybeSingle();
  return { exists: Boolean(data), error };
}

type ExistingProductSlug = { id: string; name: string; slug: string; status: ProductStatus };

async function findProductBySlug(supabase: ProductSupabaseClient, slug: string) {
  return supabase.from("products").select("id, name, slug, status").eq("slug", slug)
    .maybeSingle<ExistingProductSlug>();
}

function duplicateProductState(product: ExistingProductSlug): ProductActionState {
  return {
    status: "error",
    message: "A product with this slug already exists.",
    fieldErrors: { slug: "This slug belongs to an existing product." },
    existingProductId: product.id,
  };
}

async function resolveCreateSlug(supabase: ProductSupabaseClient, requestedSlug: string, productName: string) {
  const exact = await findProductBySlug(supabase, requestedSlug);
  if (exact.error) return { slug: null, duplicate: null, error: exact.error };
  if (exact.data && matchingProductForCreate(productName, [exact.data])) {
    return { slug: null, duplicate: exact.data, error: null };
  }
  const candidates = await supabase.from("products").select("id, name, slug, status").like("slug", `${requestedSlug}-%`)
    .returns<ExistingProductSlug[]>();
  if (candidates.error) return { slug: null, duplicate: null, error: candidates.error };
  const matchingProduct = matchingProductForCreate(productName, candidates.data ?? []);
  if (matchingProduct) return { slug: null, duplicate: matchingProduct, error: null };
  return { slug: nextAvailableProductSlug(requestedSlug, [exact.data?.slug, ...(candidates.data ?? []).map((product) => product.slug)].filter(Boolean) as string[]), duplicate: null, error: null };
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

const IMAGE_BUCKET = "product-images";
async function imageExtension(file: File) { const b = new Uint8Array(await file.slice(0,12).arrayBuffer()); if (b[0]===0xff&&b[1]===0xd8&&b[2]===0xff) return "jpg"; if (b[0]===0x89&&b[1]===0x50&&b[2]===0x4e&&b[3]===0x47) return "png"; if (String.fromCharCode(...b.slice(0,4))==="RIFF"&&String.fromCharCode(...b.slice(8,12))==="WEBP") return "webp"; return null; }
function safeFileName(name: string) { return name.replace(/\.[^.]+$/,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,60)||"product"; }
type SavedImage = { id:string; image_url:string; storage_path:string|null; source_type:"upload"|"external"; alt_text:string; sort_order:number; is_primary:boolean };
type ImageStage = { rows: SavedImage[]; uploadedPaths: string[]; submissionId: string };

function imageFailure(step:string,error:SupabaseDatabaseError|null,context:{submissionId:string;bucket?:string;objectPath?:string;productId?:string|null}) {
  const message = [
    `Image save failed at step: ${step}`,
    `Code: ${error?.code ?? "unknown"}`,
    `Message: ${error?.message ?? "Unknown Supabase error."}`,
    `Details: ${error?.details ?? "None"}`,
    `Hint: ${error?.hint ?? "None"}`,
    `Bucket: ${context.bucket ?? IMAGE_BUCKET}`,
    `Object path: ${context.objectPath ?? "None"}`,
    `Product ID: ${context.productId ?? "Not created"}`,
    `Submission ID: ${context.submissionId}`,
  ].join("\n");
  console.error(message);
  return message;
}

async function cleanupUploadedImages(supabase:ProductSupabaseClient, paths:string[], submissionId:string, productId:string|null) {
  if (!paths.length) return null;
  const cleanup=await supabase.storage.from(IMAGE_BUCKET).remove(paths);
  if (cleanup.error) return imageFailure("remove uploaded images during rollback",cleanup.error,{submissionId,bucket:IMAGE_BUCKET,objectPath:paths.join(", "),productId});
  return null;
}

async function stageNewProductImages(supabase:ProductSupabaseClient, productName:string, values:ProductFormValues, formData:FormData):Promise<{stage:ImageStage|null;error:string|null}> {
  const submissionId=crypto.randomUUID();
  const files=formData.getAll("uploadedImages").filter((x):x is File=>x instanceof File&&x.size>0);
  const rows:SavedImage[]=[];
  const uploadedPaths:string[]=[];
  for(let index=0;index<values.imageManifest.length;index++) {
    const item=values.imageManifest[index];
    const id=crypto.randomUUID();
    if(item.kind==="existing") return {stage:null,error:imageFailure("validate uploaded image state",{code:"IMAGE_STATE_LOST",message:"A new product cannot reference an existing image row."},{submissionId})};
    if(item.kind==="external") {
      rows.push({id,image_url:item.url!,storage_path:null,source_type:"external",alt_text:`${productName} product image ${index+1}`,sort_order:index,is_primary:item.isPrimary});
      continue;
    }
    const file=files[item.fileIndex!];
    if(!(file instanceof File)||file.size<=0) return {stage:null,error:imageFailure("validate uploaded image state",{code:"IMAGE_STATE_LOST",message:"Uploaded image state was lost. Select the file again."},{submissionId})};
    const ext=await imageExtension(file);
    if(!ext) return {stage:null,error:imageFailure("validate uploaded image bytes",{code:"IMAGE_TYPE_INVALID",message:"Only genuine JPG, PNG, or WebP images are allowed."},{submissionId})};
    const path=`submissions/${submissionId}/${crypto.randomUUID()}-${safeFileName(file.name)}.${ext}`;
    const result=await supabase.storage.from(IMAGE_BUCKET).upload(path,file,{contentType:ext==="jpg"?"image/jpeg":`image/${ext}`,upsert:false});
    if(result.error) {
      await cleanupUploadedImages(supabase,uploadedPaths,submissionId,null);
      return {stage:null,error:imageFailure("upload image to product-images storage",result.error,{submissionId,bucket:IMAGE_BUCKET,objectPath:path})};
    }
    if(!result.data?.path) {
      await cleanupUploadedImages(supabase,[...uploadedPaths,path],submissionId,null);
      return {stage:null,error:imageFailure("generate image object path",{code:"IMAGE_URL_MISSING",message:"Image URL could not be generated because storage returned no object path."},{submissionId,bucket:IMAGE_BUCKET,objectPath:path})};
    }
    uploadedPaths.push(result.data.path);
    rows.push({id,image_url:`/product-images/${id}`,storage_path:result.data.path,source_type:"upload",alt_text:`${productName} product image ${index+1}`,sort_order:index,is_primary:item.isPrimary});
  }
  if(!rows.length) return {stage:null,error:"Upload at least one product image before saving."};
  if(rows.filter(row=>row.is_primary).length!==1) return {stage:null,error:"Choose exactly one primary image."};
  return {stage:{rows,uploadedPaths,submissionId},error:null};
}

type UpdateImageStage = ImageStage & { removedPaths: string[] };
async function stageUpdatedProductImages(supabase:ProductSupabaseClient, productId:string, productName:string, values:ProductFormValues, formData:FormData):Promise<{stage:UpdateImageStage|null;error:string|null}> {
  const submissionId=crypto.randomUUID();
  const files=formData.getAll("uploadedImages").filter((x):x is File=>x instanceof File&&x.size>0); const existingResult=await supabase.from("product_images").select("*").eq("product_id",productId).returns<ProductImage[]>();
  if(existingResult.error) return {stage:null,error:imageFailure("select product_images before replacement",existingResult.error,{submissionId,productId})}; const existing=new Map((existingResult.data??[]).map(x=>[x.id,x])); const rows:SavedImage[]=[]; const uploaded:string[]=[];
  for(let index=0;index<values.imageManifest.length;index++){const item=values.imageManifest[index]; if(item.kind==="existing"){const found=existing.get(item.id!);if(!found){await cleanupUploadedImages(supabase,uploaded,submissionId,productId);return {stage:null,error:imageFailure("validate existing product image",{code:"IMAGE_ROW_MISSING",message:"An existing image is no longer available. Refresh and try again."},{submissionId,productId})};}rows.push({id:found.id,image_url:found.image_url,storage_path:found.storage_path,source_type:found.source_type,alt_text:found.alt_text??`${productName} product image ${index+1}`,sort_order:index,is_primary:item.isPrimary});continue;} const id=crypto.randomUUID();if(item.kind==="external"){rows.push({id,image_url:item.url!,storage_path:null,source_type:"external",alt_text:`${productName} product image ${index+1}`,sort_order:index,is_primary:item.isPrimary});continue;} const file=files[item.fileIndex!];if(!(file instanceof File)||file.size<=0){await cleanupUploadedImages(supabase,uploaded,submissionId,productId);return {stage:null,error:imageFailure("validate uploaded image state",{code:"IMAGE_STATE_LOST",message:"Uploaded image state was lost. Select the file again."},{submissionId,productId})};}const ext=await imageExtension(file);if(!ext){await cleanupUploadedImages(supabase,uploaded,submissionId,productId);return {stage:null,error:imageFailure("validate uploaded image bytes",{code:"IMAGE_TYPE_INVALID",message:"Only genuine JPG, PNG, or WebP images are allowed."},{submissionId,productId})};}const path=`products/${productId}/${crypto.randomUUID()}-${safeFileName(file.name)}.${ext}`;const result=await supabase.storage.from(IMAGE_BUCKET).upload(path,file,{contentType:ext==="jpg"?"image/jpeg":`image/${ext}`,upsert:false});if(result.error){await cleanupUploadedImages(supabase,uploaded,submissionId,productId);return {stage:null,error:imageFailure("upload image to product-images storage",result.error,{submissionId,bucket:IMAGE_BUCKET,objectPath:path,productId})};}uploaded.push(result.data.path);rows.push({id,image_url:`/product-images/${id}`,storage_path:result.data.path,source_type:"upload",alt_text:`${productName} product image ${index+1}`,sort_order:index,is_primary:item.isPrimary});}
  const retained=new Set(rows.map(x=>x.id));const removedPaths=(existingResult.data??[]).filter(x=>!retained.has(x.id)&&x.storage_path).map(x=>x.storage_path!);
  return {stage:{rows,uploadedPaths:uploaded,submissionId,removedPaths},error:null};
}

function productOfferRows(values:ProductFormValues) {
  return values.offers.map((offer) => ({
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
}

function workflowProductPayload(values: ProductFormValues, primaryImageUrl: string, importedBrandName = "") {
  return {
    name: values.name,
    slug: values.slug,
    short_description: values.shortDescription || null,
    description: values.longDescription || null,
    category_id: values.categoryId,
    brand_id: values.brandId || null,
    imported_brand_name: importedBrandName || null,
    imported_brand_slug: importedBrandName ? createBrandSlug(importedBrandName) : null,
    primary_image_url: primaryImageUrl,
    specifications: values.specifications as Json,
    highlights: values.highlights as Json,
    seo_title: values.seoTitle || null,
    seo_description: values.seoDescription || null,
    is_featured: values.isFeatured,
    is_trending: values.isTrending,
    status: values.status,
  };
}

function isProductSlugConflict(error: SupabaseDatabaseError | null) {
  return error?.code === "23505" && [error.message, error.details, error.hint]
    .filter(Boolean).join(" ").includes("products_slug_key");
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

  const slugResolution = await resolveCreateSlug(supabase, validation.data.slug, validation.data.name);
  if (slugResolution.error) return databaseError(slugResolution.error, "check product slug availability");
  if (slugResolution.duplicate) return duplicateProductState(slugResolution.duplicate);
  validation.data.slug = slugResolution.slug!;

  const stagedImages=await stageNewProductImages(supabase,validation.data.name,validation.data,formData);
  if(stagedImages.error||!stagedImages.stage)return {status:"error",message:stagedImages.error??"Upload at least one product image before saving.",fieldErrors:{imageUrl:stagedImages.error??"Upload at least one product image before saving."}};
  const imageStage=stagedImages.stage;
  const primaryImage=imageStage.rows.find(image=>image.is_primary);
  if(!primaryImage){await cleanupUploadedImages(supabase,imageStage.uploadedPaths,imageStage.submissionId,null);return {status:"error",message:"Choose exactly one primary image.",fieldErrors:{imageUrl:"Choose exactly one primary image."}};}
  const productPayloadKeys = ["name", "slug", "short_description", "category_id", "primary_image_url", "is_featured", "is_trending", "status"];
  let productResult = await supabase.rpc("save_product_workflow",{
    p_product_id:null,
    p_product:workflowProductPayload(validation.data,primaryImage.image_url,importedBrandName) as Json,
    p_images:imageStage.rows as unknown as Json,
    p_offers:productOfferRows(validation.data) as unknown as Json,
  });
  if (isProductSlugConflict(productResult.error)) {
    const concurrent = await findProductBySlug(supabase, validation.data.slug);
    if (!concurrent.error && concurrent.data && matchingProductForCreate(validation.data.name, [concurrent.data])) {
      await cleanupUploadedImages(supabase,imageStage.uploadedPaths,imageStage.submissionId,null);
      return duplicateProductState(concurrent.data);
    }
    const retrySlug = await resolveCreateSlug(supabase, validation.data.slug, validation.data.name);
    if (!retrySlug.error && !retrySlug.duplicate && retrySlug.slug && retrySlug.slug !== validation.data.slug) {
      validation.data.slug = retrySlug.slug;
      productResult = await supabase.rpc("save_product_workflow",{
        p_product_id:null,
        p_product:workflowProductPayload(validation.data,primaryImage.image_url,importedBrandName) as Json,
        p_images:imageStage.rows as unknown as Json,
        p_offers:productOfferRows(validation.data) as unknown as Json,
      });
    }
  }
  const data=productResult.data??null;
  const error=productResult.error;
  if (isProductSlugConflict(error)) {
    await cleanupUploadedImages(supabase,imageStage.uploadedPaths,imageStage.submissionId,null);
    const concurrent = await findProductBySlug(supabase, validation.data.slug);
    if (!concurrent.error && concurrent.data) return duplicateProductState(concurrent.data);
  }
  if (error) {await cleanupUploadedImages(supabase,imageStage.uploadedPaths,imageStage.submissionId,null);return productInsertError(error, productPayloadKeys);}
  if (!data) {await cleanupUploadedImages(supabase,imageStage.uploadedPaths,imageStage.submissionId,null);return { status:"error",message:"Product insert failed\nPostgreSQL code: unknown\nMessage: Supabase returned no product ID.\nDetails: None\nHint: None\nPayload keys: " + productPayloadKeys.join(", "),fieldErrors:{} };}

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

  const imagePreparation=await stageUpdatedProductImages(supabase,productId,validation.data.name,validation.data,formData);
  if(imagePreparation.error||!imagePreparation.stage)return {status:"error",message:imagePreparation.error??"Product images could not be prepared.",fieldErrors:{imageUrl:imagePreparation.error??"Product images could not be prepared."}};
  const imageStage=imagePreparation.stage;
  const primaryImage=imageStage.rows.find((image)=>image.is_primary);
  if(!primaryImage){await cleanupUploadedImages(supabase,imageStage.uploadedPaths,imageStage.submissionId,productId);return {status:"error",message:"Choose exactly one primary image.",fieldErrors:{imageUrl:"Choose exactly one primary image."}};}
  const {data,error}=await supabase.rpc("save_product_workflow",{
    p_product_id:productId,
    p_product:workflowProductPayload(validation.data,primaryImage.image_url) as Json,
    p_images:imageStage.rows as unknown as Json,
    p_offers:productOfferRows(validation.data) as unknown as Json,
  });
  if(error){
    await cleanupUploadedImages(supabase,imageStage.uploadedPaths,imageStage.submissionId,productId);
    if(isProductSlugConflict(error)){
      const existing=await findProductBySlug(supabase,validation.data.slug);
      if(!existing.error&&existing.data&&existing.data.id!==productId)return duplicateProductState(existing.data);
    }
    return databaseError(error,"update product workflow atomically");
  }
  if(!data){await cleanupUploadedImages(supabase,imageStage.uploadedPaths,imageStage.submissionId,productId);return {status:"error",message:"The product could not be found.",fieldErrors:{}};}
  const cleanupWarning=await cleanupUploadedImages(supabase,imageStage.removedPaths,imageStage.submissionId,productId);
  if(cleanupWarning) console.warn("Product update committed with obsolete image cleanup pending",{productId,submissionId:imageStage.submissionId});

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
    .select("id, slug, status")
    .eq("id", productId)
    .maybeSingle<{ id: string; slug: string; status: ProductStatus }>();
  if (productResult.error) {
    return { status: "error", message: exactDatabaseException("Database deletion failed while checking this product.", productResult.error), fieldErrors: {} };
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
  if (imagesResult.error) console.warn("Permanent delete continuing without image metadata", {
    productId, code: imagesResult.error.code, message: imagesResult.error.message,
    details: imagesResult.error.details, hint: imagesResult.error.hint,
  });
  const storagePaths = imagesResult.error ? [] : [...new Set((imagesResult.data ?? []).flatMap((image) => image.storage_path ? [image.storage_path] : []))];

  const deleted = await supabase.rpc("permanently_delete_archived_product", { p_product_id: productId });
  if (deleted.error) {
    logSupabaseError("permanently delete archived product", deleted.error);
    const prefix = deleted.error.code === "42501" ? "Permission denied. Active admin access is required."
      : deleted.error.code === "P0002" ? "Product not found."
      : deleted.error.code === "55000" ? "Only archived products can be permanently deleted."
      : deleted.error.code === "23503" ? "A related record prevented deletion. No database rows were deleted."
      : "Database deletion failed.";
    return { status: "error", message: exactDatabaseException(prefix, deleted.error), fieldErrors: {} };
  }

  const deletedSlug = typeof deleted.data === "string" ? deleted.data : productResult.data.slug;
  let cleanupWarning = Boolean(imagesResult.error);
  if (storagePaths.length) {
    const storageResult = await supabase.storage.from(IMAGE_BUCKET).remove(storagePaths);
    if (storageResult.error) {
      cleanupWarning = true;
      console.warn("Permanent delete completed with storage cleanup warning", {
        productId, storagePaths, storageError: storageResult.error,
      });
    }
  }

  const [idVerification, slugVerification] = await Promise.all([
    supabase.from("products").select("id").eq("id", productId).maybeSingle(),
    supabase.from("products").select("id").eq("slug", deletedSlug).maybeSingle(),
  ]);
  const verificationError = idVerification.error ?? slugVerification.error;
  if (verificationError) return { status: "error", message: exactDatabaseException("Product was deleted, but deletion verification failed.", verificationError), fieldErrors: {} };
  if (idVerification.data || slugVerification.data) {
    return { status: "error", message: "Database deletion verification failed: the product row or slug still exists.", fieldErrors: {} };
  }

  revalidateProductRoutes();
  redirect(`/admin/products?notice=${cleanupWarning ? "deleted_warning" : "deleted"}`);
}
