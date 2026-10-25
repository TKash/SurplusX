import type { Database } from '@/types/database.types'

type Tables = Database['public']['Tables']

export type Lot = Tables['lots']['Row']
export type LotInsert = Tables['lots']['Insert']
export type Profile = Tables['profiles']['Row']
export type SavedSearch = Tables['saved_searches']['Row']
export type ContactView = Tables['contact_views']['Row']

// The profile fields a counterparty sees.
export type ProfileSummary = Pick<Profile, 'full_name' | 'company_name' | 'city' | 'whatsapp_number'>

export type LotWithSeller = Lot & { profiles: ProfileSummary | null }

// Supabase returns an aggregate as a one-element array: contact_views: [{ count: 4 }].
export type CountRow = { count: number }

export type LotWithInterest = Lot & { contact_views: CountRow[] }

export type ContactViewWithBuyer = ContactView & { profiles: ProfileSummary | null }
