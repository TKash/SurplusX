import { cache } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type {
  Claim,
  ClaimWithLot,
  LotDetail,
  LotInsert,
  LotWithClaims,
  LotWithSeller,
  SavedSearch,
  SwatchWithBuyer,
  SwatchWithLot,
} from './types'
import { CLAIM_WINDOW_HOURS } from '@/lib/constants'
import {
  applyFeedFilters,
  applyFeedSort,
  parseFeedFilters,
  sanitizeSearch,
  type FeedFilters,
} from './filters'

type Client = SupabaseClient<Database>

const PROFILE_SUMMARY = 'full_name, company_name, city, whatsapp_number'
const LOT_WITH_SELLER = `*, profiles(${PROFILE_SUMMARY})`

export const FEED_PAGE_SIZE = 60

// Company-name matches for the feed search. PostgREST's `or()` can't filter on a joined table,
// so matching sellers are found first and folded into the lots query as `seller_id.in.(...)`.
export async function findSellerIdsMatching(supabase: Client, q: string | undefined) {
  const term = q ? sanitizeSearch(q) : ''
  if (!term) return []
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .ilike('company_name', `%${term}%`)
    .limit(50)
  return (data ?? []).map((profile) => profile.id)
}

export async function getFeed(supabase: Client, filters: FeedFilters = {}) {
  const sellerIds = await findSellerIdsMatching(supabase, filters.q)
  const filtered = applyFeedFilters(
    // On-hold lots stay in the feed (shown as unclaimable) so buyers can see what's moving.
    supabase.from('lots').select(LOT_WITH_SELLER, { count: 'exact' }).in('status', ['available', 'reserved']),
    filters,
    sellerIds
  )
  const { data, error, count } = await applyFeedSort(filtered, filters.sort).limit(FEED_PAGE_SIZE)
  if (error) throw error
  return { lots: data as unknown as LotWithSeller[], total: count ?? 0 }
}

export async function getLotById(supabase: Client, id: string) {
  const { data, error } = await supabase.from('lots').select(LOT_WITH_SELLER).eq('id', id).single()
  if (error) throw error
  return data as unknown as LotWithSeller
}

// Null when the lot doesn't exist (or isn't a valid id), so the page can 404.
export async function getLotDetail(supabase: Client, id: string) {
  const { data, error } = await supabase
    .from('lots')
    .select(`${LOT_WITH_SELLER}, claims(*, profiles(${PROFILE_SUMMARY}))`)
    .eq('id', id)
    .maybeSingle()
  if (error && error.code !== '22P02') throw error
  return (data as unknown as LotDetail | null) ?? null
}

export async function createLot(supabase: Client, lot: LotInsert) {
  const { data, error } = await supabase.from('lots').insert(lot).select().single()
  if (error) throw error
  return data
}

export async function getMyListings(supabase: Client, sellerId: string) {
  const { data, error } = await supabase
    .from('lots')
    .select(`*, claims(*, profiles(${PROFILE_SUMMARY}))`)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as unknown as LotWithClaims[]
}

export async function getMyClaims(
  supabase: Client,
  buyerId: string,
  { activeOnly = false, limit }: { activeOnly?: boolean; limit?: number } = {}
) {
  let query = supabase
    .from('claims')
    .select(`*, lots(${LOT_WITH_SELLER})`)
    .eq('buyer_id', buyerId)
  // "Active" = waiting on the seller, or accepted and on hold.
  if (activeOnly) query = query.in('status', ['pending', 'confirmed'])

  const ordered = query.order('created_at', { ascending: false })
  const { data, error } = await (limit ? ordered.limit(limit) : ordered)
  if (error) throw error
  return data as unknown as ClaimWithLot[]
}

// Real numbers for the sidebar and bottom tabs. cache(): the layout and the feed page both ask
// within one request.
export const getAppCounts = cache(async (supabase: Client, userId: string) => {
  const head = { count: 'exact' as const, head: true }
  const [available, listings, awaitingYou, claims] = await Promise.all([
    supabase.from('lots').select('id', head).in('status', ['available', 'reserved']),
    supabase.from('lots').select('id', head).eq('seller_id', userId).in('status', ['available', 'reserved']),
    // Requests from buyers waiting on this seller's decision.
    supabase.from('claims').select('id, lots!inner(seller_id)', head).eq('status', 'pending').eq('lots.seller_id', userId),
    // The buyer's own open requests and accepted holds.
    supabase.from('claims').select('id', head).eq('buyer_id', userId).in('status', ['pending', 'confirmed']),
  ])
  return {
    availableLots: available.count ?? 0,
    activeListings: listings.count ?? 0,
    awaitingYou: awaitingYou.count ?? 0,
    activeClaims: claims.count ?? 0,
  }
})

export type AppCounts = Awaited<ReturnType<typeof getAppCounts>>

// ============ SWATCH REQUESTS ============

// Lots this buyer has an open request or hold on, so feed cards don't offer "Claim" twice.
export async function getRequestedLotIds(supabase: Client, buyerId: string) {
  const { data } = await supabase
    .from('claims')
    .select('lot_id')
    .eq('buyer_id', buyerId)
    .in('status', ['pending', 'confirmed'])
  return new Set((data ?? []).map((row) => row.lot_id))
}

export async function getSwatchLotIds(supabase: Client, buyerId: string) {
  const { data } = await supabase.from('swatch_requests').select('lot_id').eq('buyer_id', buyerId)
  return new Set((data ?? []).map((row) => row.lot_id))
}

export async function getSentSwatches(supabase: Client, buyerId: string) {
  const { data, error } = await supabase
    .from('swatch_requests')
    .select(`*, lots(${LOT_WITH_SELLER})`)
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as SwatchWithLot[]
}

export async function getReceivedSwatches(supabase: Client, sellerId: string) {
  const { data, error } = await supabase
    .from('swatch_requests')
    .select(`*, lots!inner(*), profiles(${PROFILE_SUMMARY})`)
    .eq('lots.seller_id', sellerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as SwatchWithBuyer[]
}

// ============ SAVED SEARCHES ============

export const MAX_SAVED_SEARCHES = 8

export type SavedSearchWithCount = Omit<SavedSearch, 'filters'> & {
  filters: FeedFilters
  newCount: number
}

// "N new" = available lots matching the search, posted since the user last opened it, excluding
// their own lots. cache(): shared by the layout's sidebar and the feed's banner.
export const getSavedSearches = cache(async (supabase: Client, userId: string) => {
  const { data, error } = await supabase
    .from('saved_searches')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(MAX_SAVED_SEARCHES)
  if (error) throw error

  return Promise.all(
    (data ?? []).map(async (search): Promise<SavedSearchWithCount> => {
      const filters = parseFeedFilters(search.filters)
      const sellerIds = await findSellerIdsMatching(supabase, filters.q)
      const { count } = await applyFeedFilters(
        supabase
          .from('lots')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'available')
          .neq('seller_id', userId)
          .gt('created_at', search.last_seen_at),
        filters,
        sellerIds
      )
      return { ...search, filters, newCount: count ?? 0 }
    })
  )
})

// ============ CLAIMS ============

export class LotUnavailableError extends Error {
  constructor() {
    super('This lot is no longer available.')
    this.name = 'LotUnavailableError'
  }
}

export class LotOnHoldError extends Error {
  constructor() {
    super('This lot is already on hold for another buyer.')
    this.name = 'LotOnHoldError'
  }
}

export class ClaimNotPendingError extends Error {
  constructor() {
    super('This request has already been answered, withdrawn or has lapsed.')
    this.name = 'ClaimNotPendingError'
  }
}

export type ClaimRequestInput = {
  offerPrice: number | null
  offerQuantity: number | null
  message: string | null
}

// A buyer asks for a lot. The lot stays claimable: several buyers can ask, and the seller picks.
// Claims are unique per (lot, buyer), so asking again after being declined reuses the same row --
// through the admin client, since claims have no UPDATE policy.
export async function requestClaim(
  supabase: Client,
  admin: Client,
  lotId: string,
  buyerId: string,
  input: ClaimRequestInput
) {
  const fields = {
    status: 'pending' as const,
    reserved_until: null,
    responded_at: null,
    offer_price: input.offerPrice,
    offer_quantity: input.offerQuantity,
    message: input.message,
  }

  const { data: previous } = await supabase
    .from('claims')
    .select('id, status')
    .eq('lot_id', lotId)
    .eq('buyer_id', buyerId)
    .maybeSingle()

  if (previous?.status === 'confirmed') throw new LotOnHoldError()

  const { error } = previous
    ? await admin
        .from('claims')
        .update({ ...fields, created_at: new Date().toISOString() })
        .eq('id', previous.id)
    : await supabase.from('claims').insert({ lot_id: lotId, buyer_id: buyerId, ...fields })

  if (error) throw error
}

// Seller accepts one request: that claim gets the 48h hold, the lot goes on hold, and every other
// buyer waiting on this lot is declined rather than left hanging. The `status = 'available'` filter
// and the one_confirmed_claim_per_lot index keep concurrent accepts from double-booking a lot.
export async function acceptClaim(admin: Client, claim: Pick<Claim, 'id' | 'lot_id'>) {
  const now = new Date()
  const reservedUntil = new Date(now.getTime() + CLAIM_WINDOW_HOURS * 60 * 60 * 1000).toISOString()

  const { data, error } = await admin
    .from('claims')
    .update({ status: 'confirmed', reserved_until: reservedUntil, responded_at: now.toISOString() })
    .eq('id', claim.id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()
  if (error) {
    if (error.code === '23505') throw new LotOnHoldError()
    throw error
  }
  if (!data) throw new ClaimNotPendingError()

  const { data: lot, error: lotError } = await admin
    .from('lots')
    .update({ status: 'reserved' })
    .eq('id', claim.lot_id)
    .eq('status', 'available')
    .select('id')
    .maybeSingle()
  if (lotError) throw lotError
  if (!lot) {
    // Lot was sold, withdrawn or already on hold in the meantime -- undo the acceptance.
    await admin
      .from('claims')
      .update({ status: 'pending', reserved_until: null, responded_at: null })
      .eq('id', claim.id)
    throw new LotUnavailableError()
  }

  const { data: alsoDeclined } = await admin
    .from('claims')
    .update({ status: 'cancelled', responded_at: now.toISOString() })
    .eq('lot_id', claim.lot_id)
    .eq('status', 'pending')
    .neq('id', claim.id)
    .select('id, buyer_id')

  return { reservedUntil, alsoDeclined: alsoDeclined ?? [] }
}

// Seller declines a request. The lot is untouched: it was never held by this request.
export async function declineClaim(admin: Client, claim: Pick<Claim, 'id'>) {
  const { data, error } = await admin
    .from('claims')
    .update({ status: 'cancelled', responded_at: new Date().toISOString() })
    .eq('id', claim.id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new ClaimNotPendingError()
}

// Buyer withdraws: a waiting request just closes; giving up an accepted hold also frees the lot.
export async function releaseClaim(admin: Client, claim: Pick<Claim, 'id' | 'lot_id' | 'status'>) {
  const { data, error } = await admin
    .from('claims')
    .update({ status: 'cancelled', responded_at: new Date().toISOString() })
    .eq('id', claim.id)
    .in('status', ['pending', 'confirmed'])
    .select('id')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new ClaimNotPendingError()

  if (claim.status === 'confirmed') {
    const { error: lotError } = await admin
      .from('lots')
      .update({ status: 'available' })
      .eq('id', claim.lot_id)
      .eq('status', 'reserved')
    if (lotError) throw lotError
  }
}
