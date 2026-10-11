'use client'

import Link from 'next/link'
import { startTransition, useActionState, useRef, useState } from 'react'
import { requestOtp } from '@/lib/auth/actions'
import { OTP_CHANNEL } from '@/lib/auth/otp-channel'
import { Logo } from '@/components/app/ui'
import OtpModal from './OtpModal'

type SendState = { sent?: string; sentAt?: number; error?: string; resendError?: string } | null

// Sign-in screen from the Claude Design "Sign in — phone + OTP" artboard. Step 1 (number) is the
// page; step 2 (code) opens as a modal over it once a code has been sent.
export default function SignInView({
  sentTo,
  quote,
}: {
  sentTo: string | null
  quote: { text: string; attribution: string } | null
}) {
  const [mountedAt] = useState(() => Date.now())
  // Controlled on purpose: React resets uncontrolled fields after a form action succeeds, which
  // would leave "Change" returning to an empty number box.
  const [phoneInput, setPhoneInput] = useState(() => sentTo?.replace(/^\+91/, '') ?? '')
  const [remember, setRemember] = useState(false)
  const [dismissedSentAt, setDismissedSentAt] = useState<number | null>(null)
  const phoneInputRef = useRef<HTMLInputElement>(null)

  const [state, formAction, pending] = useActionState(
    async (previous: SendState, formData: FormData): Promise<SendState> => {
      const result = await requestOtp(previous, formData)
      if (result?.sent) return { sent: result.sent, sentAt: Date.now() }
      // A failed resend keeps the modal open and shows the error there.
      if (formData.get('resend') === '1' && previous?.sent) {
        return { ...previous, resendError: result?.error ?? "Couldn't resend the code." }
      }
      return { error: result?.error }
    },
    sentTo ? { sent: sentTo, sentAt: mountedAt } : null
  )

  const modalOpen = Boolean(state?.sent && state.sentAt !== dismissedSentAt)

  function resend() {
    if (!state?.sent) return
    const formData = new FormData()
    formData.set('phone', state.sent)
    formData.set('resend', '1')
    startTransition(() => formAction(formData))
  }

  function changeNumber() {
    setDismissedSentAt(state?.sentAt ?? null)
    requestAnimationFrame(() => phoneInputRef.current?.focus())
  }

  return (
    <main className="grid min-h-dvh flex-1 bg-foreground text-background lg:grid-cols-2">
      <div className="flex flex-col justify-between gap-12 px-6 py-8 sm:px-12 sm:py-12 lg:px-[72px] lg:py-14">
        <Link href="/" className="self-start">
          <Logo size="lg" />
        </Link>

        <div className="w-full max-w-[420px]">
          <h1 className="mb-3.5 font-display text-[42px] leading-[1.02] font-normal tracking-[-0.02em] sm:text-[52px]">
            Sign in to the exchange
          </h1>
          <p className="mb-8 text-base leading-[1.6] text-[rgba(247,244,238,0.72)]">
            {OTP_CHANNEL === 'whatsapp'
              ? "We'll send a six-digit code to your WhatsApp. No passwords to share around the mill."
              : "We'll text you a six-digit code. No passwords to share around the mill."}
          </p>

          <form action={formAction}>
            <label
              htmlFor="signin-phone"
              className="mb-2.5 block font-mono text-[11px] tracking-[0.1em] text-[rgba(247,244,238,0.6)]"
            >
              MOBILE NUMBER
            </label>
            <div className="mb-[18px] flex gap-2.5">
              <div className="flex items-center rounded-[10px] border border-[rgba(247,244,238,0.22)] bg-[rgba(247,244,238,0.08)] px-3.5 text-base">
                +91
              </div>
              <input
                ref={phoneInputRef}
                id="signin-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="98765 43210"
                maxLength={16}
                required
                value={phoneInput}
                onChange={(event) => setPhoneInput(event.target.value)}
                className="min-w-0 flex-1 rounded-[10px] border border-[rgba(247,244,238,0.3)] bg-[rgba(247,244,238,0.08)] px-4 py-[15px] text-base tracking-[0.04em] text-background outline-none placeholder:text-[rgba(247,244,238,0.4)] focus:border-[rgba(247,244,238,0.7)]"
              />
            </div>
            {state?.error && (
              <p role="alert" className="-mt-2 mb-3.5 text-sm text-[oklch(0.82_0.09_40)]">
                {state.error}
              </p>
            )}
            <button
              type="submit"
              disabled={pending && !modalOpen}
              className="mb-3.5 w-full rounded-[10px] bg-accent-bright p-4 text-base font-semibold text-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {pending && !modalOpen ? 'Sending…' : 'Send me a code'}
            </button>
            <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-[1.6] text-[rgba(247,244,238,0.6)]">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="mt-[3px] h-[15px] w-[15px] shrink-0 accent-[oklch(0.62_0.13_45)]"
              />
              <span>Keep me signed in on this device — for shared mill computers, leave this unchecked.</span>
            </label>
          </form>

          <div className="mt-7 border-t border-[rgba(247,244,238,0.16)] pt-6 text-sm text-[rgba(247,244,238,0.72)]">
            New mill or buyer? Signing in with your number sets up your account.
          </div>
        </div>

        <div className="flex gap-6 text-[13px] text-[rgba(247,244,238,0.72)]">
          <Link href="/terms" className="hover:text-background">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-background">
            Privacy
          </Link>
        </div>
      </div>

      <div className="relative hidden overflow-hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/marketing/signin-mill.jpg"
          alt="Stacked rolls of surplus fabric in a mill warehouse"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(200deg,rgba(30,27,22,0)_30%,rgba(30,27,22,0.72)_100%)]" />
        {quote && (
          <figure className="absolute inset-x-12 bottom-12">
            <blockquote className="mb-3.5 max-w-[460px] font-display text-[30px] leading-[1.25]">
              “{quote.text}”
            </blockquote>
            <figcaption className="text-sm text-[rgba(247,244,238,0.72)]">{quote.attribution}</figcaption>
          </figure>
        )}
      </div>

      {modalOpen && state?.sent && state.sentAt !== undefined && (
        <OtpModal
          key={state.sentAt}
          phone={state.sent}
          sentAt={state.sentAt}
          remember={remember}
          resending={pending}
          resendError={state.resendError}
          onResend={resend}
          onChangeNumber={changeNumber}
        />
      )}
    </main>
  )
}
