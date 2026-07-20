begin;

-- Brands already inherit the existing active-admin SELECT, INSERT, and UPDATE
-- policies. Add optional editorial fields without changing RLS or privileges.
alter table public.brands
  add column description text,
  add column website_url text;

commit;
