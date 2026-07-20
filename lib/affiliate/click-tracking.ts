import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type DeviceType = "mobile" | "tablet" | "desktop" | "unknown";

type EligibleOffer = {
  id: string;
  product_id: string;
  merchant_id: string;
  affiliate_url: string;
  product: { status: string } | null;
  merchant: { is_active: boolean } | null;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function classifyDevice(userAgent: string | null): DeviceType {
  if (!userAgent?.trim()) return "unknown";
  if (/ipad|tablet|kindle|silk|playbook|android(?!.*mobile)/i.test(userAgent)) return "tablet";
  if (/mobile|iphone|ipod|android|blackberry|iemobile|opera mini/i.test(userAgent)) return "mobile";
  if (/windows|macintosh|linux|cros/i.test(userAgent)) return "desktop";
  return "unknown";
}

export function safeAffiliateDestination(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function requestContext(request: Request) {
  const rawReferrer = request.headers.get("referer");
  let referrer: string | null = null;
  let sourcePage: string | null = null;

  if (rawReferrer) {
    try {
      const parsed = new URL(rawReferrer);
      referrer = parsed.origin.slice(0, 512);
      if (parsed.origin === new URL(request.url).origin) sourcePage = parsed.pathname.slice(0, 512);
    } catch {
      // Malformed referrers are ignored instead of being stored.
    }
  }

  const userAgent = request.headers.get("user-agent")?.slice(0, 512) ?? null;
  return { referrer, sourcePage, userAgent, deviceType: classifyDevice(userAgent) };
}

export async function resolveAndTrackAffiliateClick(offerId: string, request: Request) {
  if (!uuidPattern.test(offerId)) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_offers")
    .select("id, product_id, merchant_id, affiliate_url, product:products(status), merchant:merchants(is_active)")
    .eq("id", offerId)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  const offer = data as unknown as EligibleOffer;
  if (offer.product?.status !== "published" || offer.merchant?.is_active !== true) return null;

  const destination = safeAffiliateDestination(offer.affiliate_url);
  if (!destination) return null;

  const context = requestContext(request);
  try {
    await supabase.from("affiliate_clicks").insert({
      offer_id: offer.id,
      product_id: offer.product_id,
      merchant_id: offer.merchant_id,
      referrer: context.referrer,
      user_agent: context.userAgent,
      device_type: context.deviceType,
      source_page: context.sourcePage,
      session_id: null,
      ip_hash: null,
    });
  } catch {
    // Analytics failure must not prevent a validated merchant redirect.
  }

  return destination;
}
