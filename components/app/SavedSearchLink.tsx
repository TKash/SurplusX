'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { markSavedSearchSeenAction } from '@/lib/lots/actions'
import { feedHref } from '@/lib/lots/filters'
import type { SavedSearchWithCount } from '@/lib/lots/queries'

// Opens the feed with a saved search's filters and resets its "N new" count. Without children it
// renders the sidebar row (name + count).
export default function SavedSearchLink({
  search,
  className,
  children,
  onDark = false,
}: {
  search: SavedSearchWithCount
  className?: string
  children?: React.ReactNode
  onDark?: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const href = feedHref(search.filters)

  return (
    <a
      href={href}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey) return
        event.preventDefault()
        startTransition(async () => {
          if (search.newCount > 0) await markSavedSearchSeenAction(search.id)
          router.push(href)
        })
      }}
      className={`transition-opacity hover:opacity-75 ${pending ? 'opacity-60' : ''} ${
        className ?? 'flex justify-between gap-2'
      }`}
    >
      {children ?? (
        <>
          <span className="min-w-0 truncate">{search.name}</span>
          <span
            className={`shrink-0 font-mono text-[11px] ${
              search.newCount > 0
                ? onDark
                  ? 'text-[oklch(0.8_0.12_145)]'
                  : 'text-ok'
                : onDark
                  ? 'text-[rgba(247,244,238,0.45)]'
                  : 'text-muted'
            }`}
          >
            {search.newCount > 0 ? `${search.newCount} new` : '—'}
          </span>
        </>
      )}
    </a>
  )
}
