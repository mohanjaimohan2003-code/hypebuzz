-- Add moderated product reviews without enabling unauthenticated submissions.
begin;

create table public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  reviewer_name text not null,
  rating smallint not null,
  title text,
  review_text text not null,
  is_verified_buyer boolean not null default false,
  status text not null default 'pending',
  helpful_count integer not null default 0,
  unhelpful_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_reviews_rating_range check (rating between 1 and 5),
  constraint product_reviews_status_allowed check (status in ('pending','approved','rejected')),
  constraint product_reviews_reviewer_name_not_blank check (btrim(reviewer_name) <> ''),
  constraint product_reviews_text_not_blank check (btrim(review_text) <> ''),
  constraint product_reviews_title_not_blank check (title is null or btrim(title) <> ''),
  constraint product_reviews_helpful_nonnegative check (helpful_count >= 0 and unhelpful_count >= 0)
);

create index product_reviews_product_id_idx on public.product_reviews(product_id);
create index product_reviews_status_idx on public.product_reviews(status);
create index product_reviews_created_at_idx on public.product_reviews(created_at desc);
create index product_reviews_rating_idx on public.product_reviews(rating);
create index product_reviews_public_page_idx on public.product_reviews(product_id, rating, created_at desc)
  where status='approved';

create trigger product_reviews_set_updated_at before update on public.product_reviews
for each row execute function public.set_updated_at();

alter table public.product_reviews enable row level security;
revoke all on public.product_reviews from anon, authenticated;
grant select(id, product_id, reviewer_name, rating, title, review_text, is_verified_buyer,
  status, helpful_count, unhelpful_count, created_at, updated_at)
on public.product_reviews to anon, authenticated;
grant update(status) on public.product_reviews to authenticated;
grant delete on public.product_reviews to authenticated;

create policy "Public can read approved product reviews" on public.product_reviews
for select to anon, authenticated using (
  status='approved' and exists (
    select 1 from public.products p where p.id=product_id and p.status='published'
  )
);

create policy "Active admins can read all product reviews" on public.product_reviews
for select to authenticated using (exists (
  select 1 from public.admin_users a
  where a.user_id=(select auth.uid()) and a.role='admin' and a.is_active
));

create policy "Active admins can moderate product reviews" on public.product_reviews
for update to authenticated using (exists (
  select 1 from public.admin_users a
  where a.user_id=(select auth.uid()) and a.role='admin' and a.is_active
)) with check (exists (
  select 1 from public.admin_users a
  where a.user_id=(select auth.uid()) and a.role='admin' and a.is_active
));

create policy "Active admins can delete product reviews" on public.product_reviews
for delete to authenticated using (exists (
  select 1 from public.admin_users a
  where a.user_id=(select auth.uid()) and a.role='admin' and a.is_active
));

create or replace function public.get_product_review_summary(p_product_id uuid)
returns table(total_reviews bigint, average_rating numeric, five_star bigint, four_star bigint, three_star bigint, two_star bigint, one_star bigint)
language sql stable security invoker set search_path='' as $$
  select count(r.id), round(avg(r.rating)::numeric, 2),
    count(*) filter (where r.rating=5), count(*) filter (where r.rating=4),
    count(*) filter (where r.rating=3), count(*) filter (where r.rating=2),
    count(*) filter (where r.rating=1)
  from public.products p
  left join public.product_reviews r on r.product_id=p.id and r.status='approved'
  where p.id=p_product_id and p.status='published';
$$;

revoke all on function public.get_product_review_summary(uuid) from public;
grant execute on function public.get_product_review_summary(uuid) to anon, authenticated;

commit;
