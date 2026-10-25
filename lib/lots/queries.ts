import { cache } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type {
  ContactViewWithBuyer,
  LotInsert,
  LotWithInterest,
  LotWithSeller,
  SavedSearch,
} from './types'
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
    supabase.from('lots').select(LOT_WITH_SELLER, { count: 'exact' }).eq('status', 'available'),
    filters,
    sellerIds
  )
  const { data, error, count } = await applyFeedSort(filtered, filters.sort).limit(FEED_PAGE_SIZE)
  if (error) throw error
  return { lots: data as unknown as LotWithSeller[], total: count ?? 0 }
}

// Null when the lot doesn't exist (or isn't a valid id), so the page can 404.
export async function getLotDetail(supabase: Client, id: string) {
  const { data, error } = await supabase.from('lots').select(LOT_WITH_SELLER).eq('id', id).maybeSingle()
  if (error && error.code !== '22P02') throw error
  return (data as unknown as LotWithSeller | null) ?? null
}

export async function createLot(supabase: Client, lot: LotInsert) {
  const { data, error } = await supabase.from('lots').insert(lot).select().single()
  if (error) throw error
  return data
}

// Seller's own lots, each with a count of how many buyers asked for the contact.
export async function getMyListings(supabase: Client, sellerId: string) {
  const { data, error } = await supabase
    .from('lots')
    .select('*, contact_views(count)')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as unknown as LotWithInterest[]
}

// Who asked for the contact on one of my lots.
export async function getLotInterest(supabase: Client, lotId: string) {
  const { data, error } = await supabase
    .from('contact_views')
    .select(`*, profiles(${PROFILE_SUMMARY})`)
    .eq('lot_id', lotId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as ContactViewWithBuyer[]
}

// Lots whose contact this buyer has already revealed, so the feed can show it straight away.
export async function getRevealedLotIds(supabase: Client, viewerId: string) {
  const { data } = await supabase.from('contact_views').select('lot_id').eq('viewer_id', viewerId)
  return new Set((data ?? []).map((row) => row.lot_id))
}

// Real numbers for the sidebar and bottom tabs. cache(): the layout and the page both ask within
// one request.
export const getAppCounts = cache(async (supabase: Client, userId: string) => {
  const head = { count: 'exact' as const, head: true }
  const [available, listings, interest, verification] = await Promise.all([
    supabase.from('lots').select('id', head).eq('status', 'available'),
    supabase.from('lots').select('id', head).eq('seller_id', userId).eq('status', 'available'),
    supabase.from('contact_views').select('id, lots!inner(seller_id)', head).eq('lots.seller_id', userId),
    supabase
      .from('lots')
      .select('id', head)
      .eq('seller_id', userId)
      .in('verification', ['requested', 'scheduled']),
  ])
  return {
    availableLots: available.count ?? 0,
    activeListings: listings.count ?? 0,
    interest: interest.count ?? 0,
    verificationPending: verification.count ?? 0,
  }
})

export type AppCounts = Awaited<ReturnType<typeof getAppCounts>>

// ============ VERIFICATION (admin) ============

// Lots waiting for someone to go and check them, oldest request first.
export async function getVerificationQueue(supabase: Client) {
  const { data, error } = await supabase
    .from('lots')
    .select(LOT_WITH_SELLER)
    .in('verification', ['requested', 'scheduled'])
    .order('verification_requested_at', { ascending: true })
  if (error) throw error
  return data as unknown as LotWithSeller[]
}

export async function getRecentlyVerified(supabase: Client, limit = 10) {
  const { data, error } = await supabase
    .from('lots')
    .select(LOT_WITH_SELLER)
    .eq('verification', 'verified')
    .order('verified_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data as unknown as LotWithSeller[]
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
