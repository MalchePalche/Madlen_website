-- =============================================================
-- Noem Studio — newsletter subscribers
-- Run in the Supabase SQL editor (after schema.sql).
-- =============================================================

create table if not exists public.newsletter_subscribers (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  subscribed_at timestamptz not null default now(),
  -- where the signup came from, e.g. 'footer' or 'homepage'
  source        text not null default 'footer'
);

-- One row per address, case-insensitive ("Ana@x.bg" == "ana@x.bg").
create unique index if not exists newsletter_subscribers_email_key
  on public.newsletter_subscribers (lower(email));

-- =============================================================
-- Row Level Security
-- =============================================================
-- No policies on purpose: signups are inserted by /api/newsletter with the
-- service-role key (validated + rate-limited there), and the subscriber list
-- is never exposed to the browser — so anon/authenticated get denied for
-- every operation.
alter table public.newsletter_subscribers enable row level security;
