begin;

-- Categories already inherit the existing active-admin SELECT, INSERT, and
-- UPDATE policies. This migration adds ordering data without changing RLS or
-- granting any additional privileges.
alter table public.categories
  add column display_order integer not null default 0,
  add constraint categories_display_order_nonnegative
    check (display_order >= 0);

create index categories_display_order_name_idx
  on public.categories (display_order, name);

commit;
