'use client'

import { useState, useTransition } from 'react'
import type { ActionResult } from '@/lib/lots/actions'

const VARIANTS = {
  dark: 'rounded-lg bg-foreground px-3.5 py-2 text-[13px] font-semibold text-background hover:opacity-85',
  plain: 'rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-foreground hover:border-muted-light',
  danger: 'rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-red-700 hover:border-red-300',
  link: 'text-sm text-muted hover:text-foreground',
}

// Runs a (bound) server action from a button, with a pending label, an optional "are you sure"
// prompt, and the action's error shown underneath. Success needs no UI: the actions revalidate,
// so the page re-renders with the new state.
export default function ActionButton({
  action,
  label,
  pendingLabel,
  confirm,
  variant = 'plain',
  block = false,
}: {
  action: () => Promise<ActionResult>
  label: string
  pendingLabel?: string
  confirm?: string
  variant?: keyof typeof VARIANTS
  block?: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <span className={`inline-flex flex-col ${block ? 'w-full' : ''}`}>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return
          setError(null)
          startTransition(async () => {
            const result = await action()
            if (result.error) setError(result.error)
          })
        }}
        className={`whitespace-nowrap transition disabled:opacity-60 ${VARIANTS[variant]} ${
          block ? 'w-full py-3 text-[15px]' : ''
        }`}
      >
        {pending ? (pendingLabel ?? `${label}…`) : label}
      </button>
      {error && (
        <span role="alert" className="mt-1.5 max-w-64 text-xs text-red-700">
          {error}
        </span>
      )}
    </span>
  )
}
