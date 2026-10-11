import type { Lot, ProfileSummary } from './types'

// How a lot reads on cards, rows and the detail page. Structured fields (title, GSM, width,
// colour) are optional, so every helper falls back to the older category/spec text.

const UNIT_SHORT: Record<Lot['unit'], string> = {
  meters: 'm',
  yards: 'yd',
  kg: 'kg',
  pieces: 'pc',
  rolls: 'roll',
}

const number = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 })

export function lotTitle(lot: Pick<Lot, 'title' | 'category'>) {
  const title = lot.title?.trim()
  if (title) return title
  // Older WhatsApp lots stored free-text categories like "cotton".
  const category = lot.category.trim()
  return `${category.charAt(0).toUpperCase()}${category.slice(1)} lot`
}

// "180 GSM · 165 cm · ecru", or the free-text spec when no structured fields were given.
export function lotSpecLine(lot: Pick<Lot, 'gsm' | 'width_cm' | 'colour' | 'spec'>) {
  const parts = [
    lot.gsm && `${lot.gsm} GSM`,
    lot.width_cm && `${lot.width_cm} cm`,
    lot.colour?.trim(),
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : lot.spec?.trim() || null
}

// "Anandi Knits · Tirupur": the seller's business (or name) and where the stock is.
export function lotOrigin(lot: Pick<Lot, 'location'>, seller: ProfileSummary | null) {
  const who = seller?.company_name?.trim() || seller?.full_name?.trim()
  const where = lot.location?.trim() || seller?.city?.trim()
  return [who, where].filter(Boolean).join(' · ') || null
}

export function lotPrice(lot: Pick<Lot, 'price_per_unit' | 'currency' | 'unit'>) {
  const amount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: lot.currency,
    maximumFractionDigits: 2,
  }).format(lot.price_per_unit)
  return `${amount}/${UNIT_SHORT[lot.unit]}`
}

export function lotQuantity(lot: Pick<Lot, 'quantity' | 'unit'>) {
  return `${number.format(lot.quantity)} ${lot.unit}`
}

export function initials(name: string | null | undefined) {
  const letters = (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return letters || '·'
}

export function displayName(profile: ProfileSummary | null) {
  return profile?.company_name?.trim() || profile?.full_name?.trim() || 'Unnamed trader'
}
