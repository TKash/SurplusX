import Link from 'next/link'
import { requireProfile } from '@/lib/auth/guards'
import { MAX_SAVED_SEARCHES, getSavedSearches } from '@/lib/lots/queries'
import { deleteSavedSearchAction } from '@/lib/lots/actions'
import { postedAgo } from '@/lib/lots/time'
import { EmptyState, PageHeader } from '@/components/app/ui'
import SavedSearchLink from '@/components/app/SavedSearchLink'
import ActionButton from '@/components/app/ActionButton'

export default async function SavedSearchesPage() {
  const { supabase, user } = await requireProfile()
  const searches = await getSavedSearches(supabase, user.id)

  return (
    <main className="flex-1">
      <PageHeader
        title="Saved searches"
        description={`Save a search or filter from the feed and we'll count new matching lots for you. Up to ${MAX_SAVED_SEARCHES}.`}
      />

      <div className="px-4 py-6 sm:px-7 sm:py-8">
        {searches.length === 0 ? (
          <EmptyState title="No saved searches">
            <Link href="/feed" className="text-foreground underline underline-offset-4">
              Search or filter the feed
            </Link>
            , then choose <span className="text-foreground">Save this search</span>.
          </EmptyState>
        ) : (
          <ul className="flex max-w-3xl flex-col gap-3">
            {searches.map((search) => (
              <li
                key={search.id}
                className="flex flex-col gap-3 rounded-[14px] border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-semibold">{search.name}</div>
                  <div className="text-[13px] text-muted">
                    {search.newCount > 0 ? (
                      <span className="text-ok">
                        {search.newCount} new {search.newCount === 1 ? 'lot' : 'lots'}
                      </span>
                    ) : (
                      'No new lots'
                    )}{' '}
                    since {postedAgo(search.last_seen_at)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <SavedSearchLink
                    search={search}
                    className="rounded-lg bg-foreground px-3.5 py-2 text-[13px] font-semibold text-background"
                  >
                    Open
                  </SavedSearchLink>
                  <ActionButton action={deleteSavedSearchAction.bind(null, search.id)} label="Remove" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
