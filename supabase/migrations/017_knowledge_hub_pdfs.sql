begin;

create table public.knowledge_hub_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  category text not null,
  tags text[] not null default '{}',
  author_name text,
  pdf_url text not null,
  pdf_storage_path text not null,
  thumbnail_url text,
  thumbnail_storage_path text,
  pdf_size_bytes bigint not null,
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint knowledge_hub_title_not_blank check (btrim(title) <> ''),
  constraint knowledge_hub_description_not_blank check (btrim(description) <> ''),
  constraint knowledge_hub_category_not_blank check (btrim(category) <> ''),
  constraint knowledge_hub_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint knowledge_hub_status_allowed check (status in ('draft', 'published')),
  constraint knowledge_hub_pdf_size_valid check (pdf_size_bytes > 0 and pdf_size_bytes <= 26214400),
  constraint knowledge_hub_published_date check (status <> 'published' or published_at is not null)
);

create index knowledge_hub_items_slug_idx on public.knowledge_hub_items (slug);
create index knowledge_hub_items_status_idx on public.knowledge_hub_items (status);
create index knowledge_hub_items_category_idx on public.knowledge_hub_items (category);
create index knowledge_hub_items_published_at_idx on public.knowledge_hub_items (published_at desc);

create trigger knowledge_hub_items_set_updated_at before update on public.knowledge_hub_items
for each row execute function public.set_updated_at();

alter table public.knowledge_hub_items enable row level security;
revoke all on public.knowledge_hub_items from anon, authenticated;
grant select on public.knowledge_hub_items to anon, authenticated;
grant insert, update, delete on public.knowledge_hub_items to authenticated;

create policy "Public can read published knowledge hub items" on public.knowledge_hub_items
for select to anon, authenticated using (
  status = 'published' or exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid()) and role = 'admin' and is_active = true
  )
);
create policy "Active admins can manage knowledge hub items" on public.knowledge_hub_items
for all to authenticated
using (exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'admin' and is_active = true))
with check (exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'admin' and is_active = true));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('knowledge-hub-pdfs', 'knowledge-hub-pdfs', false, 26214400, array['application/pdf']),
  ('knowledge-hub-thumbnails', 'knowledge-hub-thumbnails', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Published knowledge hub assets are readable" on storage.objects
for select to anon, authenticated using (
  bucket_id in ('knowledge-hub-pdfs', 'knowledge-hub-thumbnails')
  and (
    exists (
      select 1 from public.knowledge_hub_items
      where id::text = (storage.foldername(name))[2] and status = 'published'
    )
    or exists (
      select 1 from public.admin_users
      where user_id = (select auth.uid()) and role = 'admin' and is_active = true
    )
  )
);

create policy "Active admins upload knowledge hub assets" on storage.objects
for insert to authenticated with check (
  bucket_id in ('knowledge-hub-pdfs', 'knowledge-hub-thumbnails')
  and exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'admin' and is_active = true)
);
create policy "Active admins update knowledge hub assets" on storage.objects
for update to authenticated using (
  bucket_id in ('knowledge-hub-pdfs', 'knowledge-hub-thumbnails')
  and exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'admin' and is_active = true)
) with check (
  bucket_id in ('knowledge-hub-pdfs', 'knowledge-hub-thumbnails')
  and exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'admin' and is_active = true)
);
create policy "Active admins delete knowledge hub assets" on storage.objects
for delete to authenticated using (
  bucket_id in ('knowledge-hub-pdfs', 'knowledge-hub-thumbnails')
  and exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'admin' and is_active = true)
);

commit;
