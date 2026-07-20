begin;

-- RLS policies decide which authenticated rows may be written, but policies do
-- not grant the underlying PostgreSQL table privilege. The initial schema
-- explicitly revoked writes, so keep this grant as a separate, idempotent
-- production repair even when the INSERT/UPDATE policies already exist.
grant insert, update on table public.products to authenticated;

commit;
