"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import {
  isMerchantUuid,
  validateMerchantForm,
  type MerchantActionState,
  type MerchantFieldErrors,
  type MerchantFormValues,
} from "@/lib/validation/merchant";

function authorizationError(): MerchantActionState {
  return {
    status: "error",
    message: "Your admin session is not authorized for this action.",
    fieldErrors: {},
  };
}

function databaseError(error: { code?: string } | null): MerchantActionState {
  if (error?.code === "23505") {
    return {
      status: "error",
      message: "A merchant with that name or slug already exists.",
      fieldErrors: {},
    };
  }

  return {
    status: "error",
    message: "The merchant could not be saved. Please try again.",
    fieldErrors: {},
  };
}

function merchantPayload(values: MerchantFormValues) {
  return {
    name: values.name,
    slug: values.slug,
    website_url: values.websiteUrl,
    logo_url: values.logoUrl || null,
    affiliate_network: values.affiliateNetwork,
    affiliate_tracking_parameter:
      values.affiliateTrackingParameter || null,
    is_active: values.isActive,
  };
}

function revalidateMerchantRoutes() {
  revalidatePath("/admin");
  revalidatePath("/admin/merchants", "layout");
  revalidatePath("/admin/offers", "layout");
}

async function isAuthorizedAdmin() {
  const access = await getAdminAccess();
  return access.status === "authenticated";
}

async function findConflicts(values: MerchantFormValues, merchantId?: string) {
  const supabase = await createClient();
  let nameQuery = supabase
    .from("merchants")
    .select("id")
    .eq("name", values.name);
  let slugQuery = supabase
    .from("merchants")
    .select("id")
    .eq("slug", values.slug);

  if (merchantId) {
    nameQuery = nameQuery.neq("id", merchantId);
    slugQuery = slugQuery.neq("id", merchantId);
  }

  const [nameResult, slugResult] = await Promise.all([
    nameQuery.limit(1).maybeSingle(),
    slugQuery.limit(1).maybeSingle(),
  ]);
  if (nameResult.error || slugResult.error) return null;

  const fieldErrors: MerchantFieldErrors = {};
  if (nameResult.data) {
    fieldErrors.name = "This merchant name is already in use.";
  }
  if (slugResult.data) fieldErrors.slug = "This slug is already in use.";
  return fieldErrors;
}

export async function createMerchant(
  _previousState: MerchantActionState,
  formData: FormData,
): Promise<MerchantActionState> {
  if (!(await isAuthorizedAdmin())) return authorizationError();
  const validation = validateMerchantForm(formData);
  if (!validation.success) return validation.state;

  const conflicts = await findConflicts(validation.data);
  if (conflicts === null) return databaseError(null);
  if (Object.keys(conflicts).length > 0) {
    return {
      status: "error",
      message: "Use a unique merchant name and slug.",
      fieldErrors: conflicts,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("merchants")
    .insert(merchantPayload(validation.data));
  if (error) return databaseError(error);

  revalidateMerchantRoutes();
  redirect("/admin/merchants?notice=created");
}

export async function updateMerchant(
  merchantId: string,
  _previousState: MerchantActionState,
  formData: FormData,
): Promise<MerchantActionState> {
  if (!(await isAuthorizedAdmin())) return authorizationError();
  if (!isMerchantUuid(merchantId)) {
    return {
      status: "error",
      message: "The merchant could not be found.",
      fieldErrors: {},
    };
  }

  const validation = validateMerchantForm(formData);
  if (!validation.success) return validation.state;
  const conflicts = await findConflicts(validation.data, merchantId);
  if (conflicts === null) return databaseError(null);
  if (Object.keys(conflicts).length > 0) {
    return {
      status: "error",
      message: "Use a unique merchant name and slug.",
      fieldErrors: conflicts,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("merchants")
    .update(merchantPayload(validation.data))
    .eq("id", merchantId)
    .select("id")
    .maybeSingle();

  if (error) return databaseError(error);
  if (!data) {
    return {
      status: "error",
      message: "The merchant could not be found.",
      fieldErrors: {},
    };
  }

  revalidateMerchantRoutes();
  redirect("/admin/merchants?notice=updated");
}

export async function setMerchantActive(
  merchantId: string,
  isActive: boolean,
  _previousState: MerchantActionState,
): Promise<MerchantActionState> {
  void _previousState;
  if (!(await isAuthorizedAdmin())) return authorizationError();
  if (!isMerchantUuid(merchantId)) {
    return {
      status: "error",
      message: "The merchant could not be found.",
      fieldErrors: {},
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("merchants")
    .update({ is_active: isActive })
    .eq("id", merchantId)
    .select("id")
    .maybeSingle();

  if (error) return databaseError(error);
  if (!data) {
    return {
      status: "error",
      message: "The merchant could not be found.",
      fieldErrors: {},
    };
  }

  revalidateMerchantRoutes();
  redirect(`/admin/merchants?notice=${isActive ? "enabled" : "disabled"}`);
}
