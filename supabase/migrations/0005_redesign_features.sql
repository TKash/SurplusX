-- Features behind the app redesign: structured lot fields, swatch requests, saved searches.
-- Apply by pasting into the Supabase SQL Editor. Safe to re-run.

-- ============ STRUCTURED LOT FIELDS ============
-- All optional: older lots and WhatsApp lots that don't mention them keep working, and the UI
-- falls back to category/spec when they're empty.
alter table lots
  add column if not exists title text,
  add column if not exists gsm integer check (gsm is null or gsm > 0),
  add column if not exists width_cm integer check (width_cm is null or width_cm > 0),
  add column if not exists colour text;

-- Feed is always newest-first; saved-search "N new" counts filter on created_at too.
create index if not exists lots_created_at_idx on lots(created_at desc);

-- ============ SWATCH REQUESTS ============
-- A buyer asking a seller for a physical sample. Arranged off-platform on WhatsApp, like deals;
-- this table only records the ask so both sides can see it.
create table if not exists swatch_requests (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references lots(id) on delete cascade,
  buyer_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (lot_id, buyer_id)
);

create index if not exists swatch_requests_buyer_idx on swatch_requests(buyer_id);
create index if not exists swatch_requests_lot_idx on swatch_requests(lot_id);

alter table swatch_requests enable row level security;

drop policy if exists "swatch_requests_select_involved" on swatch_requests;
create policy "swatch_requests_select_involved" on swatch_requests
  for select using (
    auth.uid() = buyer_id
    or auth.uid() in (select seller_id from lots where lots.id = swatch_requests.lot_id)
  );

-- Buyers can't request a swatch of their own lot.
drop policy if exists "swatch_requests_insert_own" on swatch_requests;
create policy "swatch_requests_insert_own" on swatch_requests
  for insert with check (
    auth.uid() = buyer_id
    and auth.uid() not in (select seller_id from lots where lots.id = swatch_requests.lot_id)
  );

-- ============ SAVED SEARCHES ============
-- filters mirrors the feed's query params (q, category, qty, gsm, price). last_seen_at drives
-- the "N new" counts: lots matching the filters created after it.
create table if not exists saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  filters jsonb not null default '{}',
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists saved_searches_user_idx on saved_searches(user_id);

alter table saved_searches enable row level security;

drop policy if exists "saved_searches_select_own" on saved_searches;
create policy "saved_searches_select_own" on saved_searches
  for select using (auth.uid() = user_id);

drop policy if exists "saved_searches_insert_own" on saved_searches;
create policy "saved_searches_insert_own" on saved_searches
  for insert with check (auth.uid() = user_id);

drop policy if exists "saved_searches_update_own" on saved_searches;
create policy "saved_searches_update_own" on saved_searches
  for update using (auth.uid() = user_id);

drop policy if exists "saved_searches_delete_own" on saved_searches;
create policy "saved_searches_delete_own" on saved_searches
  for delete using (auth.uid() = user_id);

-- Seller confirm/decline and buyer cancel on claims need no schema change: claim_status
-- already has 'confirmed' and 'cancelled', and those transitions run server-side through the
-- service-role client after the server action has authorized them (same pattern as claiming).
