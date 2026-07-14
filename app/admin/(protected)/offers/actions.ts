"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import {
  isOfferUuid,
  validateOfferForm,
  type OfferActionState,
  type OfferFormValues,
} from "@/lib/validation/offer";

function authorizationError(): OfferActionState {
  return {
    status: "error",
    message: "Your admin session is not authorized for this action.",
    fieldErrors: {},
  };
}

function databaseError(error: { code?: string } | null): OfferActionState {
  if (error?.code === "23505") {
    return {
      status: "error",
      message: "That product already has an offer from this merchant.",
      fieldErrors: {
        merchantId: "Choose another merchant or edit the existing offer.",
      },
    };
  }

  if (error?.code === "23503") {
    return {
      status: "error",
      message: "The selected product or merchant is no longer available.",
      fieldErrors: {},
    };
  }

  return {
    status: "error",
    message: "The offer could not be saved. Please try again.",
    fieldErrors: {},
  };
}

function offerPayload(values: OfferFormValues) {
  return {
    product_id: values.productId,
    merchant_id: values.merchantId,
    affiliate_url: values.affiliateUrl,
    current_price: values.currentPrice,
    original_price: values.originalPrice,
    currency: values.currency,
    availability: values.stockStatus,
    coupon_note: values.notes || null,
    is_active: values.isActive,
  };
}

function revalidateOfferRoutes() {
  revalidatePath("/admin");
  revalidatePath("/admin/offers", "layout");
  revalidatePath("/");
  revalidatePath("/deals");
  revalidatePath("/products/[slug]", "page");
  revalidatePath("/categories/[slug]", "page");
}

async function isAuthorizedAdmin() {
  const access = await getAdminAccess();
  return access.status === "authenticated";
}

async function relatedRecordsExist(productId: string, merchantId: string) {
  const supabase = await createClient();
  const [productResult, merchantResult] = await Promise.all([
    supabase.from("products").select("id").eq("id", productId).maybeSingle(),
    supabase.from("merchants").select("id").eq("id", merchantId).maybeSingle(),
  ]);

  return {
    productExists: !productResult.error && Boolean(productResult.data),
    merchantExists: !merchantResult.error && Boolean(merchantResult.data),
  };
}

export async function createOffer(
  _previousState: OfferActionState,
  formData: FormData,
): Promise<OfferActionState> {
  if (!(await isAuthorizedAdmin())) return authorizationError();
  const validation = validateOfferForm(formData);
  if (!validation.success) return validation.state;

  const related = await relatedRecordsExist(
    validation.data.productId,
    validation.data.merchantId,
  );
  if (!related.productExists || !related.merchantExists) {
    return {
      status: "error",
      message: "The selected product or merchant is no longer available.",
      fieldErrors: {
        ...(related.productExists ? {} : { productId: "Choose an available product." }),
        ...(related.merchantExists ? {} : { merchantId: "Choose an available merchant." }),
      },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("product_offers")
    .insert(offerPayload(validation.data));
  if (error) return databaseError(error);

  revalidateOfferRoutes();
  redirect("/admin/offers?notice=created");
}

export async function updateOffer(
  offerId: string,
  _previousState: OfferActionState,
  formData: FormData,
): Promise<OfferActionState> {
  if (!(await isAuthorizedAdmin())) return authorizationError();
  if (!isOfferUuid(offerId)) {
    return { status: "error", message: "The offer could not be found.", fieldErrors: {} };
  }

  const validation = validateOfferForm(formData);
  if (!validation.success) return validation.state;
  const related = await relatedRecordsExist(
    validation.data.productId,
    validation.data.merchantId,
  );
  if (!related.productExists || !related.merchantExists) {
    return {
      status: "error",
      message: "The selected product or merchant is no longer available.",
      fieldErrors: {},
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_offers")
    .update(offerPayload(validation.data))
    .eq("id", offerId)
    .select("id")
    .maybeSingle();

  if (error) return databaseError(error);
  if (!data) {
    return { status: "error", message: "The offer could not be found.", fieldErrors: {} };
  }

  revalidateOfferRoutes();
  redirect("/admin/offers?notice=updated");
}

export async function disableOffer(
  offerId: string,
  _previousState: OfferActionState,
): Promise<OfferActionState> {
  void _previousState;
  if (!(await isAuthorizedAdmin())) return authorizationError();
  if (!isOfferUuid(offerId)) {
    return { status: "error", message: "The offer could not be found.", fieldErrors: {} };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_offers")
    .update({ is_active: false })
    .eq("id", offerId)
    .select("id")
    .maybeSingle();

  if (error) return databaseError(error);
  if (!data) {
    return { status: "error", message: "The offer could not be found.", fieldErrors: {} };
  }

  revalidateOfferRoutes();
  redirect("/admin/offers?notice=disabled");
}
