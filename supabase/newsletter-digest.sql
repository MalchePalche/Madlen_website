-- =============================================================
-- Noem Studio — daily newsletter digest pipeline
-- Run in the Supabase SQL editor AFTER schema.sql and newsletter.sql.
--
-- Adds:
--   1. products.updated_at + an auto-touch trigger (so "created OR updated
--      since the last digest" can be computed).
--   2. A digest_state singleton row holding last_digest_sent_at — the cutoff
--      the send job uses to avoid re-sending the same items every day.
--   3. Unsubscribe support on newsletter_subscribers (unsubscribed_at + a
--      per-subscriber unsubscribe_token for one-click links in emails).
-- Safe to re-run (idempotent).
-- =============================================================

-- ---------- 1. products.updated_at + auto-touch trigger ----------
alter table public.products
  add column if not exists updated_at timestamptz not null default now();

-- Keep updated_at in sync on every UPDATE, regardless of the write path
-- (admin form, SQL editor, service role). Runs before the row is written.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

-- Cheap lookups when the job filters by recency.
create index if not exists products_updated_at_idx on public.products (updated_at);

-- ---------- 2. digest_state (singleton cutoff record) ----------
-- Single row keyed on id = true; the check constraint makes a second row
-- impossible. last_digest_sent_at is advanced only after a successful send.
create table if not exists public.digest_state (
  id                  boolean primary key default true,
  last_digest_sent_at timestamptz not null default now(),
  constraint digest_state_singleton check (id)
);

-- Seed the row. Initialising to now() means the FIRST digest run only picks up
-- products created/updated AFTER the pipeline goes live — we don't blast the
-- entire back-catalogue on day one.
insert into public.digest_state (id, last_digest_sent_at)
values (true, now())
on conflict (id) do nothing;

-- No policies: only the service role (send job) reads/writes this table.
alter table public.digest_state enable row level security;

-- ---------- 3. unsubscribe support ----------
-- unsubscribed_at IS NULL  => active subscriber (receives the digest).
-- unsubscribe_token        => unguessable per-subscriber token for the
--                             /otpisvane?token=... link. A volatile default
--                             backfills a distinct token for every existing row.
alter table public.newsletter_subscribers
  add column if not exists unsubscribed_at  timestamptz,
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid();

-- Fast token lookups from the unsubscribe page.
create unique index if not exists newsletter_subscribers_unsub_token_key
  on public.newsletter_subscribers (unsubscribe_token);

-- Only-active lookups from the send job.
create index if not exists newsletter_subscribers_active_idx
  on public.newsletter_subscribers (unsubscribed_at)
  where unsubscribed_at is null;
