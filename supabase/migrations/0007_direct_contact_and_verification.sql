-- Claiming is gone. A buyer who wants a lot gets the seller's number and deals with them directly,
-- and the paid product becomes optional on-floor verification of a lot.
--
-- Run the whole file in one go in the Supabase SQL Editor. Safe to re-run.

-- ============ 1. CLAIMS AND SWATCHES REMOVED ============
drop table if exists claims cascade;
drop table if exists swatch_requests cascade;

-- The 48h hold is gone, so the scheduled job that expired holds has nothing to do.
select cron.unschedule(jobid) from cron.job where jobname = 'expire-reservations';
drop function if exists public.expire_stale_reservations();

-- Anything left on hold goes back on the feed. 'reserved' stays in the enum (Postgres can't drop a
-- value) but is no longer used.
update lots set status = 'available' where status = 'reserved';

-- ============ 2. UNITS FOR THE NEW CATEGORIES ============
-- Fibre comes in bales, yarn in cones, trims by the gross, garments in cartons.
alter type lot_unit add value if not exists 'tonnes';
alter type lot_unit add value if not exists 'bales';
alter type lot_unit add value if not exists 'cones';
alter type lot_unit add value if not exists 'hanks';
alter type lot_unit add value if not exists 'cartons';
alter type lot_unit add value if not exists 'boxes';
alter type lot_unit add value if not exists 'gross';
alter type lot_unit add value if not exists 'sets';

-- ============ 3. CONTACT, FLEXIBLE SPEC, PRICE ON REQUEST ============
alter table lots
  add column if not exists contact_phone text,
  add column if not exists contact_name text,
  -- Category-specific details (GSM, yarn count, size ratio...) live here, so a new field needs no
  -- migration. The shape per category is defined in lib/lots/categories.ts.
  add column if not exists attributes jsonb not null default '{}';

-- "Price on request" is normal in surplus trading, so a lot may have no price.
alter table lots alter column price_per_unit drop not null;

-- Stock is often counted in one unit and priced in another (12 rolls, sold at a price per metre).
alter table lots add column if not exists price_unit lot_unit;
update lots set price_unit = unit where price_unit is null;

update lots l
   set contact_phone = p.whatsapp_number
  from profiles p
 where p.id = l.seller_id
   and l.contact_phone is null;

-- ============ 4. FIVE CATEGORIES ============
-- Everything listed so far was fabric (free-text categories like 'cotton' came from the bot).
update lots
   set category = 'Fabrics'
 where category not in ('Fibre', 'Yarns', 'Fabrics', 'Trims & accessories', 'Garments');

-- ============ 5. VERIFICATION (the paid product) ============
do $$
begin
  if not exists (select 1 from pg_type where typname = 'verification_status') then
    create type verification_status as enum ('none', 'requested', 'scheduled', 'verified');
  end if;
end
$$;

alter table lots
  add column if not exists verification verification_status not null default 'none',
  add column if not exists verification_requested_at timestamptz,
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid references profiles(id),
  add column if not exists verification_notes text,
  add column if not exists verification_photo_urls text[] not null default '{}';

create index if not exists lots_verification_idx on lots(verification);

-- Only staff move a lot through verification; server actions check this flag before using the
-- service-role client, since RLS lets a seller update only their own row.
alter table profiles add column if not exists is_admin boolean not null default false;

-- ============ 6. WHO ASKED FOR A SELLER'S CONTACT ============
-- One row per buyer per lot: it tells the seller how much real interest a lot got, which is also
-- what makes paying for verification worth it.
create table if not exists contact_views (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references lots(id) on delete cascade,
  viewer_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (lot_id, viewer_id)
);

create index if not exists contact_views_lot_idx on contact_views(lot_id);

alter table contact_views enable row level security;

drop policy if exists "contact_views_insert_own" on contact_views;
create policy "contact_views_insert_own" on contact_views
  for insert with check (auth.uid() = viewer_id);

drop policy if exists "contact_views_select_involved" on contact_views;
create policy "contact_views_select_involved" on contact_views
  for select using (
    auth.uid() = viewer_id
    or auth.uid() in (select seller_id from lots where lots.id = contact_views.lot_id)
  );
