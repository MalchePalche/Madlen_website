-- =============================================================
-- Noem Studio — remove seed/mock products from the catalogue
-- Run in the Supabase SQL editor (service role / dashboard) — RLS blocks
-- product deletes for the anon key, so this cannot run from the app client.
--
-- Real (imported) products keep their images in Supabase Storage, e.g.
--   https://<project>.supabase.co/storage/v1/object/public/products/ig_...
-- Seed/mock products point at Unsplash (or have no image), so we delete any
-- product that has NO image matching the Storage "ig_" upload pattern.
--
-- Verified against the live DB on 2026-06-24: 44 total → 11 deleted, 33 kept.
-- =============================================================

delete from public.products
where not exists (
  select 1 from unnest(images) img
  where img like '%/storage/v1/object/public/products/ig_%'
);

-- Verify the remaining count (expect ~33–34 real products):
--   select count(*) from public.products;
