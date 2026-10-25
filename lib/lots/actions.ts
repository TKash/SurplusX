'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWhatsAppMessage } from '@/lib/whatsapp/twilio'
import { waLink } from '@/lib/format'
import { MAX_SAVED_SEARCHES } from './queries'
import { describeFilters, hasActiveFilters, parseFeedFilters, searchFilters } from './filters'
import { displayName, lotContact, lotQuantity, lotTitle } from './display'
import type { Lot, ProfileSummary } from './types'
import type { VerificationStatus } from '@/types/database.types'

// Buyer and seller actions. Each one re-checks who's asking: server actions are public endpoints,
// so a lot id from the client proves nothing on its own.

export type ActionResult = { ok?: true; error?: string }
export type ContactResult = ActionResult & { phone?: string | null; name?: string | null }

type LotForAction = Pick<
  Lot,
  | 'id'
  | 'seller_id'
  | 'title'
  | 'category'
  | 'quantity'
  | 'unit'
  | 'status'
  | 'verification'
  | 'contact_phone'
  | 'contact_name'
> & { profiles: ProfileSummary | null }

const LOT_FIELDS =
  'id, seller_id, title, category, quantity, unit, status, verification, contact_phone, contact_name'
const PROFILE_FIELDS = 'full_name, company_name, city, whatsapp_number'

const SIGNED_OUT: ActionResult = { error: 'Your session ended. Please sign in again.' }

async function session() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

function refreshApp() {
  revalidatePath('/', 'layout')
}

type ServerClient = Awaited<ReturnType<typeof createClient>>

async function loadLot(supabase: ServerClient, lotId: string) {
  const { data } = await supabase
    .from('lots')
    .select(`${LOT_FIELDS}, profiles(${PROFILE_FIELDS})`)
    .eq('id', lotId)
    .maybeSingle()
  return data as unknown as LotForAction | null
}

async function loadProfile(supabase: ServerClient, userId: string) {
  const { data } = await supabase.from('profiles').select(PROFILE_FIELDS).eq('id', userId).maybeSingle()
  return data as ProfileSummary | null
}

function failure(err: unknown, fallback: string): ActionResult {
  console.error(fallback, err)
  return { error: fallback }
}

// ============ BUYER: get the seller's contact ============

// Hands over the number and records who asked, so the seller can see real interest in a lot.
export async function revealContactAction(lotId: string): Promise<ContactResult> {
  const { supabase, user } = await session()
  if (!user) return SIGNED_OUT

  const lot = await loadLot(supabase, lotId)
  if (!lot) return { error: 'Lot not found.' }

  const { phone, name } = lotContact(lot, lot.profiles)
  if (!phone) return { error: 'This listing has no contact number yet.' }
  if (lot.seller_id === user.id) return { ok: true, phone, name }

  const { error } = await supabase.from('contact_views').insert({ lot_id: lotId, viewer_id: user.id })

  // 23505 = this buyer already looked; nothing new to record or tell the seller about.
  if (error && error.code !== '23505') return failure(error, 'Could not open the contact details.')

  if (!error && lot.profiles?.whatsapp_number) {
    const buyer = await loadProfile(supabase, user.id)
    const contact = buyer?.whatsapp_number ? `\n${waLink(buyer.whatsapp_number)}` : ''
    await sendWhatsAppMessage(
      lot.profiles.whatsapp_number,
      `${displayName(buyer)}${buyer?.city ? `, ${buyer.city}` : ''} just took your number for ` +
        `${lotTitle(lot)} (${lotQuantity(lot)}). Expect a call.${contact}`
    )
  }

  refreshApp()
  return { ok: true, phone, name }
}

// ============ SELLER: my lots ============

async function setOwnLotStatus(lotId: string, status: 'sold' | 'expired'): Promise<ActionResult> {
  const { supabase, user } = await session()
  if (!user) return SIGNED_OUT

  const { data, error } = await supabase
    .from('lots')
    .update({ status })
    .eq('id', lotId)
    .eq('seller_id', user.id)
    .eq('status', 'available')
    .select('id')
    .maybeSingle()

  if (error) return failure(error, 'Could not update this lot.')
  if (!data) return { error: 'This lot is already sold or withdrawn.' }

  refreshApp()
  return { ok: true }
}

export async function markLotSoldAction(lotId: string) {
  return setOwnLotStatus(lotId, 'sold')
}

export async function withdrawLotAction(lotId: string) {
  return setOwnLotStatus(lotId, 'expired')
}

export async function relistLotAction(lotId: string): Promise<ActionResult> {
  const { supabase, user } = await session()
  if (!user) return SIGNED_OUT

  const { data, error } = await supabase
    .from('lots')
    .update({ status: 'available' })
    .eq('id', lotId)
    .eq('seller_id', user.id)
    .in('status', ['sold', 'expired'])
    .select('id')
    .maybeSingle()

  if (error) return failure(error, 'Could not put this lot back on the feed.')
  if (!data) return { error: 'This lot is already on the feed.' }

  refreshApp()
  return { ok: true }
}

// ============ VERIFICATION ============

// The seller asks for an on-floor check. Payment is settled off the platform, so this only records
// the request and tells the team.
export async function requestVerificationAction(lotId: string): Promise<ActionResult> {
  const { supabase, user } = await session()
  if (!user) return SIGNED_OUT

  const { data, error } = await supabase
    .from('lots')
    .update({ verification: 'requested', verification_requested_at: new Date().toISOString() })
    .eq('id', lotId)
    .eq('seller_id', user.id)
    .eq('verification', 'none')
    .select('id, title, category, quantity, unit, location')
    .maybeSingle()

  if (error) return failure(error, 'Could not send the verification request.')
  if (!data) return { error: 'This lot is already being verified.' }

  const team = process.env.VERIFICATION_ALERT_NUMBER
  if (team) {
    const seller = await loadProfile(supabase, user.id)
    const lot = data as unknown as Pick<Lot, 'title' | 'category' | 'quantity' | 'unit' | 'location'>
    await sendWhatsAppMessage(
      team,
      `Verification requested: ${lotTitle(lot)} (${lotQuantity(lot)})` +
        `${lot.location ? ` in ${lot.location}` : ''} by ${displayName(seller)}` +
        `${seller?.whatsapp_number ? `\n${waLink(seller.whatsapp_number)}` : ''}` +
        `\n${process.env.NEXT_PUBLIC_APP_URL}/admin/verification`
    )
  }

  refreshApp()
  return { ok: true }
}

export async function cancelVerificationAction(lotId: string): Promise<ActionResult> {
  const { supabase, user } = await session()
  if (!user) return SIGNED_OUT

  const { data, error } = await supabase
    .from('lots')
    .update({ verification: 'none', verification_requested_at: null })
    .eq('id', lotId)
    .eq('seller_id', user.id)
    .in('verification', ['requested', 'scheduled'])
    .select('id')
    .maybeSingle()

  if (error) return failure(error, 'Could not cancel the request.')
  if (!data) return { error: 'That request is no longer open.' }

  refreshApp()
  return { ok: true }
}

// Staff only: moving a lot through the verification states. RLS only lets a seller update their own
// lot, so this goes through the service-role client after the admin check.
export async function setVerificationAction(
  lotId: string,
  status: VerificationStatus,
  notes: string
): Promise<ActionResult> {
  const { supabase, user } = await session()
  if (!user) return SIGNED_OUT

  const { data: me } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
  if (!me?.is_admin) return { error: 'Only the SurplusX team can change verification.' }

  const verified = status === 'verified'
  const { data, error } = await createAdminClient()
    .from('lots')
    .update({
      verification: status,
      verification_notes: notes.trim().slice(0, 1000) || null,
      verified_at: verified ? new Date().toISOString() : null,
      verified_by: verified ? user.id : null,
    })
    .eq('id', lotId)
    .select(`id, title, category, quantity, unit, seller_id, profiles(${PROFILE_FIELDS})`)
    .maybeSingle()

  if (error) return failure(error, 'Could not update verification.')
  if (!data) return { error: 'Lot not found.' }

  const lot = data as unknown as LotForAction
  if (verified && lot.profiles?.whatsapp_number) {
    await sendWhatsAppMessage(
      lot.profiles.whatsapp_number,
      `Your ${lotTitle(lot)} lot is now verified on SurplusX. Buyers see the badge and what we ` +
        `found on the listing: ${process.env.NEXT_PUBLIC_APP_URL}/lots/${lot.id}`
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
