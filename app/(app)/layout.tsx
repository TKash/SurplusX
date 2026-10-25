import Link from 'next/link'
import { requireProfile } from '@/lib/auth/guards'
import { signOut } from '@/lib/auth/actions'
import { getAppCounts, getSavedSearches } from '@/lib/lots/queries'
import { displayName, initials } from '@/lib/lots/display'
import SidebarNav from '@/components/app/SidebarNav'
import MobileTabBar from '@/components/app/MobileTabBar'
import SavedSearchLink from '@/components/app/SavedSearchLink'
import { Logo } from '@/components/app/ui'

const ROLE_LABEL = { both: 'Seller & buyer', seller: 'Seller', buyer: 'Buyer' } as const

// Signed-in shell from the "App home" design: sand sidebar on desktop; on phones a slim top bar
// plus a bottom tab bar, since a 248px sidebar doesn't fit.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, profile } = await requireProfile()
  const [counts, savedSearches] = await Promise.all([
    getAppCounts(supabase, user.id),
    getSavedSearches(supabase, user.id),
  ])
  const name = displayName(profile)
  const newAcrossSaved = savedSearches.reduce((sum, search) => sum + search.newCount, 0)

  return (
    <div className="flex min-h-dvh flex-1 bg-background text-foreground">
      {/* Dark ink sidebar with light content, so navigation reads as separate from the paper-toned page. */}
      <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col gap-[26px] overflow-y-auto bg-foreground px-[18px] py-6 text-background [color-scheme:dark] lg:flex">
        <Link href="/feed" className="px-2">
          <Logo tone="light" />
        </Link>

        <SidebarNav counts={counts} isAdmin={profile.is_admin} />

        <Link
          href="/lots/new"
          className="flex items-center justify-center gap-2 rounded-[10px] bg-accent-bright p-[13px] text-[15px] font-semibold text-foreground transition-opacity hover:opacity-90"
        >
          + Post a lot
        </Link>

        <div className="border-t border-[rgba(247,244,238,0.12)] pt-5">
          <div className="mb-3 flex items-center justify-between font-mono text-[10px] tracking-[0.1em] text-[rgba(247,244,238,0.5)]">
            SAVED SEARCHES
            <Link href="/my/saved" className="tracking-normal transition-colors hover:text-background">
              Manage
            </Link>
          </div>
          {savedSearches.length === 0 ? (
            <p className="text-[13px] leading-relaxed text-[rgba(247,244,238,0.6)]">
              Search or filter the feed, then save it to see new matching lots here.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5 text-sm text-[rgba(247,244,238,0.8)]">
              {savedSearches.slice(0, 4).map((search) => (
                <SavedSearchLink key={search.id} search={search} onDark />
              ))}
            </div>
          )}
        </div>

        <div className="mt-auto flex items-center gap-2.5 border-t border-[rgba(247,244,238,0.12)] pt-[18px]">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(247,244,238,0.12)] text-[13px] font-semibold text-background">
            {initials(name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{name}</div>
            <div className="text-xs text-[rgba(247,244,238,0.55)]">{ROLE_LABEL[profile.role]}</div>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="text-xs text-[rgba(247,244,238,0.55)] transition-colors hover:text-background"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-[calc(68px+env(safe-area-inset-bottom))] lg:pb-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
          <Link href="/feed">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/my/saved"
              className="flex items-center gap-1.5 rounded-[10px] border border-line px-3 py-2 text-[13px] text-ink-soft"
            >
              Saved
              {newAcrossSaved > 0 && (
                <span className="rounded-full bg-accent px-1.5 py-px font-mono text-[10px] text-accent-foreground">
                  {newAcrossSaved}
                </span>
              )}
            </Link>
            <details className="relative">
              <summary
                aria-label="Account"
                className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full bg-line text-[13px] font-semibold text-ink-soft [&::-webkit-details-marker]:hidden"
              >
                {initials(name)}
              </summary>
              <div className="absolute right-0 top-11 w-56 rounded-xl border border-border bg-surface p-3 shadow-[0_16px_40px_-20px_rgba(30,27,22,0.35)]">
                <div className="truncate text-sm font-semibold">{name}</div>
                <div className="mb-3 text-xs text-muted">{ROLE_LABEL[profile.role]}</div>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="w-full rounded-lg border border-line px-3 py-2 text-left text-sm text-ink-soft"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </details>
          </div>
        </header>

        {children}
      </div>

      <MobileTabBar counts={counts} isAdmin={profile.is_admin} />
    </div>
  )
}
