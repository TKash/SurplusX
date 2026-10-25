'use client'

import { useState, useTransition } from 'react'
import { setVerificationAction } from '@/lib/lots/actions'
import type { VerificationStatus } from '@/types/database.types'

// Staff-only control on /admin/verification: book a visit, write up what was found, publish it.
export default function VerificationForm({
  lotId,
  status,
  notes: initialNotes,
}: {
  lotId: string
  status: VerificationStatus
  notes: string | null
}) {
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit(next: VerificationStatus) {
    setError(null)
    setDone(null)
    startTransition(async () => {
      const result = await setVerificationAction(lotId, next, notes)
      if (result.error) setError(result.error)
      else setDone(next === 'verified' ? 'Published to the listing' : 'Saved')
    })
  }

  return (
    <div className="flex flex-col gap-2.5">
      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="What you found: metreage re-measured, rolls seen, shade groups, faults…"
        className="w-full rounded-[10px] border border-line bg-surface px-3.5 py-2.5 text-[14px] placeholder:text-muted-light focus:border-foreground focus:outline-none"
      />
      <div className="flex flex-wrap items-center gap-2">
        {status !== 'scheduled' && status !== 'verified' && (
          <button
            type="button"
            onClick={() => submit('scheduled')}
            disabled={pending}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-[13px] transition-colors hover:border-muted-light disabled:opacity-60"
          >
            Book visit
          </button>
        )}
        <button
          type="button"
          onClick={() => submit('verified')}
          disabled={pending}
          className="rounded-lg bg-foreground px-3.5 py-2 text-[13px] font-semibold text-background transition-opacity hover:opacity-85 disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Mark verified'}
        </button>
        <button
          type="button"
          onClick={() => submit('none')}
          disabled={pending}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-red-700 transition-colors hover:border-red-300 disabled:opacity-60"
        >
          Close request
        </button>
        {done && <span className="text-[13px] text-ok">{done}</span>}
        {error && (
          <span role="alert" className="text-[13px] text-red-700">
            {error}
          </span>
        )}
      </div>
    </div>
  )
}
