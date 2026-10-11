'use client'

import { useState, useTransition } from 'react'
import { requestSwatchAction } from '@/lib/lots/actions'

// Asks the seller for a physical sample; they get the buyer's WhatsApp contact to arrange it.
export default function SwatchButton({
  lotId,
  requested,
  variant = 'card',
}: {
  lotId: string
  requested: boolean
  variant?: 'card' | 'full'
}) {
  const [done, setDone] = useState(requested)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function request() {
    setError(null)
    startTransition(async () => {
      const result = await requestSwatchAction(lotId)
      if (result.error) setError(result.error)
      else setDone(true)
    })
  }

  const label = done
    ? variant === 'full'
      ? 'Swatch requested'
      : 'Requested'
    : pending
      ? 'Asking…'
      : variant === 'full'
        ? 'Request a swatch'
        : 'Swatch'

  return (
    <span className={`relative inline-flex flex-col ${variant === 'full' ? 'w-full' : ''}`}>
      <button
        type="button"
        onClick={request}
        disabled={done || pending}
        title={done ? 'The seller has your contact to arrange a sample' : 'Ask the seller for a sample'}
        className={`whitespace-nowrap border border-line bg-surface transition-colors hover:border-muted-light disabled:cursor-default ${
          variant === 'full'
            ? 'w-full rounded-[10px] p-3.5 text-[15px]'
            : 'rounded-lg px-3 py-2 text-[13px]'
        } ${done ? 'text-muted' : 'text-foreground'}`}
      >
        {label}
      </button>
      {error && (
        <span
          role="alert"
          className={
            variant === 'full'
              ? 'mt-2 text-sm text-red-700'
              : 'absolute right-0 top-full z-10 mt-1.5 w-52 rounded-lg border border-border bg-surface p-2 text-right text-xs text-red-700 shadow-sm'
          }
        >
          {error}
        </span>
      )}
    </span>
  )
}
