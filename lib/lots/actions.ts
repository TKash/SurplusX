'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWhatsAppMessage } from '@/lib/whatsapp/twilio'
import { dealChatLink, dealSummary } from '@/lib/whatsapp/group'
import { waLink } from '@/lib/format'
import {
  ClaimNotPendingError,
  LotOnHoldError,
  LotUnavailableError,
  MAX_SAVED_SEARCHES,
  acceptClaim,
  declineClaim,
  releaseClaim,
  requestClaim,
} from './queries'
import { describeFilters, hasActiveFilters, parseFeedFilters, searchFilters } from './filters'
import { displayName, lotPrice, lotQuantity, lotTitle } from './display'
import type { Claim, Lot, ProfileSummary } from './types'

// Seller/buyer actions behind the app's buttons. Each one re-checks who's asking: server actions
// are public endpoints, so a claim or lot id from the client proves nothing on its own.

export type ActionResult = { ok?: true; error?: string }

type LotForAction = Pick<
  Lot,
  | 'id'
  | 'seller_id'
  | 'title'
  | 'category'
  | 'quantity'
  | 'unit'
  | 'price_per_unit'
  | 'currency'
  | 'location'
  | 'status'
>

type ClaimForAction = Claim & {
  lots: LotForAction | null
  profiles: ProfileSummary | null
}

const LOT_FIELDS =
  'id, seller_id, title, category, quantity, unit, price_per_unit, currency, location, status'
const PROFILE_FIELDS = 'full_name, company_name, city, whatsapp_number'

const SIGNED_OUT: ActionResult = { error: 'Your session ended. Please sign in again.' }

async function session() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

// Counts in the sidebar and the lists on every app page depend on these changes.
function refreshApp() {
  revalidatePath('/', 'layout')
}

type ServerClient = Awaited<ReturnType<typeof createClient>>

async function loadClaim(supabase: ServerClient, claimId: string) {
  const { data } = await supabase
    .from('claims')
    .select(`*, lots(${LOT_FIELDS}), profiles(${PROFILE_FIELDS})`)
    .eq('id', claimId)
    .maybeSingle()
  return data as unknown as ClaimForAction | null
}

async function loadLot(supabase: ServerClient, lotId: string) {
  const { data } = await supabase
    .from('lots')
    .select(`${LOT_FIELDS}, profiles(${PROFILE_FIELDS})`)
    .eq('id', lotId)
    .maybeSingle()
  return data as unknown as (LotForAction & { profiles: ProfileSummary | null }) | null
}

async function loadProfile(supabase: ServerClient, userId: string) {
  const { data } = await supabase.from('profiles').select(PROFILE_FIELDS).eq('id', userId).maybeSingle()
  return data as ProfileSummary | null
}

function failure(err: unknown, fallback: string): ActionResult {
  if (
    err instanceof ClaimNotPendingError ||
    err instanceof LotOnHoldError ||
    err instanceof LotUnavailableError
  ) {
    return { error: err.message }
  }
  console.error(fallback, err)
  return { error: fallback }
}

// "1,000 meters at ₹390/meters", falling back to the lot's own quantity and price.
function describeOffer(claim: Pick<Claim, 'offer_price' | 'offer_quantity'>, lot: LotForAction) {
  const quantity = claim.offer_quantity ? `${claim.offer_quantity} ${lot.unit}` : lotQuantity(lot)
  const price = claim.offer_price ? `₹${claim.offer_price}/${lot.unit}` : lotPrice(lot)
  return `${quantity} at ${price}`
}

function optionalNumber(value: FormDataEntryValue | null) {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

// ============ BUYER: request a lot ============

export async function requestClaimAction(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await session()
  if (!user) return SIGNED_OUT

  const lotId = String(formData.get('lot_id') || '')
  const offerPrice = optionalNumber(formData.get('offer_price'))
  const offerQuantity = optionalNumber(formData.get('offer_quantity'))
  const message = String(formData.get('message') || '')
    .trim()
    .slice(0, 500) || null

  const lot = await loadLot(supabase, lotId)
  if (!lot) return { error: 'Lot not found.' }
  if (lot.seller_id === user.id) return { error: 'This is your own lot.' }
  if (lot.status !== 'available') return { error: 'This lot is on hold or no longer available.' }
  if (offerQuantity && offerQuantity > lot.quantity) {
    return { error: `The seller has ${lotQuantity(lot)} in this lot.` }
  }

  const buyer = await loadProfile(supabase, user.id)
  if (!buyer) return { error: 'Complete your profile before requesting a lot.' }

  try {
    await requestClaim(supabase, createAdminClient(), lotId, user.id, {
      offerPrice,
      offerQuantity,
      message,
    })
  } catch (err) {
    return failure(err, 'Could not send your request.')
  }

  if (lot.profiles?.whatsapp_number) {
    const contact = buyer.whatsapp_number ? `\n${waLink(buyer.whatsapp_number)}` : ''
    await sendWhatsAppMessage(
      lot.profiles.whatsapp_number,
      `${displayName(buyer)}${buyer.city ? `, ${buyer.city}` : ''} wants your ${lotTitle(lot)} lot: ` +
        `${describeOffer({ offer_price: offerPrice, offer_quantity: offerQuantity }, lot)}.` +
        (message ? `\n"${message}"` : '') +
        `\nAccept or decline: ${process.env.NEXT_PUBLIC_APP_URL}/my/listings${contact}`
    )
  }

  refreshApp()
  return { ok: true }
}

// ============ SELLER: answer requests ============

export async function acceptClaimAction(claimId: string): Promise<ActionResult> {
  const { supabase, user } = await session()
  if (!user) return SIGNED_OUT

  const claim = await loadClaim(supabase, claimId)
  if (!claim?.lots || claim.lots.seller_id !== user.id) return { error: 'Request not found.' }
  const lot = claim.lots

  let alsoDeclined: { id: string; buyer_id: string }[] = []
  try {
    const result = await acceptClaim(createAdminClient(), claim)
    alsoDeclined = result.alsoDeclined
  } catch (err) {
    return failure(err, 'Could not accept this request.')
  }

  const seller = await loadProfile(supabase, user.id)
  const summary = dealSummary({
    lot,
    seller,
    buyer: claim.profiles,
    offerPrice: claim.offer_price,
    offerQuantity: claim.offer_quantity,
  })

  if (claim.profiles?.whatsapp_number) {
    const chat = seller?.whatsapp_number ? `\n${dealChatLink(seller.whatsapp_number, summary)}` : ''
    await sendWhatsAppMessage(
      claim.profiles.whatsapp_number,
      `${displayName(seller)} accepted your request for ${lotTitle(lot)}. It's on hold for you for ` +
        `48 hours while you agree payment and pickup.${chat}`
    )
  }

  // Everyone else waiting on this lot hears now, instead of being left guessing.
  if (alsoDeclined.length > 0) {
    const { data: others } = await supabase
      .from('profiles')
      .select('id, whatsapp_number')
      .in(
        'id',
        alsoDeclined.map((row) => row.buyer_id)
      )
    for (const other of (others ?? []) as { id: string; whatsapp_number: string | null }[]) {
      if (!other.whatsapp_number) continue
      await sendWhatsAppMessage(
        other.whatsapp_number,
        `Your request for ${lotTitle(lot)} wasn't taken up -- the seller accepted another buyer. ` +
          `More lots: ${process.env.NEXT_PUBLIC_APP_URL}/feed`
      )
    }
  }

  refreshApp()
  return { ok: true }
}

export async function declineClaimAction(claimId: string): Promise<ActionResult> {
  const { supabase, user } = await session()
  if (!user) return SIGNED_OUT

  const claim = await loadClaim(supabase, claimId)
  if (!claim?.lots || claim.lots.seller_id !== user.id) return { error: 'Request not found.' }

  try {
    await declineClaim(createAdminClient(), claim)
  } catch (err) {
    return failure(err, 'Could not decline this request.')
  }

  if (claim.profiles?.whatsapp_number) {
    await sendWhatsAppMessage(
      claim.profiles.whatsapp_number,
      `The seller couldn't go ahead with your request for ${lotTitle(claim.lots)}. ` +
        `More lots: ${process.env.NEXT_PUBLIC_APP_URL}/feed`
    )
  }

  refreshApp()
  return { ok: true }
}

// ============ BUYER: withdraw a request or an accepted hold ============

export async function cancelClaimAction(claimId: string): Promise<ActionResult> {
  const { supabase, user } = await session()
  if (!user) return SIGNED_OUT

  const claim = await loadClaim(supabase, claimId)
  if (!claim?.lots || claim.buyer_id !== user.id) return { error: 'Request not found.' }
  const wasOnHold = claim.status === 'confirmed'

  try {
    await releaseClaim(createAdminClient(), claim)
  } catch (err) {
    return failure(err, 'Could not withdraw this request.')
  }

  const { data: seller } = await supabase
    .from('profiles')
    .select('whatsapp_number')
    .eq('id', claim.lots.seller_id)
    .maybeSingle()
  if (seller?.whatsapp_number) {
    await sendWhatsAppMessage(
      seller.whatsapp_number,
      wasOnHold
        ? `${displayName(claim.profiles)} released the hold on your ${lotTitle(claim.lots)} lot. ` +
            `It's back on the feed.`
        : `${displayName(claim.profiles)} withdrew their request for your ${lotTitle(claim.lots)} lot.`
    )
  }

  refreshApp()
  return { ok: true }
}

// ============ SELLER: my lots ============

export async function markLotSoldAction(lotId: string): Promise<ActionResult> {
  const { supabase, user } = await session()
  if (!user) return SIGNED_OUT

  // Covers a lot on hold (the deal went through) and one sold off SurplusX.
  const { data, error } = await supabase
    .from('lots')
    .update({ status: 'sold' })
    .eq('id', lotId)
    .eq('seller_id', user.id)
    .in('status', ['available', 'reserved'])
    .select('id')
    .maybeSingle()

  if (error) return failure(error, 'Could not update this lot.')
  if (!data) return { error: 'This lot is already sold or withdrawn.' }

  refreshApp()
  return { ok: true }
}

export async function withdrawLotAction(lotId: string): Promise<ActionResult> {
  const { supabase, user } = await session()
  if (!user) return SIGNED_OUT

  const { data, error } = await supabase
    .from('lots')
    .update({ status: 'expired' })
    .eq('id', lotId)
    .eq('seller_id', user.id)
    .eq('status', 'available')
    .select('id')
    .maybeSingle()

  if (error) return failure(error, 'Could not withdraw this lot.')
  if (!data) return { error: 'A lot on hold can’t be withdrawn — settle it with the buyer first.' }

  refreshApp()
  return { ok: true }
}

// ============ SWATCH REQUESTS ============

export async function requestSwatchAction(lotId: string): Promise<ActionResult> {
  const { supabase, user } = await session()
  if (!user) return SIGNED_OUT

  const lot = await loadLot(supabase, lotId)
  if (!lot) return { error: 'Lot not found.' }
  if (lot.seller_id === user.id) return { error: "You can't request a swatch of your own lot." }

  const { error } = await supabase.from('swatch_requests').insert({ lot_id: lotId, buyer_id: user.id })
  if (error) {
    // Already asked: nothing new to send, and the button should just show "Requested".
    if (error.code === '23505') return { ok: true }
    return failure(error, 'Could not send the swatch request.')
  }

  if (lot.profiles?.whatsapp_number) {
    const buyer = await loadProfile(supabase, user.id)
    const contact = buyer?.whatsapp_number ? `\n${waLink(buyer.whatsapp_number)}` : ''
    await sendWhatsAppMessage(
      lot.profiles.whatsapp_number,
      `${displayName(buyer)}${buyer?.city ? ` (${buyer.city})` : ''} would like a swatch of your ` +
        `${lotTitle(lot)} lot. Message them to arrange it.${contact}`
    )
  }

  refreshApp()
  return { ok: true }
}

// ============ SAVED SEARCHES ============

export async function saveSearchAction(
  params: Record<string, string | undefined>
): Promise<ActionResult> {
  const { supabase, user } = await session()
  if (!user) return SIGNED_OUT

  const filters = parseFeedFilters(params)
  if (!hasActiveFilters(filters)) return { error: 'Add a search or filter before saving.' }

  const { count } = await supabase
    .from('saved_searches')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
  if ((count ?? 0) >= MAX_SAVED_SEARCHES) {
    return { error: `You can save up to ${MAX_SAVED_SEARCHES} searches. Remove one first.` }
  }

  const { error } = await supabase.from('saved_searches').insert({
    user_id: user.id,
    name: describeFilters(filters),
    filters: searchFilters(filters),
  })
  if (error) return failure(error, 'Could not save this search.')

  refreshApp()
  return { ok: true }
}

// Opening a saved search (or dismissing its banner) resets its "N new" count.
export async function markSavedSearchSeenAction(searchId: string): Promise<ActionResult> {
  const { supabase, user } = await session()
  if (!user) return SIGNED_OUT

  const { error } = await supabase
    .from('saved_searches')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', searchId)
    .eq('user_id', user.id)
  if (error) return failure(error, 'Could not update this saved search.')

  refreshApp()
  return { ok: true }
}

export async function deleteSavedSearchAction(searchId: string): Promise<ActionResult> {
  const { supabase, user } = await session()
  if (!user) return SIGNED_OUT

  const { error } = await supabase
    .from('saved_searches')
    .delete()
    .eq('id', searchId)
    .eq('user_id', user.id)
  if (error) return failure(error, 'Could not remove this saved search.')

  refreshApp()
  return { ok: true }
}
