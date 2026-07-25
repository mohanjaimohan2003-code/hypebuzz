begin;

-- RLS policies decide which authenticated rows may be written, but policies do
-- not grant the underlying PostgreSQL table privilege. Keep the grants
-- explicit and idempotent for environments created from these migrations.
grant insert, update on table public.products to authenticated;

commit;
