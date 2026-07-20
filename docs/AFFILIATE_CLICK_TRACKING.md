# Affiliate click tracking

HypeBuzz records a minimal analytics event when a shopper follows an active public offer through `/go/[offerId]`. The route validates the database record before returning a temporary redirect to the merchant.

## Tracked fields

- `offer_id`, `product_id`, and `merchant_id`: identify the selected catalog records.
- `clicked_at` and `created_at`: record when the event was received.
- `referrer`: stores only the referring URL origin, truncated to 512 characters.
- `source_page`: stores the pathname only when the referrer has the same origin as HypeBuzz, truncated to 512 characters.
- `user_agent`: stores the request user-agent, truncated to 512 characters.
- `device_type`: a simple server-side classification of `mobile`, `tablet`, `desktop`, or `unknown`.

The table includes nullable `session_id` and `ip_hash` columns for schema compatibility, but this implementation intentionally leaves both fields empty.

## Privacy approach

HypeBuzz does not read or store raw IP addresses. It does not store precise location, names, email addresses, passwords, authentication tokens, user profiles, or cross-site session identifiers. Query strings and URL fragments are not stored as the source page. Device classification uses only a small user-agent heuristic and does not install a fingerprinting or device-detection package.

## Redirect and URL safety

Public buttons contain only `/go/<offer-id>`. They never accept a destination URL from query parameters. The server loads the destination from `product_offers` and confirms that the offer is active, its product is published, and its merchant is active. The stored destination is parsed with the platform URL parser and must use `http:` or `https:`. Other schemes, malformed URLs, missing records, and ineligible records go to the fixed local `/go/unavailable` page.

Valid redirects use HTTP 307 so offer changes are never cached as permanent redirects. Click logging is attempted before redirecting. A logging failure does not strand a shopper after the destination has passed every eligibility and safety check.

## Database access

Row Level Security is enabled on `affiliate_clicks`. Anonymous and ordinary authenticated users have no table privileges. A server-only Supabase secret client performs inserts from the redirect route. The secret is read from `SUPABASE_SECRET_KEY` and must never use a `NEXT_PUBLIC_` name.

Active admins have read-only access through an RLS policy. The analytics summary function is security-invoker and independently checks for an active admin. There are no public update or delete policies.

## Intentionally not included

This implementation does not provide conversion or revenue tracking, fraud detection, export reports, advanced charts, user profiles, cookie consent, IP deduplication, or persistent visitor sessions.
