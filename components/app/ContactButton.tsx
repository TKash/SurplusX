'use client'

import { useState, useTransition } from 'react'
import { revealContactAction } from '@/lib/lots/actions'
import { waLink } from '@/lib/format'

// Buying happens off the platform: this hands over the seller's number and tells them someone took
// it. Once revealed, the number stays visible to that buyer.
export default function ContactButton({
  lotId,
  revealed = false,
  phone: knownPhone = null,
  name: knownName = null,
  variant = 'card',
}: {
  lotId: string
  revealed?: boolean
  phone?: string | null
  name?: string | null
  variant?: 'card' | 'full'
}) {
  const [contact, setContact] = useState<{ phone: string | null; name: string | null } | null>(
    revealed && knownPhone ? { phone: knownPhone, name: knownName } : null
  )
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function reveal() {
    setError(null)
    startTransition(async () => {
      const result = await revealContactAction(lotId)
      if (result.error) setError(result.error)
      else setContact({ phone: result.phone ?? null, name: result.name ?? null })
    })
  }

  if (contact?.phone) {
    const full = variant === 'full'
    return (
      <div className={`flex gap-2 ${full ? 'w-full flex-col sm:flex-row' : ''}`}>
        <a
          href={waLink(contact.phone, "Hi, I saw your lot on SurplusX and I'm interested.")}
          target="_blank"
          rel="noopener noreferrer"
          className={`rounded-lg bg-foreground text-center font-semibold text-background transition-opacity hover:opacity-85 ${
            full ? 'flex-1 rounded-[10px] p-3.5 text-[15px]' : 'px-3.5 py-2 text-[13px]'
          }`}
        >
          WhatsApp{contact.name ? ` ${contact.name.split(' ')[0]}` : ''}
        </a>
        <a
          href={`tel:${contact.phone}`}
          className={`rounded-lg border border-line bg-surface text-center transition-colors hover:border-muted-light ${
            full ? 'flex-1 rounded-[10px] p-3.5 text-[15px]' : 'px-3 py-2 text-[13px]'
          }`}
        >
          {full ? contact.phone : 'Call'}
        </a>
      </div>
    )
  }

  return (
    <span className={`relative inline-flex flex-col ${variant === 'full' ? 'w-full' : ''}`}>
      <button
        type="button"
        onClick={reveal}
        disabled={pending}
        className={`whitespace-nowrap bg-foreground font-semibold text-background transition-opacity hover:opacity-85 disabled:opacity-60 ${
          variant === 'full' ? 'w-full rounded-[10px] p-3.5 text-[15px]' : 'rounded-lg px-3.5 py-2 text-[13px]'
        }`}
      >
        {pending ? 'Opening…' : 'Show contact'}
      </button>
      {error && (
        <span
          role="alert"
          className={
            variant === 'full'
              ? 'mt-2 text-sm text-danger'
              : 'absolute right-0 top-full z-10 mt-1.5 w-52 rounded-lg border border-border bg-surface p-2 text-right text-xs text-danger shadow-sm'
          }
        >
          {error}
        </span>
      )}
    </span>
  )
}
