-- Run in Supabase SQL Editor. Idempotent initial setup (does not overwrite existing data).
create extension if not exists pgcrypto;
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.destinations (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null, country text not null, region text not null,
  category text not null check (category in ('Coast','Mountains','Culture','Nature')),
  tagline text not null, description text not null,
  duration text not null, best_time text not null,
  highlights text[] not null default '{}',
  image_fallback text not null default '/images/hero.svg',
  photo_url text, published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) <= 254),
  destination_slug text references public.destinations(slug) on delete set null,
  travel_date date, guests integer not null check (guests between 1 and 20),
  message text check (char_length(message) <= 2000),
  status text not null default 'new' check (status in ('new','contacted','confirmed','closed')),
  created_at timestamptz not null default now()
);
create index if not exists inquiry_recent_idx on public.inquiries(created_at desc);
create index if not exists destination_display_idx on public.destinations(published,sort_order);
alter table public.admin_users enable row level security;
alter table public.destinations enable row level security;
alter table public.inquiries enable row level security;
-- Role check uses the current auth identity. Only self-record visibility; users cannot grant themselves a role.
drop policy if exists "self admin check" on public.admin_users;
create policy "self admin check" on public.admin_users for select to authenticated using (user_id = (select auth.uid()));
-- Public can view only published catalog rows. Admin may view and manage drafts.
drop policy if exists "catalog select" on public.destinations;
create policy "catalog select" on public.destinations for select to anon,authenticated using (published or exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
drop policy if exists "admin catalog insert" on public.destinations;
create policy "admin catalog insert" on public.destinations for insert to authenticated with check (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
drop policy if exists "admin catalog update" on public.destinations;
create policy "admin catalog update" on public.destinations for update to authenticated using (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid()))) with check (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
-- Public inquiries: insert only. No public select/update/delete. Admins may view and update.
drop policy if exists "public inquiry insert" on public.inquiries;
create policy "public inquiry insert" on public.inquiries for insert to anon,authenticated with check (status='new');
drop policy if exists "admin inquiry select" on public.inquiries;
create policy "admin inquiry select" on public.inquiries for select to authenticated using (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
drop policy if exists "admin inquiry update" on public.inquiries;
create policy "admin inquiry update" on public.inquiries for update to authenticated using (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid()))) with check (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
-- Storage bucket is public for published artwork URLs; uploads are admin only.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('destination-images','destination-images',true,5242880,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public=true,file_size_limit=5242880,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "admin upload artwork" on storage.objects;
create policy "admin upload artwork" on storage.objects for insert to authenticated with check (bucket_id='destination-images' and exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
drop policy if exists "admin remove artwork" on storage.objects;
create policy "admin remove artwork" on storage.objects for delete to authenticated using (bucket_id='destination-images' and exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
-- No admin_user insert policy intentionally. Grant admin from trusted SQL editor only.
