-- Add only the rich product fields not already present in migration 001.
-- PRODUCTION GATE: do not apply until Phase 1 production verification confirms
-- public.products exists with description and specifications as audited.
-- Existing rows remain valid; no rows are rewritten and RLS is unchanged.

begin;

alter table if exists public.products
  add column if not exists highlights jsonb not null default '[]'::jsonb,
  add column if not exists seo_title text,
  add column if not exists seo_description text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_highlights_array' and conrelid = 'public.products'::regclass) then
    alter table public.products
      add constraint products_highlights_array check (jsonb_typeof(highlights) = 'array');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_seo_title_length' and conrelid = 'public.products'::regclass) then
    alter table public.products
      add constraint products_seo_title_length check (seo_title is null or char_length(seo_title) <= 200);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_seo_description_length' and conrelid = 'public.products'::regclass) then
    alter table public.products
      add constraint products_seo_description_length check (seo_description is null or char_length(seo_description) <= 500);
  end if;
end;
$$;

commit;
