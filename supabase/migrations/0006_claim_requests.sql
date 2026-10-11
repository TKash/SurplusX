-- Claiming becomes a request the seller accepts, and only acceptance puts a lot on hold.
--
-- Before: claiming reserved the lot immediately and only one buyer could have a pending claim.
-- Now: any number of buyers can send a request (with an offer and a message); accepting one
-- reserves the lot for 48h and auto-declines the rest.
--
-- Apply by pasting into the Supabase SQL Editor. Safe to re-run.

alter table claims
  add column if not exists offer_price numeric check (offer_price is null or offer_price > 0),
  add column if not exists offer_quantity numeric check (offer_quantity is null or offer_quantity > 0),
  add column if not exists message text,
  add column if not exists responded_at timestamptz;

-- The 48h hold now starts when the seller accepts, so a request has no reserved_until yet.
alter table claims alter column reserved_until drop not null;

-- Was: one pending claim per lot (the old immediate-reservation guard).
drop index if exists one_active_claim_per_lot;

-- Now the race guard is on acceptance: a lot can only be on hold for one buyer at a time.
create unique index if not exists one_confirmed_claim_per_lot
  on claims(lot_id) where status = 'confirmed';

-- unique (lot_id, buyer_id) stays: one request per buyer per lot, reused if they ask again.

-- The scheduled job (migration 0004) expired *pending* claims. Pending now means "waiting for the
-- seller" and has no deadline; what lapses is an accepted 48h hold, so the job follows the change.
create or replace function public.expire_stale_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  expired_count integer;
begin
  with stale as (
    update claims
       set status = 'expired'
     where status = 'confirmed'
       and reserved_until is not null
       and reserved_until < now()
    returning lot_id
  ), reverted as (
    update lots
       set status = 'available'
     where status = 'reserved'
       and id in (select lot_id from stale)
    returning id
  )
  select count(*) into expired_count from stale;

  return expired_count;
end;
$$;

revoke all on function public.expire_stale_reservations() from public, anon, authenticated;
