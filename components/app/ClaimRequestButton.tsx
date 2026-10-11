'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { requestClaimAction } from '@/lib/lots/actions'

// "Claim" opens a short form: how much the buyer wants, at what price, and a note. The seller reads
// that before deciding, and the lot only goes on hold once they accept.
export default function ClaimRequestButton({
  lotId,
  lotTitle,
  quantity,
  unit,
  pricePerUnit,
  alreadyRequested = false,
  variant = 'card',
}: {
  lotId: string
  lotTitle: string
  quantity: number
  unit: string
  pricePerUnit: number
  alreadyRequested?: boolean
  variant?: 'card' | 'full'
}) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(requestClaimAction, null)
  const sent = state?.ok === true || alreadyRequested
  const firstFieldRef = useRef<HTMLInputElement>(null)
  // Derived rather than closed from an effect: a sent request dismisses the dialog on the next render.
  const dialogOpen = open && state?.ok !== true

  useEffect(() => {
    if (!dialogOpen) return
    firstFieldRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [dialogOpen])

  const label = sent ? 'Request sent' : variant === 'full' ? 'Claim this lot' : 'Claim lot'
  const buttonClass =
    variant === 'full'
      ? 'w-full rounded-[10px] bg-foreground p-3.5 text-[15px] font-semibold text-background transition-opacity hover:opacity-85 disabled:opacity-60'
      : 'whitespace-nowrap rounded-lg bg-foreground px-3.5 py-2 text-[13px] font-semibold text-background transition-opacity hover:opacity-85 disabled:opacity-60'

  const fieldClass =
    'w-full rounded-[10px] border border-line bg-surface px-3.5 py-2.5 text-[15px] placeholder:text-muted-light focus:border-foreground focus:outline-none'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={sent}
        className={buttonClass}
        title={sent ? 'The seller has your request' : undefined}
      >
        {label}
      </button>

      {dialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(30,27,22,0.55)] p-3 backdrop-blur-[2px] sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="claim-request-title"
            className="w-full max-w-[420px] rounded-[14px] bg-background p-[26px] text-foreground shadow-[0_20px_50px_rgba(30,27,22,0.3)]"
          >
            <div className="mb-1.5 font-mono text-[11px] tracking-[0.1em] text-muted">SEND A REQUEST</div>
            <h2 id="claim-request-title" className="mb-1.5 font-display text-[26px] leading-tight">
              {lotTitle}
            </h2>
            <p className="mb-5 text-sm leading-relaxed text-muted">
              The seller sees your details and decides. If they accept, the lot is held for you for 48
              hours while you agree payment and pickup.
            </p>

            <form action={formAction} className="flex flex-col gap-4">
              <input type="hidden" name="lot_id" value={lotId} />

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-2">
                  <span className="font-mono text-[11px] tracking-[0.08em] text-muted uppercase">
                    Quantity ({unit})
                  </span>
                  <input
                    ref={firstFieldRef}
                    name="offer_quantity"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="1"
                    max={quantity}
                    defaultValue={quantity}
                    className={fieldClass}
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="font-mono text-[11px] tracking-[0.08em] text-muted uppercase">
                    Your price (₹)
                  </span>
                  <input
                    name="offer_price"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="1"
                    defaultValue={pricePerUnit}
                    className={fieldClass}
                  />
                </label>
              </div>

              <label className="flex flex-col gap-2">
                <span className="font-mono text-[11px] tracking-[0.08em] text-muted uppercase">
                  Message to the seller
                </span>
                <textarea
                  name="message"
                  rows={3}
                  maxLength={500}
                  placeholder="When you need it, how you'll collect, anything you want to check."
                  className={fieldClass}
                />
              </label>

              {state?.error && (
                <p role="alert" className="text-sm text-red-700">
                  {state.error}
                </p>
              )}

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-[10px] border border-line bg-surface px-4 py-3 text-[15px] transition-colors hover:border-muted-light"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 rounded-[10px] bg-foreground p-3 text-[15px] font-semibold text-background transition-opacity hover:opacity-85 disabled:opacity-60"
                >
                  {pending ? 'Sending…' : 'Send request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
