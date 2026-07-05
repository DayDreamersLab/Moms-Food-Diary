create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  mom_name text not null default 'Mom',
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

create table if not exists posts (
  id bigserial primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  dish_name text not null,
  occasion text,
  review text not null,
  recipe text,
  rating smallint check (rating between 1 and 5),
  photo_url text,
  mood text,
  created_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(dish_name, '') || ' ' || coalesce(review, '') || ' ' || coalesce(recipe, ''))
  ) stored
);

create table if not exists likes (
  id bigserial primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  post_id bigint not null references posts(id) on delete cascade,
  emoji text not null default '❤️',
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

create index if not exists posts_created_at_idx on posts (created_at desc);
create index if not exists posts_user_id_idx on posts (user_id);
create index if not exists posts_search_idx on posts using gin(search_vector);
create index if not exists likes_post_id_idx on likes (post_id);
