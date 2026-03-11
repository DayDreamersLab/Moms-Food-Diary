-- ============================================================
-- Mom's Food Diary — Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- PROFILES (extends Supabase auth.users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null,
  display_name text not null,
  mom_name    text not null default 'Mom',
  avatar_url  text,
  bio         text,
  created_at  timestamptz default now()
);

-- POSTS
create table if not exists public.posts (
  id          bigserial primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  dish_name   text not null,
  occasion    text,
  review      text not null,
  recipe      text,
  rating      smallint check (rating between 1 and 5),
  photo_url   text,
  mood        text,
  created_at  timestamptz default now()
);

-- LIKES
create table if not exists public.likes (
  id          bigserial primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  post_id     bigint not null references public.posts(id) on delete cascade,
  emoji       text not null default '❤️',
  created_at  timestamptz default now(),
  unique(user_id, post_id)
);

-- ── FULL TEXT SEARCH INDEX ──
alter table public.posts add column if not exists search_vector tsvector
  generated always as (
    to_tsvector('english', coalesce(dish_name,'') || ' ' || coalesce(review,'') || ' ' || coalesce(recipe,''))
  ) stored;

create index if not exists posts_search_idx on public.posts using gin(search_vector);

-- ── ROW LEVEL SECURITY ──
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;

-- Profiles: anyone can read, only owner can update
create policy "Profiles are public" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Posts: anyone can read, only owner can insert/delete
create policy "Posts are public" on public.posts for select using (true);
create policy "Authenticated users can post" on public.posts for insert with check (auth.uid() = user_id);
create policy "Users can delete own posts" on public.posts for delete using (auth.uid() = user_id);

-- Likes: anyone can read, auth users can insert/delete own
create policy "Likes are public" on public.likes for select using (true);
create policy "Auth users can like" on public.likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike" on public.likes for delete using (auth.uid() = user_id);

-- ── STORAGE BUCKET ──
-- Run this separately or via dashboard:
-- insert into storage.buckets (id, name, public) values ('post-photos', 'post-photos', true);
-- create policy "Public photo access" on storage.objects for select using (bucket_id = 'post-photos');
-- create policy "Auth users upload photos" on storage.objects for insert with check (bucket_id = 'post-photos' and auth.role() = 'authenticated');
-- create policy "Users delete own photos" on storage.objects for delete using (bucket_id = 'post-photos' and auth.uid()::text = (storage.foldername(name))[1]);
