# HypeBuzz Supabase setup

## Current status

- Supabase browser and Next.js server clients use the project URL and publishable key.
- The catalog schema is in `migrations/001_initial_schema.sql`.
- Admin authorization is in `migrations/002_admin_users.sql`.
- Read-only admin catalog access is in `migrations/003_admin_catalog_read_policies.sql`.
- RLS is enabled and public data access is read-only.
- Email/password admin login and server-side `/admin` protection are implemented.
- The protected admin dashboard shell and catalog overview are implemented.
- Product CRUD, public signup, password recovery, and social login are not implemented.

## Run migrations

Run every migration once, in filename order. Existing projects must apply all
files they have not yet run; do not skip directly to the latest filename:

1. Open the correct project in the Supabase Dashboard.
2. Open **SQL Editor** and select **New query**.
3. Run `001_initial_schema.sql` through `016_atomic_product_publication.sql` in
   numeric order, using a new query for each file.
4. Verify all tables exist and have RLS enabled under **Database > Tables**.

Migration 016 restores explicit read/write grants without weakening RLS, adds
the atomic product-and-offer save function, and enforces the storefront-ready
publication contract. Legacy published rows without an eligible offer are
moved back to draft so they cannot leak into a partially renderable catalog.

Never run migrations from browser code or add a service-role key to this app.

## Required environment variables

Set these variables locally and in Vercel for Production, Preview, and
Development:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Catalog Server Actions use the signed-in user's cookie-authenticated Supabase
client. PostgreSQL grants and RLS require an active `admin_users` row. A
`SUPABASE_SECRET_KEY` is not required for catalog writes. If one is introduced
for a separate server-only operation, never prefix it with `NEXT_PUBLIC_`, put
it in a client component, log it, or commit it.

## Create the first admin user

1. Open **Authentication > Users** in Supabase.
2. Select **Add user > Create new user**.
3. Enter the administrator email and a strong unique password.
4. Copy the new user's UUID.
5. Run this in SQL Editor, replacing only the placeholder UUID:

```sql
insert into public.admin_users (user_id, role, is_active)
values ('PASTE_AUTH_USER_UUID_HERE', 'admin', true);
```

Never put the administrator email or password in source code. Users cannot grant themselves access because `admin_users` has no client write policy or privilege.

## Test authentication

1. Open `/admin` in a private browser window; it must redirect to `/admin/login`.
2. Submit a wrong password; a generic invalid-login error must appear.
3. Sign in as an Auth user without an `admin_users` row; the app must show Access denied.
4. Sign in as the active administrator; `/admin` must show the dashboard with live catalog counts.
5. Set the admin row's `is_active` to `false` in SQL Editor and refresh `/admin`; access must be denied.
