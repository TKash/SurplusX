'use client'

import { useActionState } from 'react'
import { completeOnboarding } from '@/lib/auth/actions'

const inputClass =
  'w-full rounded-[10px] border border-line bg-surface px-3.5 py-3 text-[15px] placeholder:text-muted-light focus:border-foreground focus:outline-none'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono text-[11px] tracking-[0.08em] text-muted uppercase">{label}</span>
      {children}
    </label>
  )
}

export default function OnboardingForm({ defaultWhatsApp }: { defaultWhatsApp: string }) {
  const [state, formAction, pending] = useActionState(completeOnboarding, null)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Your name">
        <input name="full_name" required autoComplete="name" placeholder="Your full name" className={inputClass} />
      </Field>
      <Field label="Business name (optional)">
        <input name="company_name" autoComplete="organization" placeholder="Your mill or trading firm" className={inputClass} />
      </Field>
      <Field label="City">
        <input name="city" autoComplete="address-level2" placeholder="Tirupur" className={inputClass} />
      </Field>
      <Field label="WhatsApp number">
        <input
          name="whatsapp_number"
          type="tel"
          inputMode="tel"
          defaultValue={defaultWhatsApp}
          placeholder="+919876543210"
          className={inputClass}
        />
      </Field>
      <Field label="You mostly">
        <select name="role" defaultValue="both" className={inputClass}>
          <option value="both">Buy and sell</option>
          <option value="seller">Sell</option>
          <option value="buyer">Buy</option>
        </select>
      </Field>
      {state?.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-full rounded-[10px] bg-foreground p-3.5 text-[15px] font-semibold text-background transition-opacity hover:opacity-85 disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Continue to the exchange'}
      </button>
    </form>
  )
}
