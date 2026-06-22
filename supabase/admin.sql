-- =============================================================
-- Noem Studio — Admin panel migration
-- Run AFTER schema.sql (and seed.sql) in the Supabase SQL editor.
--
-- schema.sql already defines the profiles.is_admin column and the
-- admin read/update policies on orders. This file adds:
--   • an is_admin() helper
--   • product write policies (insert / update / delete)
--   • the product image storage bucket + its policies
-- =============================================================

-- Make yourself an admin (replace the UUID with your auth user id):
--   update public.profiles set is_admin = true where id = 'your-user-uuid';

-- ---------- is_admin() helper ----------
-- SECURITY DEFINER so it reads profiles bypassing RLS — this avoids
-- recursive policy evaluation when used inside other tables' policies.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------- Products: admin full write access ----------
-- (The existing "products are public" SELECT policy stays; permissive
--  policies are OR'd, so the public can still read the catalogue.)
drop policy if exists "admins manage products" on public.products;
create policy "admins manage products"
  on public.products for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- Product image storage bucket ----------
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do update set public = true;

-- Anyone can read product images (the bucket is public).
drop policy if exists "public read product images" on storage.objects;
create policy "public read product images"
  on storage.objects for select
  using (bucket_id = 'products');

-- Only admins may upload / replace / delete product images.
drop policy if exists "admins upload product images" on storage.objects;
create policy "admins upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'products' and public.is_admin());

drop policy if exists "admins update product images" on storage.objects;
create policy "admins update product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'products' and public.is_admin())
  with check (bucket_id = 'products' and public.is_admin());

drop policy if exists "admins delete product images" on storage.objects;
create policy "admins delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'products' and public.is_admin());
