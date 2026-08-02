# Product Reviews

Product reviews are introduced by `supabase/migrations/031_product_reviews.sql`. Apply it only after the existing production schema has been reconciled through migration 030.

The public product page reads only approved reviews attached to published products. Summary data comes from `get_product_review_summary(uuid)`, while the visible list is filtered, ordered, counted, and bounded in Supabase. The page initially requests five rows and never displays more than 25 in one request.

Public customer submission is intentionally disabled. HypeBuzz currently has admin authentication but no customer-account lifecycle, consent/recovery flow, abuse prevention, or trustworthy user-to-purchase verification. Migration 031 grants no INSERT access to `anon` or `authenticated`; the UI collects no review data. Before enabling submission, implement and review customer authentication, rate limiting/abuse controls, privacy notices, account deletion/retention, and a server-controlled insert path that always derives `user_id`, `status='pending'`, `is_verified_buyer=false`, and vote counts on the server/database.

Verified Buyer is never inferred from an affiliate click. The badge renders only when `is_verified_buyer` is genuinely true in the database; migration 031 provides no public/admin UI path to set it.

Admins use `/admin/reviews` to filter pending, approved, and rejected records and may approve, reject, or delete them. Server Actions re-check existing active-admin authorization and RLS independently enforces the same rule.
