-- =============================================================
-- Noem Studio — product reviews / ratings
-- Run in the Supabase SQL editor AFTER schema.sql and admin.sql
-- (this file uses the public.is_admin() helper defined in admin.sql).
-- =============================================================

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  author_name text not null,
  rating      integer not null check (rating between 1 and 5),
  comment     text,
  -- Reviews are held for moderation and only shown publicly once approved.
  is_approved boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Public reads filter on (product_id, is_approved); moderation lists on is_approved.
create index if not exists reviews_product_approved_idx
  on public.reviews (product_id, is_approved);
create index if not exists reviews_is_approved_idx
  on public.reviews (is_approved);

-- =============================================================
-- Row Level Security
-- =============================================================
-- Mirrors how orders are secured: the public may INSERT (reviews need no
-- account, same as guest checkout) but may only SELECT approved rows. The
-- /api/reviews route actually writes with the service-role key (validated +
-- rate-limited there); these policies document intent and keep anon access
-- safe even if something ever inserts/reads with the anon key directly.
alter table public.reviews enable row level security;

-- Anyone may submit a review, but it can only land unapproved — a public
-- caller can never self-approve (the WITH CHECK forbids is_approved = true).
drop policy if exists "anyone can submit a review" on public.reviews;
create policy "anyone can submit a review"
  on public.reviews for insert
  with check (is_approved = false);

-- Everyone (anon + authenticated) may read only approved reviews.
drop policy if exists "approved reviews are public" on public.reviews;
create policy "approved reviews are public"
  on public.reviews for select
  using (is_approved = true);

-- Admins may read every review (including pending) for the moderation queue.
-- Permissive policies are OR'd, so this widens admin SELECT to all rows while
-- the public still sees approved ones only.
drop policy if exists "admins read all reviews" on public.reviews;
create policy "admins read all reviews"
  on public.reviews for select
  to authenticated
  using (public.is_admin());

-- Admins may approve / unapprove any review.
drop policy if exists "admins update reviews" on public.reviews;
create policy "admins update reviews"
  on public.reviews for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Admins may delete (reject) any review.
drop policy if exists "admins delete reviews" on public.reviews;
create policy "admins delete reviews"
  on public.reviews for delete
  to authenticated
  using (public.is_admin());
