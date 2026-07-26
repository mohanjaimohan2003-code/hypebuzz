# Brand import fix

## Root cause

The importer inserted `description` and `website_url`, but those columns are introduced only by repository migration 009. A read-only production REST check on 2026-07-26 confirmed both columns are absent and return PostgreSQL `42703`; the base columns `id`, `name`, `slug`, `logo_url`, `is_active`, `created_at`, and `updated_at` are present.

The insert therefore failed before RLS or duplicate recovery could complete. The generic production message hid this schema mismatch.

## Schema contract and repair

Migration 001 defines `brands.id` as a generated UUID primary key, unique non-null `name` and `slug`, nullable `logo_url`, `is_active default true`, and timestamp defaults. The importer now sends only `{ name, slug }`. This works with the verified production schema and lets database defaults populate all other required values.

No optional migration-009 column is assumed. Existing case-insensitive/normalized matching runs before insert. A `23505` race re-queries and selects the concurrently created brand.

## Authentication path

Production SQL testing proved the brand grants, RLS policies, and active `admin_users` row work. The importer action now creates one request-scoped cookie-aware Supabase server client, verifies it with `auth.getUser()`, queries `admin_users` with that same client, and reuses it for matching and insertion. Missing/expired sessions and inactive/non-admin identities stop before insertion with accurate messages. No RLS migration or policy change is included.

## Failure and retry behavior

Complete insert diagnostics (`code`, `message`, `details`, `hint`) are logged server-side. Development displays them. Production maps permission, missing-field, validation, and unknown failures to safe specific messages. Product/import state remains intact, and an explicit Retry brand creation button retries the same server-side resolution.

## Files changed

- `app/admin/(protected)/products/actions.ts`
- `components/admin/product-json-importer.tsx`
- `lib/admin/product-import/brand-error.ts`
- `tests/product-json-import.test.ts`
- this document

## Verification

Automated importer tests cover normalized and case-insensitive matching, safe error classification, category preservation/mapping, and responsive importer markup. Concurrent `23505` recovery is implemented around the database unique constraints; final authenticated production/staging verification remains manual.

Commands and final results are recorded in the implementation handoff.
