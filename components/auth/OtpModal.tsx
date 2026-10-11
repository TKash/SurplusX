'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { verifyOtp } from '@/lib/auth/actions'

const CODE_LENGTH = 6
// Supabase refuses a new code for the same number within 60 seconds.
const RESEND_SECONDS = 60

function formatPhone(e164: string) {
  const match = e164.match(/^\+91(\d{5})(\d{5})$/)
  return match ? `+91 ${match[1]} ${match[2]}` : e164
}

// Step 2 of sign-in. Remounted (via key) on every send, so digits and the countdown reset.
export default function OtpModal({
  phone,
  sentAt,
  remember,
  resending,
  resendError,
  onResend,
  onChangeNumber,
}: {
  phone: string
  sentAt: number
  remember: boolean
  resending: boolean
  resendError?: string
  onResend: () => void
  onChangeNumber: () => void
}) {
  const [state, formAction, pending] = useActionState(verifyOtp, null)
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''))
  const [now, setNow] = useState(sentAt)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputsRef.current[0]?.focus()
    const tick = setInterval(() => setNow(Date.now()), 1000)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      clearInterval(tick)
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onChangeNumber()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onChangeNumber])

  const secondsLeft = Math.max(0, RESEND_SECONDS - Math.floor((now - sentAt) / 1000))

  // Handles typing one digit, and a whole code arriving at once (paste, or iOS/Android one-time-code
  // autofill, which drops the full code into the focused box).
  function fillFrom(index: number, raw: string) {
    const incoming = raw.replace(/\D/g, '')
    const next = [...digits]
    if (incoming.length <= 1) {
      next[index] = incoming
      setDigits(next)
      if (incoming && index < CODE_LENGTH - 1) inputsRef.current[index + 1]?.focus()
      return
    }
    const chars = incoming.slice(0, CODE_LENGTH - index).split('')
    chars.forEach((char, offset) => (next[index + offset] = char))
    setDigits(next)
    inputsRef.current[Math.min(index + chars.length, CODE_LENGTH - 1)]?.focus()
  }

  function onKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) inputsRef.current[index - 1]?.focus()
    if (event.key === 'ArrowLeft' && index > 0) inputsRef.current[index - 1]?.focus()
    if (event.key === 'ArrowRight' && index < CODE_LENGTH - 1) inputsRef.current[index + 1]?.focus()
  }

  const firstEmpty = digits.findIndex((digit) => !digit)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(30,27,22,0.55)] p-3 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onChangeNumber()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="otp-title"
        className="w-full max-w-[380px] rounded-[14px] bg-background p-[26px] text-foreground shadow-[0_20px_50px_rgba(30,27,22,0.3)]"
      >
        <div id="otp-title" className="mb-3.5 font-mono text-[11px] tracking-[0.1em] text-muted">
          STEP 2 — ENTER CODE
        </div>
        <p className="mb-[18px] text-[15px] leading-[1.55] text-ink-soft">
          Sent to <strong className="font-semibold text-foreground">{formatPhone(phone)}</strong>.{' '}
          <button type="button" onClick={onChangeNumber} className="border-b border-[#C9C2B2] text-foreground">
            Change
          </button>
        </p>

        <form action={formAction}>
          <input type="hidden" name="phone" value={phone} />
          <input type="hidden" name="token" value={digits.join('')} />
          <input type="hidden" name="remember" value={remember ? 'on' : ''} />

          <div className="mb-4 flex gap-2" role="group" aria-label="Six-digit code">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputsRef.current[index] = el
                }}
                aria-label={`Digit ${index + 1}`}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                maxLength={index === 0 ? CODE_LENGTH : 1}
                value={digit}
                onChange={(event) => fillFrom(index, event.target.value)}
                onKeyDown={(event) => onKeyDown(index, event)}
                onPaste={(event) => {
                  event.preventDefault()
                  fillFrom(index, event.clipboardData.getData('text'))
                }}
                className={`aspect-square w-full min-w-0 flex-1 rounded-lg border text-center font-mono text-xl outline-none transition-colors ${
                  digit
                    ? 'border-foreground bg-background'
                    : index === firstEmpty
                      ? 'border-accent bg-surface'
                      : 'border-line bg-background'
                } focus:border-accent focus:bg-surface`}
              />
            ))}
          </div>

          {state?.error && (
            <p role="alert" className="mb-3 text-sm text-red-700">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending || digits.some((digit) => !digit)}
            className="mb-3 w-full rounded-[9px] bg-foreground p-3.5 text-[15px] font-semibold text-background transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {pending ? 'Verifying…' : 'Verify and continue'}
          </button>
        </form>

        <div className="text-center text-[13px] text-muted">
          {resendError && (
            <p role="alert" className="mb-1.5 text-red-700">
              {resendError}
            </p>
          )}
          {resending ? (
            'Sending a new code…'
          ) : secondsLeft > 0 ? (
            `Resend in 0:${String(secondsLeft).padStart(2, '0')}`
          ) : (
            <button type="button" onClick={onResend} className="border-b border-[#C9C2B2] text-foreground">
              Resend code
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
