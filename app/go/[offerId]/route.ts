import { NextResponse } from "next/server";
import { resolveAndTrackAffiliateClick } from "@/lib/affiliate/click-tracking";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: RouteContext<"/go/[offerId]">) {
  const { offerId } = await context.params;

  try {
    const destination = await resolveAndTrackAffiliateClick(offerId, request);
    if (destination) return NextResponse.redirect(destination, 307);
  } catch {
    // Configuration and database errors are never exposed publicly.
  }

  return NextResponse.redirect(new URL("/go/unavailable", request.url), 307);
}
