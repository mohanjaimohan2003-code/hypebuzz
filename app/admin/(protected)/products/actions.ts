"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
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

  const diagnosticMessage = [
    `Database error ${diagnostic.code}: ${diagnostic.message}`,
    `Table: ${diagnostic.table}`,
    `Column: ${diagnostic.column}`,
    `Constraint: ${diagnostic.constraint}`,
  ].join(" | ");

  if (error?.code === "23505") {
    return {
      status: "error",
      message: diagnosticMessage,
      fieldErrors: { slug: "This slug is already assigned to another product." },
    };
  }

  if (error?.code === "23503") {
    return {
      status: "error",
      message: diagnosticMessage,
      fieldErrors: { categoryId: "Choose an available category." },
    };
  }

  return {
    status: "error",
    message: diagnosticMessage,
    fieldErrors: {},
  };
}

function productPayload(values: ProductFormValues) {
  return {
    name: values.name,
    slug: values.slug,
    short_description: values.shortDescription || null,
    category_id: values.categoryId,
    primary_image_url: values.imageUrl || null,
    is_featured: values.isFeatured,
    is_trending: values.isTrending,
    status: values.status,
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
  error?: SupabaseDatabaseError;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .maybeSingle();

  if (error) return { exists: false, error };
  return { exists: Boolean(data) };
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

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .insert(productPayload(validation.data));

  if (error) return databaseError(error, "insert");

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

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .update(productPayload(validation.data))
    .eq("id", productId)
    .select("id")
    .maybeSingle();

  if (error) return databaseError(error, "update");
  if (!data) {
    return { status: "error", message: "The product could not be found.", fieldErrors: {} };
  }

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
