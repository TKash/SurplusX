import Link from 'next/link'
import { requireProfile } from '@/lib/auth/guards'
import { LOT_CATEGORIES } from '@/lib/lots/categories'
import { VERIFICATION_BLURB } from '@/lib/constants'
import {
  PRICE_BANDS,
  QTY_BANDS,
  SORTS,
  feedHref,
  hasActiveFilters,
  parseFeedFilters,
  searchFilters,
  type FeedFilters,
} from '@/lib/lots/filters'
import { getAppCounts, getFeed, getRevealedLotIds, getSavedSearches } from '@/lib/lots/queries'
import { markSavedSearchSeenAction } from '@/lib/lots/actions'
import LotCard from '@/components/app/LotCard'
import Dropdown, { MenuLink } from '@/components/app/Dropdown'
import SaveSearchButton from '@/components/app/SaveSearchButton'
import SavedSearchLink from '@/components/app/SavedSearchLink'
import ActionButton from '@/components/app/ActionButton'
import { EmptyState, Eyebrow } from '@/components/app/ui'

const FILTER_MENUS = [
  { key: 'qty', label: 'Quantity', bands: QTY_BANDS },
  { key: 'price', label: 'Price', bands: PRICE_BANDS },
] as const

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? 'true' : undefined}
      className={`whitespace-nowrap rounded-full px-4 py-[9px] text-sm transition-colors ${
        active ? 'bg-foreground text-background' : 'border border-line text-ink-soft hover:border-muted-light'
      }`}
    >
      {children}
    </Link>
  )
}

// Keeps the other filters when a new search is submitted.
function HiddenFilters({ filters }: { filters: FeedFilters }) {
  return (
    <>
      {(['category', 'qty', 'price', 'verified', 'sort'] as const).map((key) =>
        filters[key] ? <input key={key} type="hidden" name={key} value={filters[key]} /> : null
      )}
    </>
  )
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { supabase, user } = await requireProfile()
  const filters = parseFeedFilters(await searchParams)

  const [{ lots, total }, revealedLotIds, savedSearches, counts] = await Promise.all([
    getFeed(supabase, filters),
    getRevealedLotIds(supabase, user.id),
    getSavedSearches(supabase, user.id),
    getAppCounts(supabase, user.id),
  ])

  const filtering = hasActiveFilters(filters)
  const currentSearch = searchFilters(filters)
  const alreadySaved = savedSearches.some((search) => feedHref(search.filters) === feedHref(currentSearch))
  const banner = savedSearches.find((search) => search.newCount > 0)
  const alerts = savedSearches.reduce((sum, search) => sum + search.newCount, 0)

  return (
    <main className="flex-1">
      <header className="flex items-center gap-4 border-b border-border bg-background px-4 py-3.5 sm:px-7 sm:py-[18px]">
        <form
          action="/feed"
          role="search"
          className="flex min-w-0 flex-1 items-center gap-3 rounded-[10px] border border-line bg-surface px-4 py-3 focus-within:border-foreground"
        >
          <label htmlFor="feed-search" className="hidden font-mono text-[11px] tracking-[0.08em] text-muted sm:block">
            SEARCH
          </label>
          <input
            key={filters.q ?? ''}
            id="feed-search"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="Fibre, count, GSM, colour, city or mill"
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted"
          />
          <HiddenFilters filters={filters} />
        </form>
        <Link
          href="/my/saved"
          className="hidden items-center gap-2 rounded-[10px] border border-line px-3.5 py-3 text-sm text-ink-soft transition-colors hover:border-muted-light lg:flex"
        >
          Alerts
          {alerts > 0 && (
            <span className="rounded-full bg-accent px-[7px] py-0.5 font-mono text-[11px] text-accent-foreground">
              {alerts}
            </span>
          )}
        </Link>
      </header>

      {banner && (
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-b border-border bg-sand px-4 py-3.5 sm:px-7">
          <p className="text-sm text-ink-soft">
            Your saved search <strong className="font-semibold text-foreground">{banner.name}</strong> has{' '}
            {banner.newCount} new {banner.newCount === 1 ? 'lot' : 'lots'}.
          </p>
          <div className="flex items-center gap-4">
            <SavedSearchLink search={banner} className="border-b border-[#C9C2B2] text-sm font-semibold">
              Show them
            </SavedSearchLink>
            <ActionButton action={markSavedSearchSeenAction.bind(null, banner.id)} label="Dismiss" variant="link" />
          </div>
        </div>
      )}

      <div className="px-4 pt-6 sm:px-7 sm:pt-[26px]">
        <div className="-mx-4 mb-[18px] flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          <Chip href={feedHref(filters, { category: undefined })} active={!filters.category}>
            All lots
          </Chip>
          {LOT_CATEGORIES.map((category) => (
            <Chip key={category} href={feedHref(filters, { category })} active={filters.category === category}>
              {category}
            </Chip>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-[18px]">
          <div className="flex flex-wrap items-center gap-2">
            {FILTER_MENUS.map(({ key, label, bands }) => {
              const current = filters[key]
              return (
                <Dropdown key={key} label={label} value={current ? bands[current].label : 'any'} active={Boolean(current)}>
                  <MenuLink href={feedHref(filters, { [key]: undefined })} active={!current}>
                    Any
                  </MenuLink>
                  {Object.entries(bands).map(([value, band]) => (
                    <MenuLink key={value} href={feedHref(filters, { [key]: value })} active={current === value}>
                      {band.label}
                    </MenuLink>
                  ))}
                </Dropdown>
              )
            })}
            <Link
              href={feedHref(filters, { verified: filters.verified ? undefined : '1' })}
              scroll={false}
              className={`rounded-lg px-3 py-2 text-[13px] transition-colors ${
                filters.verified
                  ? 'border border-foreground bg-sand font-semibold'
                  : 'border border-line text-ink-soft hover:border-muted-light'
              }`}
            >
              ✓ Verified only
            </Link>
            {filters.q && (
              <Link
                href={feedHref(filters, { q: undefined })}
                scroll={false}
                className="flex items-center gap-[7px] rounded-lg border border-foreground bg-sand px-3 py-2 text-[13px] font-semibold"
              >
                “{filters.q}” <span className="font-normal text-muted">✕</span>
              </Link>
            )}
            {filtering && (
              <Link href="/feed" className="px-1 text-[13px] text-muted underline-offset-4 hover:underline">
                Clear all
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4 whitespace-nowrap text-[13px] text-muted">
            <span>
              <strong className="font-semibold text-foreground">{total.toLocaleString('en-IN')}</strong>{' '}
              {total === 1 ? 'lot' : 'lots'}
            </span>
            <Dropdown label={SORTS[filters.sort ?? 'newest']} align="right">
              {Object.entries(SORTS).map(([value, label]) => (
                <MenuLink
                  key={value}
                  href={feedHref(filters, { sort: value })}
                  active={(filters.sort ?? 'newest') === value}
                >
                  {label}
                </MenuLink>
              ))}
            </Dropdown>
          </div>
        </div>
      </div>

      <section className="px-4 pb-2 pt-6 sm:px-7">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2">
          <h2 className="font-display text-[30px] leading-none font-normal">
            {filtering ? 'Matching lots' : 'Fresh off the floor'}
          </h2>
          {filtering &&
            (alreadySaved ? (
              <span className="text-sm text-muted">Saved search</span>
            ) : (
              <SaveSearchButton filters={currentSearch} />
            ))}
        </div>

        {lots.length === 0 ? (
          filtering ? (
            <EmptyState title="Nothing matches yet">
              Try fewer filters, or{' '}
              <Link href="/feed" className="text-foreground underline underline-offset-4">
                see every lot
              </Link>
              . Save this search to hear about new matches.
            </EmptyState>
          ) : (
            <EmptyState title="No lots on the floor yet">
              New surplus shows up here as soon as it’s posted.{' '}
              <Link href="/lots/new" className="text-foreground underline underline-offset-4">
                Post the first lot
              </Link>
              .
            </EmptyState>
          )
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {lots.map((lot) => (
              <LotCard
                key={lot.id}
                lot={lot}
                isOwn={lot.seller_id === user.id}
                revealed={revealedLotIds.has(lot.id)}
              />
            ))}
          </div>
        )}

        {total > lots.length && (
          <p className="mt-5 text-center text-sm text-muted">
            Showing the newest {lots.length} of {total.toLocaleString('en-IN')}. Search or filter to narrow it down.
          </p>
        )}
      </section>

      <div className="px-4 pb-9 pt-[26px] sm:px-7">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-[14px] bg-sand p-5 sm:p-[26px]">
            <Eyebrow className="mb-4">Your stock</Eyebrow>
            {counts.activeListings === 0 ? (
              <p className="text-sm leading-relaxed text-ink-soft">
                Nothing listed yet. Post a lot and buyers call you directly — no bidding, no middleman.
              </p>
            ) : (
              <p className="text-[15px] leading-relaxed text-ink-soft">
                You have <strong className="font-semibold text-foreground">{counts.activeListings}</strong>{' '}
                {counts.activeListings === 1 ? 'lot' : 'lots'} on the feed, and{' '}
                <strong className="font-semibold text-foreground">{counts.interest}</strong>{' '}
                {counts.interest === 1 ? 'buyer has' : 'buyers have'} taken your contact.
              </p>
            )}
            <Link href="/my/listings" className="mt-4 inline-block border-b border-[#C9C2B2] pb-0.5 text-sm">
              My listings
            </Link>
          </section>

          <section className="flex flex-col justify-between rounded-[14px] bg-foreground p-5 text-background sm:p-[26px]">
            <div>
              <div className="mb-3.5 font-mono text-[10px] tracking-[0.1em] text-[rgba(247,244,238,0.6)]">
                SELLING FASTER
              </div>
              <div className="mb-3 font-display text-[27px] leading-[1.15]">Get a lot verified</div>
              <p className="text-sm leading-[1.6] text-[rgba(247,244,238,0.72)]">
                {VERIFICATION_BLURB} Verified lots carry a badge buyers can filter for.
              </p>
            </div>
            <Link
              href="/my/listings"
              className="mt-[22px] block rounded-[10px] bg-accent-bright p-3.5 text-center text-[15px] font-semibold text-foreground transition-opacity hover:opacity-90"
            >
              Ask for a check
            </Link>
          </section>
        </div>
      </div>
    </main>
  )
}
