# Vercel Environment Checklist

Configure these in the Vercel project before redeploying. Never paste values into source control, screenshots, issue comments, or build logs.

| Variable | Classification | Production requirement | Expected value |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | PUBLIC | Required | HTTPS Project URL for the reconciled production Supabase project. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | PUBLIC | Required | Publishable key from the same Supabase project. It is embedded into browser code by Next.js at build time. |
| `SUPABASE_SECRET_KEY` | SERVER SECRET | Required | Supabase secret key for server-only affiliate offer resolution and click tracking. Never prefix it with `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_SITE_URL` | PUBLIC | Required | Exactly `https://hypebuzzshop.in` for Production. Do not use a Vercel preview URL as the production canonical. |
| `GOOGLE_SITE_VERIFICATION` | SERVER CONFIGURATION | Optional | Google Search Console verification token only; omit or leave unset until issued. |

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is not referenced by application code and must not be added as a compatibility alias. The application uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Vercel scope

1. Set all four required variables for **Production**.
2. Set the Supabase URL, publishable key, and secret key for **Preview** only if previews are allowed to use that project. Prefer a separate staging Supabase project when available.
3. Set `NEXT_PUBLIC_SITE_URL` in Preview deliberately. For owner acceptance against the business domain, use `https://hypebuzzshop.in` only on the Production deployment.
4. Redeploy after changing any `NEXT_PUBLIC_*` value because Next.js inlines public variables during the build.
5. Confirm the Supabase URL and both keys belong to the same project without printing their values.

## Safe verification

- Vercel project Settings → Environment Variables shows each required name in the intended scope.
- Deployment logs contain no secret value.
- `/robots.txt`, `/sitemap.xml`, canonical metadata, Open Graph URLs, and JSON-LD use `https://hypebuzzshop.in` on Production.
- `/go/[valid-active-offer-id]` redirects without a missing-secret error and records an affiliate click.
