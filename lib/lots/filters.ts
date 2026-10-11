import { LOT_CATEGORIES } from '@/lib/constants'

// Feed search, filters and sort, shared by the feed page, the filter UI and saved searches (which
// store the same keys). Everything is parsed from URL params and validated against the known
// options, so a hand-edited URL can't inject arbitrary filter values.

export type FeedFilters = {
  q?: string
  category?: string
  qty?: string
  gsm?: string
  price?: string
  sort?: string
}

export type FilterKey = 'q' | 'category' | 'qty' | 'gsm' | 'price'

type Band = { label: string; min: number | null; max: number | null }

export const QTY_BANDS: Record<string, Band> = {
  'under-500': { label: 'Under 500', min: null, max: 500 },
  '500-2000': { label: '500 – 2,000', min: 500, max: 2000 },
  '2000-plus': { label: '2,000+', min: 2000, max: null },
}

export const GSM_BANDS: Record<string, Band> = {
  light: { label: 'Under 120', min: null, max: 120 },
  medium: { label: '120 – 200', min: 120, max: 200 },
  heavy: { label: '200+', min: 200, max: null },
}

export const PRICE_BANDS: Record<string, Band> = {
  'under-100': { label: 'Under ₹100', min: null, max: 100 },
  '100-300': { label: '₹100 – 300', min: 100, max: 300 },
  '300-plus': { label: '₹300+', min: 300, max: null },
}

export const SORTS: Record<string, string> = {
  newest: 'Newest first',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
  'qty-desc': 'Largest lots first',
}

const FILTER_KEYS: FilterKey[] = ['q', 'category', 'qty', 'gsm', 'price']

type RawParams = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined) {
  const v = Array.isArray(value) ? value[0] : value
  return v?.trim() || undefined
}

function oneOf<T extends string>(value: string | undefined, options: readonly T[] | Record<T, unknown>) {
  if (!value) return undefined
  const keys = Array.isArray(options) ? options : Object.keys(options)
  return keys.includes(value) ? value : undefined
}

export function parseFeedFilters(params: RawParams): FeedFilters {
  return {
    q: first(params.q)?.slice(0, 80),
    category: oneOf(first(params.category), LOT_CATEGORIES),
    qty: oneOf(first(params.qty), QTY_BANDS),
    gsm: oneOf(first(params.gsm), GSM_BANDS),
    price: oneOf(first(params.price), PRICE_BANDS),
    sort: oneOf(first(params.sort), SORTS),
  }
}

// The filter part only (no sort): what a saved search stores.
export function searchFilters(filters: FeedFilters): Partial<Record<FilterKey, string>> {
  const out: Partial<Record<FilterKey, string>> = {}
  for (const key of FILTER_KEYS) {
    if (filters[key]) out[key] = filters[key]
  }
  return out
}

export function hasActiveFilters(filters: FeedFilters) {
  return FILTER_KEYS.some((key) => filters[key])
}

export function feedHref(filters: FeedFilters, overrides: Partial<FeedFilters> = {}) {
  const merged = { ...filters, ...overrides }
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(merged)) {
    if (value && !(key === 'sort' && value === 'newest')) params.set(key, value)
  }
  const qs = params.toString()
  return qs ? `/feed?${qs}` : '/feed'
}

// A readable name for a saved search, e.g. `Linen · 200+ GSM · "sage"`.
export function describeFilters(filters: FeedFilters) {
  const parts = [
    filters.category,
    filters.gsm && `${GSM_BANDS[filters.gsm].label} GSM`,
    filters.qty && `${QTY_BANDS[filters.qty].label} qty`,
    filters.price && PRICE_BANDS[filters.price].label,
    filters.q && `“${filters.q}”`,
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : 'All lots'
}

// PostgREST's `or()` takes a comma-separated filter string, so characters that would break that
// syntax (or act as wildcards) are stripped from free-text search.
export function sanitizeSearch(q: string) {
  return q.replace(/[%*,()"\\]/g, ' ').replace(/\s+/g, ' ').trim()
}

// Minimal structural view of the PostgREST filter builder. The real builder's generics make a
// shared helper awkward to type, and it's a thenable, so this must stay synchronous: returning it
// from an async function would execute the query.
type Filterable = {
  eq(column: string, value: unknown): Filterable
  ilike(column: string, pattern: string): Filterable
  gte(column: string, value: unknown): Filterable
  lt(column: string, value: unknown): Filterable
  or(filters: string): Filterable
}

function applyBand(query: Filterable, column: string, band: Band | undefined) {
  if (!band) return query
  let q = query
  if (band.min !== null) q = q.gte(column, band.min)
  if (band.max !== null) q = q.lt(column, band.max)
  return q
}

// `matchingSellerIds`: sellers whose company name matches the search text, looked up beforehand
// (see findSellerIdsMatching) since `or()` can't reach into the joined profile.
export function applyFeedFilters<Q>(query: Q, filters: FeedFilters, matchingSellerIds: string[] = []): Q {
  let q = query as unknown as Filterable

  // ilike without wildcards = case-insensitive exact match: older WhatsApp lots have "cotton", the
  // chips say "Cotton". Category names contain no LIKE wildcards (% or _).
  if (filters.category) q = q.ilike('category', filters.category)
  q = applyBand(q, 'quantity', filters.qty ? QTY_BANDS[filters.qty] : undefined)
  q = applyBand(q, 'gsm', filters.gsm ? GSM_BANDS[filters.gsm] : undefined)
  q = applyBand(q, 'price_per_unit', filters.price ? PRICE_BANDS[filters.price] : undefined)

  const term = filters.q ? sanitizeSearch(filters.q) : ''
  if (term) {
    const like = `%${term}%`
    const clauses = ['title', 'spec', 'category', 'colour', 'location', 'notes'].map(
      (column) => `${column}.ilike.${like}`
    )
    if (matchingSellerIds.length) clauses.push(`seller_id.in.(${matchingSellerIds.join(',')})`)
    q = q.or(clauses.join(','))
  }

  return q as unknown as Q
}

type Orderable = { order(column: string, options: { ascending: boolean; nullsFirst?: boolean }): Orderable }

export function applyFeedSort<Q>(query: Q, sort: string | undefined): Q {
  // Available before on-hold in every sort (the lot_status enum lists 'available' first), so lots a
  // buyer can actually claim lead the feed.
  const q = (query as unknown as Orderable).order('status', { ascending: true })
  const ordered =
    sort === 'price-asc'
      ? q.order('price_per_unit', { ascending: true })
      : sort === 'price-desc'
        ? q.order('price_per_unit', { ascending: false })
        : sort === 'qty-desc'
          ? q.order('quantity', { ascending: false })
          : q
  return ordered.order('created_at', { ascending: false }) as unknown as Q
}
