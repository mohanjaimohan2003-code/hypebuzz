# HypeBuzz Supabase setup

## Current status

- Supabase browser and Next.js server clients use the project URL and publishable key.
- The catalog schema is in `migrations/001_initial_schema.sql`.
- Admin authorization is in `migrations/002_admin_users.sql`.
- RLS is enabled and public data access is read-only.
- Email/password admin login and server-side `/admin` protection are implemented.
- Product management, public signup, password recovery, and social login are not implemented.

## Run migrations

Run each migration once, in filename order:

1. Open the correct project in the Supabase Dashboard.
2. Open **SQL Editor** and select **New query**.
3. Paste and run the full contents of `001_initial_schema.sql`.
4. In a new query, paste and run the full contents of `002_admin_users.sql`.
5. Verify all tables exist and have RLS enabled under **Database > Tables**.

Never run migrations from browser code or add a service-role key to this app.

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
4. Sign in as the active administrator; `/admin` must show **HypeBuzz Admin Dashboard Coming Soon**.
5. Set the admin row's `is_active` to `false` in SQL Editor and refresh `/admin`; access must be denied.
