'use client'

import { useState, useTransition } from 'react'
import { saveSearchAction } from '@/lib/lots/actions'

export default function SaveSearchButton({ filters }: { filters: Record<string, string | undefined> }) {
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        disabled={pending || saved}
        onClick={() => {
          setError(null)
          startTransition(async () => {
            const result = await saveSearchAction(filters)
            if (result.error) setError(result.error)
            else setSaved(true)
          })
        }}
        className="border-b border-[#C9C2B2] pb-0.5 text-sm transition-opacity hover:opacity-75 disabled:opacity-70"
      >
        {saved ? 'Saved — new matches will show in your sidebar' : pending ? 'Saving…' : 'Save this search'}
      </button>
      {error && (
        <span role="alert" className="mt-1 text-xs text-danger">
          {error}
        </span>
      )}
    </span>
  )
}
