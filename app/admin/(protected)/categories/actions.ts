"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import {
  isCategoryUuid,
  validateCategoryForm,
  type CategoryActionState,
  type CategoryFieldErrors,
  type CategoryFormValues,
} from "@/lib/validation/category";

function authorizationError(): CategoryActionState {
  return {
    status: "error",
    message: "Your admin session is not authorized for this action.",
    fieldErrors: {},
  };
}

function databaseError(error: { code?: string } | null): CategoryActionState {
  if (error?.code === "23505") {
    return {
      status: "error",
      message: "A category with that name or slug already exists.",
      fieldErrors: {},
    };
  }

  return {
    status: "error",
    message: "The category could not be saved. Please try again.",
    fieldErrors: {},
  };
}

function categoryPayload(values: CategoryFormValues) {
  return {
    name: values.name,
    slug: values.slug,
    description: values.description || null,
    image_url: values.iconUrl || null,
    display_order: values.displayOrder,
    is_active: values.isActive,
  };
}

function revalidateCategoryRoutes() {
  revalidatePath("/admin");
  revalidatePath("/admin/categories", "layout");
  revalidatePath("/");
  revalidatePath("/categories/[slug]", "page");
}

async function isAuthorizedAdmin() {
  const access = await getAdminAccess();
  return access.status === "authenticated";
}

async function findConflicts(values: CategoryFormValues, categoryId?: string) {
  const supabase = await createClient();
  let nameQuery = supabase.from("categories").select("id").eq("name", values.name);
  let slugQuery = supabase.from("categories").select("id").eq("slug", values.slug);

  if (categoryId) {
    nameQuery = nameQuery.neq("id", categoryId);
    slugQuery = slugQuery.neq("id", categoryId);
  }

  const [nameResult, slugResult] = await Promise.all([
    nameQuery.limit(1).maybeSingle(),
    slugQuery.limit(1).maybeSingle(),
  ]);

  if (nameResult.error || slugResult.error) return null;

  const fieldErrors: CategoryFieldErrors = {};
  if (nameResult.data) fieldErrors.name = "This category name is already in use.";
  if (slugResult.data) fieldErrors.slug = "This slug is already in use.";
  return fieldErrors;
}

export async function createCategory(
  _previousState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  if (!(await isAuthorizedAdmin())) return authorizationError();

  const validation = validateCategoryForm(formData);
  if (!validation.success) return validation.state;

  const conflicts = await findConflicts(validation.data);
  if (conflicts === null) return databaseError(null);
  if (Object.keys(conflicts).length > 0) {
    return { status: "error", message: "Use a unique name and slug.", fieldErrors: conflicts };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert(categoryPayload(validation.data));
  if (error) return databaseError(error);

  revalidateCategoryRoutes();
  redirect("/admin/categories?notice=created");
}

export async function updateCategory(
  categoryId: string,
  _previousState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  if (!(await isAuthorizedAdmin())) return authorizationError();
  if (!isCategoryUuid(categoryId)) {
    return { status: "error", message: "The category could not be found.", fieldErrors: {} };
  }

  const validation = validateCategoryForm(formData);
  if (!validation.success) return validation.state;

  const conflicts = await findConflicts(validation.data, categoryId);
  if (conflicts === null) return databaseError(null);
  if (Object.keys(conflicts).length > 0) {
    return { status: "error", message: "Use a unique name and slug.", fieldErrors: conflicts };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .update(categoryPayload(validation.data))
    .eq("id", categoryId)
    .select("id")
    .maybeSingle();

  if (error) return databaseError(error);
  if (!data) {
    return { status: "error", message: "The category could not be found.", fieldErrors: {} };
  }

  revalidateCategoryRoutes();
  redirect("/admin/categories?notice=updated");
}

export async function setCategoryActive(
  categoryId: string,
  isActive: boolean,
  _previousState: CategoryActionState,
): Promise<CategoryActionState> {
  void _previousState;
  if (!(await isAuthorizedAdmin())) return authorizationError();
  if (!isCategoryUuid(categoryId)) {
    return { status: "error", message: "The category could not be found.", fieldErrors: {} };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .update({ is_active: isActive })
    .eq("id", categoryId)
    .select("id")
    .maybeSingle();

  if (error) return databaseError(error);
  if (!data) {
    return { status: "error", message: "The category could not be found.", fieldErrors: {} };
  }

  revalidateCategoryRoutes();
  redirect(`/admin/categories?notice=${isActive ? "enabled" : "disabled"}`);
}
