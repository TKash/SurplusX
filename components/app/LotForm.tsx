'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LOT_CATEGORIES, LOT_UNITS } from '@/lib/constants'
import PhotoUploader from '@/components/PhotoUploader'

const inputClass =
  'w-full rounded-[10px] border border-line bg-surface px-3.5 py-3 text-[15px] placeholder:text-muted-light focus:border-foreground focus:outline-none'

function Field({
  label,
  hint,
  className = '',
  children,
}: {
  label: string
  hint?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <label className={`flex min-w-0 flex-col gap-2 ${className}`}>
      <span className="font-mono text-[11px] tracking-[0.08em] text-muted uppercase">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[14px] border border-border bg-surface p-4 sm:p-6">
      <h2 className="font-display text-2xl leading-none">{title}</h2>
      {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
      <div className="mt-5 flex flex-col gap-4">{children}</div>
    </section>
  )
}

export default function LotForm() {
  const router = useRouter()
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const form = new FormData(e.currentTarget)
    const body = {
      title: form.get('title'),
      category: form.get('category'),
      gsm: form.get('gsm'),
      width_cm: form.get('width_cm'),
      colour: form.get('colour'),
      spec: form.get('spec'),
      quantity: form.get('quantity'),
      unit: form.get('unit'),
      price_per_unit: form.get('price_per_unit'),
      currency: 'INR',
      location: form.get('location'),
      notes: form.get('notes'),
      urgency_note: form.get('urgency_note'),
      photo_urls: photoUrls,
    }

    try {
      const res = await fetch('/api/lots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Check the highlighted details and try again.')
        return
      }
      router.push(`/lots/${data.lot.id}`)
      router.refresh()
    } catch {
      setError('Network problem. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Section title="Photos" description="Up to 3. Good light and a close-up of the weave help buyers decide.">
        <PhotoUploader onChange={setPhotoUrls} />
      </Section>

      <Section title="What is it?">
        <Field label="Name buyers will see" hint="e.g. Organic cotton jersey, Linen twill">
          <input name="title" maxLength={80} placeholder="Organic cotton jersey" className={inputClass} />
        </Field>
        <Field label="Category">
          <select name="category" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Choose a category
            </option>
            {LOT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="GSM">
            <input name="gsm" type="number" inputMode="numeric" min="1" step="1" placeholder="180" className={inputClass} />
          </Field>
          <Field label="Width (cm)">
            <input name="width_cm" type="number" inputMode="numeric" min="1" step="1" placeholder="150" className={inputClass} />
          </Field>
          <Field label="Colour">
            <input name="colour" maxLength={60} placeholder="Ecru, undyed" className={inputClass} />
          </Field>
        </div>
        <Field label="Other spec" hint="Composition, yarn count, weave, finish">
          <input name="spec" maxLength={160} placeholder="100% cotton, 30s combed, single jersey" className={inputClass} />
        </Field>
      </Section>

      <Section title="Quantity and price">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Quantity">
            <input name="quantity" type="number" inputMode="decimal" step="any" min="0" required placeholder="2000" className={inputClass} />
          </Field>
          <Field label="Unit">
            <select name="unit" required defaultValue="meters" className={inputClass}>
              {LOT_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Price per unit (₹)">
          <input name="price_per_unit" type="number" inputMode="decimal" step="any" min="0" required placeholder="140" className={inputClass} />
        </Field>
      </Section>

      <Section title="Where and when">
        <Field label="Where the stock is">
          <input name="location" maxLength={80} placeholder="Tirupur" className={inputClass} />
        </Field>
        <Field label="Timing" hint="Shown on the listing, e.g. need to clear by Friday">
          <input name="urgency_note" maxLength={80} placeholder="Need to clear by Friday" className={inputClass} />
        </Field>
        <Field label="Notes">
          <textarea name="notes" rows={3} maxLength={1000} placeholder="Anything else a buyer should know" className={inputClass} />
        </Field>
      </Section>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-[10px] bg-foreground p-4 text-base font-semibold text-background transition-opacity hover:opacity-85 disabled:opacity-60 sm:w-auto sm:self-start sm:px-10"
      >
        {submitting ? 'Posting…' : 'Post lot'}
      </button>
    </form>
  )
}
