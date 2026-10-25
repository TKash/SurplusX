'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORY_SPECS, LOT_CATEGORIES, type LotCategory } from '@/lib/lots/categories'
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

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[14px] border border-border bg-surface p-4 sm:p-6">
      <h2 className="font-display text-2xl leading-none">{title}</h2>
      {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
      <div className="mt-5 flex flex-col gap-4">{children}</div>
    </section>
  )
}

type CustomRow = { label: string; value: string }

export default function LotForm({ defaultContact }: { defaultContact: string }) {
  const router = useRouter()
  const [category, setCategory] = useState<LotCategory>('Fabrics')
  const [attributes, setAttributes] = useState<Record<string, string>>({})
  const [custom, setCustom] = useState<CustomRow[]>([{ label: '', value: '' }])
  const [priceOnRequest, setPriceOnRequest] = useState(false)
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const spec = CATEGORY_SPECS[category]
  // Switching category keeps only the fields the new one also has (composition, colour...).
  const visibleAttributes = useMemo(() => {
    const keys = new Set(spec.fields.map((field) => field.key))
    return Object.fromEntries(Object.entries(attributes).filter(([key]) => keys.has(key)))
  }, [attributes, spec])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const form = new FormData(event.currentTarget)
    const merged: Record<string, string> = { ...visibleAttributes }
    for (const row of custom) {
      const label = row.label.trim()
      if (label && row.value.trim()) merged[label.toLowerCase().replace(/\s+/g, '_')] = row.value.trim()
    }

    const body = {
      category,
      title: form.get('title'),
      attributes: merged,
      quantity: form.get('quantity'),
      unit: form.get('unit'),
      price_per_unit: priceOnRequest ? null : form.get('price_per_unit'),
      price_unit: priceOnRequest ? null : form.get('price_unit'),
      currency: 'INR',
      location: form.get('location'),
      contact_phone: form.get('contact_phone'),
      contact_name: form.get('contact_name'),
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
        setError(
          typeof data.error === 'string' ? data.error : 'Check the highlighted details and try again.'
        )
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
      <Section title="What are you selling?">
        <Field label="Category">
          <div className="flex flex-wrap gap-2">
            {LOT_CATEGORIES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setCategory(option)}
                aria-pressed={category === option}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  category === option
                    ? 'bg-foreground text-background'
                    : 'border border-line text-ink-soft hover:border-muted-light'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </Field>
        <p className="-mt-1 text-sm text-muted">{spec.blurb}</p>
        <Field label="Name buyers will see" hint="Optional, but it helps a lot">
          <input name="title" maxLength={80} placeholder={spec.titlePlaceholder} className={inputClass} />
        </Field>
      </Section>

      <Section title="Photos" description="Up to 3. Natural light and a close-up of the goods help buyers decide.">
        <PhotoUploader onChange={setPhotoUrls} />
      </Section>

      <Section title="Quantity and price">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Quantity">
            <input
              name="quantity"
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              required
              placeholder="2000"
              className={inputClass}
            />
          </Field>
          <Field label="Measured in">
            <select name="unit" required defaultValue={spec.units[0]} key={category} className={inputClass}>
              {spec.units.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <label className="flex items-center gap-2.5 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={priceOnRequest}
            onChange={(event) => setPriceOnRequest(event.target.checked)}
            className="h-4 w-4 accent-[oklch(0.55_0.11_45)]"
          />
          Price on request — buyers ask you directly
        </label>

        {!priceOnRequest && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price (₹)">
              <input
                name="price_per_unit"
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                placeholder="140"
                className={inputClass}
              />
            </Field>
            <Field label="Per">
              <select name="price_unit" defaultValue={spec.priceUnits[0]} key={`price-${category}`} className={inputClass}>
                {spec.priceUnits.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}
      </Section>

      <Section
        title="Details"
        description="All optional — fill in what you know. Buyers filter and search on these."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {spec.fields.map((field) => (
            <Field key={field.key} label={field.label} hint={field.hint}>
              {field.type === 'select' ? (
                <select
                  value={visibleAttributes[field.key] ?? ''}
                  onChange={(event) =>
                    setAttributes((prev) => ({ ...prev, [field.key]: event.target.value }))
                  }
                  className={inputClass}
                >
                  <option value="">—</option>
                  {field.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : 'text'}
                  inputMode={field.type === 'number' ? 'decimal' : undefined}
                  step={field.type === 'number' ? 'any' : undefined}
                  min={field.type === 'number' ? '0' : undefined}
                  value={visibleAttributes[field.key] ?? ''}
                  onChange={(event) =>
                    setAttributes((prev) => ({ ...prev, [field.key]: event.target.value }))
                  }
                  placeholder={field.placeholder ?? (field.suffix ? field.suffix : '')}
                  maxLength={field.type === 'text' ? 200 : undefined}
                  className={inputClass}
                />
              )}
            </Field>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <span className="font-mono text-[11px] tracking-[0.08em] text-muted uppercase">
            Anything else worth listing
          </span>
          {custom.map((row, index) => (
            <div key={index} className="grid grid-cols-2 gap-3">
              <input
                value={row.label}
                onChange={(event) =>
                  setCustom((prev) => prev.map((r, i) => (i === index ? { ...r, label: event.target.value } : r)))
                }
                placeholder="Detail"
                maxLength={40}
                className={inputClass}
              />
              <input
                value={row.value}
                onChange={(event) => {
                  const value = event.target.value
                  setCustom((prev) => {
                    const next = prev.map((r, i) => (i === index ? { ...r, value } : r))
                    // Keep one empty row at the end so a seller can keep adding.
                    const last = next[next.length - 1]
                    if (last.label.trim() || last.value.trim()) next.push({ label: '', value: '' })
                    return next.slice(0, 6)
                  })
                }}
                placeholder="Value"
                maxLength={200}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Where it is and who to call" description="Buyers contact you directly — no middleman.">
        <Field label="Where the stock is">
          <input name="location" maxLength={80} placeholder="Tirupur" className={inputClass} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Contact number" hint="WhatsApp preferred">
            <input
              name="contact_phone"
              type="tel"
              inputMode="tel"
              required
              defaultValue={defaultContact}
              placeholder="+919876543210"
              className={inputClass}
            />
          </Field>
          <Field label="Ask for (optional)">
            <input name="contact_name" maxLength={60} placeholder="Name on the floor" className={inputClass} />
          </Field>
        </div>
        <Field label="Timing" hint="Shown on the listing, e.g. need to clear by Friday">
          <input name="urgency_note" maxLength={80} placeholder="Need to clear by Friday" className={inputClass} />
        </Field>
        <Field label="Notes">
          <textarea
            name="notes"
            rows={3}
            maxLength={1000}
            placeholder="Anything else a buyer should know"
            className={inputClass}
          />
        </Field>
      </Section>

      {error && (
        <p role="alert" className="text-sm text-danger">
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
