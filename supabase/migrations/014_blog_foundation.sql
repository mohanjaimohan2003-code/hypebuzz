begin;

create table public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_categories_name_not_blank check (btrim(name) <> ''),
  constraint blog_categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text,
  cover_image_url text,
  author_name text,
  category_id uuid references public.blog_categories(id) on delete set null,
  status text not null default 'draft',
  featured boolean not null default false,
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_posts_title_not_blank check (btrim(title) <> ''),
  constraint blog_posts_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint blog_posts_status_allowed check (status in ('draft', 'published', 'archived')),
  constraint blog_posts_published_requirements check (
    status <> 'published' or (published_at is not null and nullif(btrim(content), '') is not null)
  ),
  constraint blog_posts_seo_title_length check (seo_title is null or char_length(seo_title) <= 60),
  constraint blog_posts_seo_description_length check (seo_description is null or char_length(seo_description) <= 160)
);

create table public.blog_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_tags_name_not_blank check (btrim(name) <> ''),
  constraint blog_tags_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.blog_post_tags (
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  tag_id uuid not null references public.blog_tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

create index blog_posts_category_id_idx on public.blog_posts (category_id);
create index blog_posts_status_published_at_idx on public.blog_posts (status, published_at desc);
create index blog_posts_featured_published_idx on public.blog_posts (published_at desc)
  where status = 'published' and featured = true;
create index blog_post_tags_tag_id_idx on public.blog_post_tags (tag_id);

create trigger blog_categories_set_updated_at before update on public.blog_categories
for each row execute function public.set_updated_at();
create trigger blog_posts_set_updated_at before update on public.blog_posts
for each row execute function public.set_updated_at();
create trigger blog_tags_set_updated_at before update on public.blog_tags
for each row execute function public.set_updated_at();

alter table public.blog_categories enable row level security;
alter table public.blog_posts enable row level security;
alter table public.blog_tags enable row level security;
alter table public.blog_post_tags enable row level security;

revoke all on public.blog_categories, public.blog_posts, public.blog_tags, public.blog_post_tags from anon, authenticated;
grant select on public.blog_categories, public.blog_posts, public.blog_tags, public.blog_post_tags to anon, authenticated;
grant insert, update, delete on public.blog_categories, public.blog_posts, public.blog_tags, public.blog_post_tags to authenticated;

create policy "Public can read blog categories" on public.blog_categories for select to anon, authenticated using (true);
create policy "Public can read blog tags" on public.blog_tags for select to anon, authenticated using (true);
create policy "Public can read published blog posts" on public.blog_posts for select to anon, authenticated using (status = 'published');
create policy "Public can read published blog post tags" on public.blog_post_tags for select to anon, authenticated
using (exists (select 1 from public.blog_posts where blog_posts.id = blog_post_tags.post_id and blog_posts.status = 'published'));

create policy "Active admins can manage blog categories" on public.blog_categories for all to authenticated
using (exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'admin' and is_active = true))
with check (exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'admin' and is_active = true));
create policy "Active admins can manage blog posts" on public.blog_posts for all to authenticated
using (exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'admin' and is_active = true))
with check (exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'admin' and is_active = true));
create policy "Active admins can manage blog tags" on public.blog_tags for all to authenticated
using (exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'admin' and is_active = true))
with check (exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'admin' and is_active = true));
create policy "Active admins can manage blog post tags" on public.blog_post_tags for all to authenticated
using (exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'admin' and is_active = true))
with check (exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'admin' and is_active = true));

commit;
