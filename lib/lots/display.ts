import type { Lot, ProfileSummary } from './types'
import { attributeSummary } from './categories'

// How a lot reads on cards, rows and the detail page.

const UNIT_SHORT: Record<Lot['unit'], string> = {
  meters: 'm',
  yards: 'yd',
  kg: 'kg',
  tonnes: 't',
  pieces: 'pc',
  rolls: 'roll',
  bales: 'bale',
  cones: 'cone',
  hanks: 'hank',
  cartons: 'carton',
  boxes: 'box',
  gross: 'gross',
  sets: 'set',
}

const number = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 })

export function lotTitle(lot: Pick<Lot, 'title' | 'category'>) {
  const title = lot.title?.trim()
  if (title) return title
  const category = lot.category.trim()
  return `${category.charAt(0).toUpperCase()}${category.slice(1)} lot`
}

// "180 GSM · 150 cm · Ecru" from the category's own fields, falling back to the older fabric
// columns for listings made before categories existed.
export function lotSpecLine(
  lot: Pick<Lot, 'category' | 'attributes' | 'gsm' | 'width_cm' | 'colour' | 'spec'>
) {
  const parts = attributeSummary(lot.category, lot.attributes)
  if (parts.length) return parts.join(' · ')

  const legacy = [lot.gsm && `${lot.gsm} GSM`, lot.width_cm && `${lot.width_cm} cm`, lot.colour?.trim()].filter(
    Boolean
  )
  return legacy.length ? legacy.join(' · ') : lot.spec?.trim() || null
}

// "Anandi Knits · Tirupur": who is selling and where the stock is.
export function lotOrigin(lot: Pick<Lot, 'location'>, seller: ProfileSummary | null) {
  const who = seller?.company_name?.trim() || seller?.full_name?.trim()
  const where = lot.location?.trim() || seller?.city?.trim()
  return [who, where].filter(Boolean).join(' · ') || null
}

export function lotPrice(lot: Pick<Lot, 'price_per_unit' | 'price_unit' | 'currency' | 'unit'>) {
  if (!lot.price_per_unit) return 'Price on request'
  const amount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: lot.currency,
    maximumFractionDigits: 2,
  }).format(lot.price_per_unit)
  return `${amount}/${UNIT_SHORT[lot.price_unit ?? lot.unit]}`
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

// The number a buyer should call: the lot's own contact, or the seller's profile number.
export function lotContact(
  lot: Pick<Lot, 'contact_phone' | 'contact_name'>,
  seller: ProfileSummary | null
) {
  const phone = lot.contact_phone?.trim() || seller?.whatsapp_number?.trim() || null
  const name = lot.contact_name?.trim() || seller?.full_name?.trim() || null
  return { phone, name }
}
