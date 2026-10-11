import { waLink } from '@/lib/format'
import type { Lot, ProfileSummary } from '@/lib/lots/types'
import { lotPrice, lotQuantity, lotTitle } from '@/lib/lots/display'

// After a seller accepts, both sides need to talk. WhatsApp has no API for creating a group or
// adding people -- wa.me links only open a one-to-one chat -- so SurplusX gives each side a direct
// chat link plus a ready-made summary to paste, and tells them how to make a group themselves.

export function dealSummary({
  lot,
  seller,
  buyer,
  offerPrice,
  offerQuantity,
}: {
  lot: Pick<Lot, 'id' | 'title' | 'category' | 'quantity' | 'unit' | 'price_per_unit' | 'currency' | 'location'>
  seller: ProfileSummary | null
  buyer: ProfileSummary | null
  offerPrice?: number | null
  offerQuantity?: number | null
}) {
  const name = (profile: ProfileSummary | null) =>
    profile?.company_name?.trim() || profile?.full_name?.trim() || 'SurplusX user'

  const lines = [
    `SurplusX lot: ${lotTitle(lot)}`,
    `Listed: ${lotQuantity(lot)} at ${lotPrice(lot)}${lot.location ? ` · ${lot.location}` : ''}`,
  ]
  if (offerQuantity || offerPrice) {
    const wanted = offerQuantity ? `${offerQuantity} ${lot.unit}` : 'full lot'
    const at = offerPrice ? ` at ₹${offerPrice}/${lot.unit}` : ''
    lines.push(`Buyer asked for: ${wanted}${at}`)
  }
  lines.push(`Seller: ${name(seller)}${seller?.whatsapp_number ? ` (${seller.whatsapp_number})` : ''}`)
  lines.push(`Buyer: ${name(buyer)}${buyer?.whatsapp_number ? ` (${buyer.whatsapp_number})` : ''}`)
  if (process.env.NEXT_PUBLIC_APP_URL) lines.push(`${process.env.NEXT_PUBLIC_APP_URL}/lots/${lot.id}`)

  return lines.join('\n')
}

// One-to-one chat link, pre-filled with the summary so the first message carries the details.
export function dealChatLink(number: string, summary: string) {
  return waLink(number, summary)
}

export const GROUP_HOWTO =
  'WhatsApp only lets people create groups themselves: open WhatsApp, tap New group, add the other ' +
  'side, then paste the summary as the first message.'
