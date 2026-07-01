-- Run this once in the Supabase SQL editor for your project.

create extension if not exists "pgcrypto";

create table if not exists artworks (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled',
  storage_path text not null,
  style text not null default 'Uncategorized',
  created_at timestamptz not null default now()
);

-- Safe to re-run on an existing table created before the style column existed.
alter table artworks add column if not exists style text not null default 'Uncategorized';

alter table artworks enable row level security;

-- Anyone with the anon key can read the gallery (the app itself sits
-- behind the password gate; this only controls direct API access).
create policy "Public read access" on artworks
  for select
  to anon
  using (true);

-- All writes go through the server-side API routes using the service
-- role key, which bypasses RLS, so no insert/update/delete policies
-- are needed for the anon role.

-- Storage: create a public bucket named "artwork" for the images.
insert into storage.buckets (id, name, public)
values ('artwork', 'artwork', true)
on conflict (id) do nothing;

create policy "Public read artwork files" on storage.objects
  for select
  to anon
  using (bucket_id = 'artwork');
