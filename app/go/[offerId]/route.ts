import { NextResponse } from "next/server";
import { resolveAndTrackAffiliateClick } from "@/lib/affiliate/click-tracking";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: RouteContext<"/go/[offerId]">) {
  const { offerId } = await context.params;

  try {
    const destination = await resolveAndTrackAffiliateClick(offerId, request);
    if (destination) return NextResponse.redirect(destination, 307);
  } catch (error) {
    console.error("Affiliate redirect resolution failed", { step: "resolve affiliate redirect", offerId, name: error instanceof Error ? error.name : "UnknownError", message: error instanceof Error ? error.message : "Unknown affiliate redirect error" });
  }

  return NextResponse.redirect(new URL("/go/unavailable", request.url), 307);
}
