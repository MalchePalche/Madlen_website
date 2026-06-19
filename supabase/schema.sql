-- =============================================================
-- Madlen — Supabase schema (products, orders, profiles)
-- Run in the Supabase SQL editor, then run seed.sql for sample data.
-- =============================================================

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ---------- enums ----------
do $$ begin
  create type gender_t as enum ('male', 'female', 'unisex');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status_t as enum ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');
exception when duplicate_object then null; end $$;

-- ---------- products ----------
create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name_bg       text not null,
  name_en       text not null,
  price_bgn     numeric(10,2) not null check (price_bgn >= 0),
  compare_at_bgn numeric(10,2) check (compare_at_bgn >= 0),
  category      text not null,
  gender        gender_t not null,
  images        text[] not null default '{}',
  sizes         text[] not null default '{}',
  out_of_stock_sizes text[] not null default '{}',
  -- colors: array of objects {name, hex}
  colors        jsonb not null default '[]'::jsonb,
  is_new        boolean not null default false,
  stock         integer not null default 0 check (stock >= 0),
  description_bg text,
  material_bg   text,
  created_at    timestamptz not null default now()
);

create index if not exists products_gender_idx   on public.products (gender);
create index if not exists products_category_idx on public.products (category);
create index if not exists products_is_new_idx   on public.products (is_new);

-- ---------- profiles (1:1 with auth.users) ----------
create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  full_name       text,
  phone           text,
  default_address jsonb,
  created_at      timestamptz not null default now()
);

-- Auto-create a profile row when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- orders ----------
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users (id) on delete set null, -- nullable for guest checkout
  items            jsonb not null,
  total_bgn        numeric(10,2) not null check (total_bgn >= 0),
  delivery_address jsonb not null,
  status           order_status_t not null default 'pending',
  payment_method   text not null default 'cod' check (payment_method = 'cod'),
  created_at       timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);

-- =============================================================
-- Row Level Security
-- =============================================================
alter table public.products enable row level security;
alter table public.profiles enable row level security;
alter table public.orders   enable row level security;

-- Products: readable by everyone (catalogue is public). Writes via dashboard/service role only.
drop policy if exists "products are public" on public.products;
create policy "products are public"
  on public.products for select
  using (true);

-- Profiles: a user can see and edit only their own profile.
drop policy if exists "own profile select" on public.profiles;
create policy "own profile select"
  on public.profiles for select using (auth.uid() = id);

drop policy if exists "own profile update" on public.profiles;
create policy "own profile update"
  on public.profiles for update using (auth.uid() = id);

drop policy if exists "own profile insert" on public.profiles;
create policy "own profile insert"
  on public.profiles for insert with check (auth.uid() = id);

-- Orders: anyone may create an order (guest checkout allowed).
drop policy if exists "anyone can create orders" on public.orders;
create policy "anyone can create orders"
  on public.orders for insert
  with check (
    -- a guest order has no user; a logged-in order must belong to the caller
    user_id is null or auth.uid() = user_id
  );

-- Orders: a logged-in user can read only their own orders.
drop policy if exists "own orders select" on public.orders;
create policy "own orders select"
  on public.orders for select
  using (auth.uid() = user_id);
