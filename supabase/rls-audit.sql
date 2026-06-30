-- =============================================================
-- Noem Studio — RLS policy audit  (2026-06-30)
--
-- REVIEW BEFORE RUNNING. This file is a proposed corrective migration,
-- not part of the normal setup. Run it MANUALLY in the Supabase SQL editor
-- AFTER schema.sql and admin.sql (it depends on the public.is_admin() helper
-- defined in admin.sql).
--
-- Scope of audit: RLS policies on public.products, public.orders, public.profiles.
-- The app uses the anon key + the signed-in user's session for ALL database
-- access (lib/supabase/server.ts and client.ts) — there is no service-role
-- client anywhere — so every query, including the admin panel, is subject to RLS.
-- =============================================================


-- -------------------------------------------------------------
-- PRODUCTS — OK, no change needed.
--   • SELECT: "products are public" USING (true)            → guests can read.   ✓
--   • INSERT/UPDATE/DELETE: no public policy; "admins manage products"
--     (admin.sql) is the only write policy, gated by is_admin().               ✓
--   Result: guests read but cannot write; only admins write.
-- -------------------------------------------------------------


-- -------------------------------------------------------------
-- ORDERS — TWO MISSING ADMIN POLICIES  (FINDING #1, HIGH)
--
--   Current policies (schema.sql):
--     • INSERT "anyone can create orders" WITH CHECK (user_id is null
--       or auth.uid() = user_id)                                              ✓ guest checkout
--     • SELECT "own orders select" USING (auth.uid() = user_id)              ✓ users see only their own
--       (guest orders have user_id = null; `null = <uuid>` is never true, so
--        guest orders are unreadable by other users)                          ✓
--
--   Gap: schema.sql (lines 132–133) states admin read/update on ALL orders is
--   "provisioned in supabase/admin.sql" — but admin.sql defines NO orders
--   policy. Consequences under RLS:
--     • app/admin/poruchki/page.tsx  → select("*")  returns only the admin's
--       own orders, not every order.
--     • components/admin/OrderStatusForm.tsx → update({status}) is DENIED
--       (there is no UPDATE policy on orders at all), so admins cannot change
--       order status.
--
--   Fix: add the admin SELECT + UPDATE policies the schema already promised.
--   (Permissive policies are OR'd, so "own orders select" still applies to
--    regular users; admins additionally see/modify everything.)
-- -------------------------------------------------------------

drop policy if exists "admins read all orders" on public.orders;
create policy "admins read all orders"
  on public.orders for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins update orders" on public.orders;
create policy "admins update orders"
  on public.orders for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Note: no DELETE policy is added — the app never deletes orders, so deletes
-- stay denied for everyone (delete via the SQL editor / service role if needed).


-- -------------------------------------------------------------
-- PROFILES — PRIVILEGE ESCALATION  (FINDING #2, HIGH)
--
--   Current policies (schema.sql):
--     • SELECT "own profile select" USING (auth.uid() = id)                  ✓ own only
--     • UPDATE "own profile update" USING (auth.uid() = id)                  ⚠ see below
--     • INSERT "own profile insert" WITH CHECK (auth.uid() = id)            ✓ own only
--
--   Gap: the UPDATE policy restricts WHICH ROW a user may edit (their own) but
--   not WHICH COLUMNS. A user can therefore run
--       update public.profiles set is_admin = true where id = auth.uid();
--   and promote themselves to admin, defeating every is_admin() check.
--
--   RLS WITH CHECK cannot compare OLD vs NEW, so the column is guarded with a
--   BEFORE UPDATE trigger that ignores is_admin changes from non-admins. Admins
--   are minted via the SQL editor (service role), per admin.sql, which bypasses
--   RLS and triggers run as SECURITY DEFINER, so the legitimate path is intact.
-- -------------------------------------------------------------

create or replace function public.protect_is_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only an existing admin may change the is_admin flag; otherwise keep the old
  -- value silently so ordinary profile edits (name/phone/address) still succeed.
  if new.is_admin is distinct from old.is_admin and not public.is_admin() then
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_is_admin on public.profiles;
create trigger profiles_protect_is_admin
  before update on public.profiles
  for each row execute function public.protect_is_admin();

-- Stricter alternative (instead of, or in addition to, the trigger): revoke the
-- column outright so the authenticated role can never write it via PostgREST.
-- Caveat: any UPDATE whose payload includes is_admin — even unchanged — then
-- errors, so the client must omit the column. The app never sends it today.
--   revoke update (is_admin) on public.profiles from authenticated;


-- -------------------------------------------------------------
-- SUMMARY
--   products  — OK, unchanged.
--   orders    — added "admins read all orders" + "admins update orders".
--   profiles  — added protect_is_admin() trigger (blocks self-promotion).
-- =============================================================
