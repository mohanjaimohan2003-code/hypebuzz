"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import {
  isBrandUuid,
  validateBrandForm,
  type BrandActionState,
  type BrandFieldErrors,
  type BrandFormValues,
} from "@/lib/validation/brand";

function authorizationError(): BrandActionState {
  return {
    status: "error",
    message: "Your admin session is not authorized for this action.",
    fieldErrors: {},
  };
}

function databaseError(error: { code?: string } | null): BrandActionState {
  if (error?.code === "23505") {
    return {
      status: "error",
      message: "A brand with that name or slug already exists.",
      fieldErrors: {},
    };
  }

  return {
    status: "error",
    message: "The brand could not be saved. Please try again.",
    fieldErrors: {},
  };
}

function brandPayload(values: BrandFormValues) {
  return {
    name: values.name,
    slug: values.slug,
    logo_url: values.logoUrl || null,
    is_active: values.isActive,
  };
}

function revalidateBrandRoutes() {
  revalidatePath("/admin");
  revalidatePath("/admin/brands", "layout");
  revalidatePath("/");
  revalidatePath("/brands/[slug]", "page");
  revalidatePath("/products/[slug]", "page");
}

async function isAuthorizedAdmin() {
  const access = await getAdminAccess();
  return access.status === "authenticated";
}

async function findConflicts(values: BrandFormValues, brandId?: string) {
  const supabase = await createClient();
  let nameQuery = supabase.from("brands").select("id").eq("name", values.name);
  let slugQuery = supabase.from("brands").select("id").eq("slug", values.slug);

  if (brandId) {
    nameQuery = nameQuery.neq("id", brandId);
    slugQuery = slugQuery.neq("id", brandId);
  }

  const [nameResult, slugResult] = await Promise.all([
    nameQuery.limit(1).maybeSingle(),
    slugQuery.limit(1).maybeSingle(),
  ]);
  if (nameResult.error || slugResult.error) return null;

  const fieldErrors: BrandFieldErrors = {};
  if (nameResult.data) fieldErrors.name = "This brand name is already in use.";
  if (slugResult.data) fieldErrors.slug = "This slug is already in use.";
  return fieldErrors;
}

export async function createBrand(
  _previousState: BrandActionState,
  formData: FormData,
): Promise<BrandActionState> {
  if (!(await isAuthorizedAdmin())) return authorizationError();
  const validation = validateBrandForm(formData);
  if (!validation.success) return validation.state;

  const conflicts = await findConflicts(validation.data);
  if (conflicts === null) return databaseError(null);
  if (Object.keys(conflicts).length > 0) {
    return { status: "error", message: "Use a unique name and slug.", fieldErrors: conflicts };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("brands").insert(brandPayload(validation.data));
  if (error) return databaseError(error);

  revalidateBrandRoutes();
  redirect("/admin/brands?notice=created");
}

export async function updateBrand(
  brandId: string,
  _previousState: BrandActionState,
  formData: FormData,
): Promise<BrandActionState> {
  if (!(await isAuthorizedAdmin())) return authorizationError();
  if (!isBrandUuid(brandId)) {
    return { status: "error", message: "The brand could not be found.", fieldErrors: {} };
  }

  const validation = validateBrandForm(formData);
  if (!validation.success) return validation.state;
  const conflicts = await findConflicts(validation.data, brandId);
  if (conflicts === null) return databaseError(null);
  if (Object.keys(conflicts).length > 0) {
    return { status: "error", message: "Use a unique name and slug.", fieldErrors: conflicts };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brands")
    .update(brandPayload(validation.data))
    .eq("id", brandId)
    .select("id")
    .maybeSingle();

  if (error) return databaseError(error);
  if (!data) {
    return { status: "error", message: "The brand could not be found.", fieldErrors: {} };
  }

  revalidateBrandRoutes();
  redirect("/admin/brands?notice=updated");
}

export async function setBrandActive(
  brandId: string,
  isActive: boolean,
  _previousState: BrandActionState,
): Promise<BrandActionState> {
  void _previousState;
  if (!(await isAuthorizedAdmin())) return authorizationError();
  if (!isBrandUuid(brandId)) {
    return { status: "error", message: "The brand could not be found.", fieldErrors: {} };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brands")
    .update({ is_active: isActive })
    .eq("id", brandId)
    .select("id")
    .maybeSingle();

  if (error) return databaseError(error);
  if (!data) {
    return { status: "error", message: "The brand could not be found.", fieldErrors: {} };
  }

  revalidateBrandRoutes();
  redirect(`/admin/brands?notice=${isActive ? "enabled" : "disabled"}`);
}
