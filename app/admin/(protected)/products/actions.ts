"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { Json, ProductImage } from "@/lib/types/database";
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
  operation: "insert" | "update",
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

  console.error("Supabase product save failed", diagnostic);

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
    message: `The product could not be saved (database error ${diagnostic.code}).`,
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
  const offerId = isUuid(offerIdValue) ? offerIdValue : null;
  const hasOffer = Boolean(values.merchantId && values.affiliateUrl && values.currentPrice && values.originalPrice);
  const supabase = await createClient();
  return supabase.rpc("save_product_with_offer", {
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
    p_merchant_id: hasOffer ? values.merchantId : null,
    p_affiliate_url: hasOffer ? values.affiliateUrl : null,
    p_current_price: hasOffer ? values.currentPrice : null,
    p_original_price: hasOffer ? values.originalPrice : null,
    p_currency: hasOffer ? values.currency : null,
    p_availability: hasOffer ? values.stockStatus : null,
    p_offer_is_active: hasOffer ? values.offerIsActive : null,
  });
}

const IMAGE_BUCKET = "product-images";
async function imageExtension(file: File) { const b = new Uint8Array(await file.slice(0,12).arrayBuffer()); if (b[0]===0xff&&b[1]===0xd8&&b[2]===0xff) return "jpg"; if (b[0]===0x89&&b[1]===0x50&&b[2]===0x4e&&b[3]===0x47) return "png"; if (String.fromCharCode(...b.slice(0,4))==="RIFF"&&String.fromCharCode(...b.slice(8,12))==="WEBP") return "webp"; return null; }
function safeFileName(name: string) { return name.replace(/\.[^.]+$/,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,60)||"product"; }
type SavedImage = { id:string; image_url:string; storage_path:string|null; source_type:"upload"|"external"; alt_text:string; sort_order:number; is_primary:boolean };
async function syncProductImages(productId:string, productName:string, values:ProductFormValues, formData:FormData) {
  const supabase=await createClient(); const files=formData.getAll("uploadedImages").filter((x):x is File=>x instanceof File&&x.size>0); const existingResult=await supabase.from("product_images").select("*").eq("product_id",productId).returns<ProductImage[]>();
  if(existingResult.error) return "Product images could not be loaded."; const existing=new Map((existingResult.data??[]).map(x=>[x.id,x])); const rows:SavedImage[]=[]; const uploaded:string[]=[];
  for(let index=0;index<values.imageManifest.length;index++){const item=values.imageManifest[index]; if(item.kind==="existing"){const found=existing.get(item.id!);if(!found){if(uploaded.length)await supabase.storage.from(IMAGE_BUCKET).remove(uploaded);return "An existing image is no longer available. Refresh and try again.";}rows.push({id:found.id,image_url:found.image_url,storage_path:found.storage_path,source_type:found.source_type,alt_text:found.alt_text??`${productName} product image ${index+1}`,sort_order:index,is_primary:item.isPrimary});continue;} const id=crypto.randomUUID();if(item.kind==="external"){rows.push({id,image_url:item.url!,storage_path:null,source_type:"external",alt_text:`${productName} product image ${index+1}`,sort_order:index,is_primary:item.isPrimary});continue;} const file=files[item.fileIndex!];const ext=await imageExtension(file);if(!ext){if(uploaded.length)await supabase.storage.from(IMAGE_BUCKET).remove(uploaded);return "Only genuine JPG, PNG, or WebP images are allowed.";}const path=`products/${productId}/${crypto.randomUUID()}-${safeFileName(file.name)}.${ext}`;const result=await supabase.storage.from(IMAGE_BUCKET).upload(path,file,{contentType:ext==="jpg"?"image/jpeg":`image/${ext}`,upsert:false});if(result.error){if(uploaded.length)await supabase.storage.from(IMAGE_BUCKET).remove(uploaded);return "This image could not be uploaded. Please try again.";}uploaded.push(path);rows.push({id,image_url:`/product-images/${id}`,storage_path:path,source_type:"upload",alt_text:`${productName} product image ${index+1}`,sort_order:index,is_primary:item.isPrimary});}
  if(rows.length&&!rows.some(x=>x.is_primary))rows[0].is_primary=true;const replaced=await supabase.rpc("replace_product_images",{p_product_id:productId,p_images:rows as unknown as Json});if(replaced.error){if(uploaded.length)await supabase.storage.from(IMAGE_BUCKET).remove(uploaded);return "Product images could not be saved. Please try again.";}const retained=new Set(rows.map(x=>x.id));const removed=(existingResult.data??[]).filter(x=>!retained.has(x.id)&&x.storage_path).map(x=>x.storage_path!);if(removed.length)await supabase.storage.from(IMAGE_BUCKET).remove(removed);return null;
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

  const initialPrimary = validation.data.imageManifest.find(x=>x.isPrimary&&x.kind==="external")?.url ?? validation.data.imageManifest.find(x=>x.kind==="external")?.url ?? null;
  const { data, error } = await saveProductWithOffer(null, validation.data, formData, initialPrimary);

  if (error) return databaseError(error, "insert");
  if (!data) return { status:"error",message:"The product could not be created.",fieldErrors:{} };
  const imageError=await syncProductImages(data,validation.data.name,validation.data,formData);
  if(imageError){const supabase=await createClient();await supabase.rpc("delete_failed_product",{p_product_id:data});return {status:"error",message:imageError,fieldErrors:{imageUrl:imageError}};}

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

  const supabase=await createClient(); const current=await supabase.from("products").select("primary_image_url").eq("id",productId).maybeSingle<{primary_image_url:string|null}>();
  const { data, error } = await saveProductWithOffer(productId, validation.data, formData, current.data?.primary_image_url??null);

  if (error) return databaseError(error, "update");
  if (!data) {
    return { status: "error", message: "The product could not be found.", fieldErrors: {} };
  }
  const imageError=await syncProductImages(productId,validation.data.name,validation.data,formData);
  if(imageError)return {status:"error",message:imageError,fieldErrors:{imageUrl:imageError}};

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

  if (error) return databaseError(error, "update");
  if (!data) {
    return { status: "error", message: "The product could not be found.", fieldErrors: {} };
  }

  revalidateProductRoutes();
  redirect("/admin/products?notice=archived");
}
