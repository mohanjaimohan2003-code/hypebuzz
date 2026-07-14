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

function databaseError(error: { code?: string } | null): ProductActionState {
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
      message: "The selected category is no longer available.",
      fieldErrors: { categoryId: "Choose an available category." },
    };
  }

  return {
    status: "error",
    message: "The product could not be saved. Please try again.",
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

async function categoryExists(categoryId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .maybeSingle();

  return !error && Boolean(data);
}

export async function createProduct(
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  if (!(await isAuthorizedAdmin())) return authorizationError();

  const validation = validateProductForm(formData);
  if (!validation.success) return validation.state;

  if (!(await categoryExists(validation.data.categoryId))) {
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

  if (error) return databaseError(error);

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

  if (!(await categoryExists(validation.data.categoryId))) {
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

  if (error) return databaseError(error);
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

  if (error) return databaseError(error);
  if (!data) {
    return { status: "error", message: "The product could not be found.", fieldErrors: {} };
  }

  revalidateProductRoutes();
  redirect("/admin/products?notice=archived");
}
