import type { Database } from '@/types/database.types'

type Tables = Database['public']['Tables']

export type Lot = Tables['lots']['Row']
export type LotInsert = Tables['lots']['Insert']
export type Claim = Tables['claims']['Row']
export type Profile = Tables['profiles']['Row']
export type SwatchRequest = Tables['swatch_requests']['Row']
export type SavedSearch = Tables['saved_searches']['Row']

// The profile fields shown to a counterparty (seller on a lot, buyer on a claim or swatch).
export type ProfileSummary = Pick<Profile, 'full_name' | 'company_name' | 'city' | 'whatsapp_number'>

export type LotWithSeller = Lot & { profiles: ProfileSummary | null }

export type ClaimWithBuyer = Claim & { profiles: ProfileSummary | null }

// RLS only returns claims to the lot's seller and the claiming buyer, so `claims` is empty for
// anyone else looking at the lot.
export type LotDetail = LotWithSeller & { claims: ClaimWithBuyer[] }

export type LotWithClaims = Lot & { claims: ClaimWithBuyer[] }

export type ClaimWithLot = Claim & { lots: LotWithSeller | null }

export type SwatchWithLot = SwatchRequest & { lots: LotWithSeller | null }

export type SwatchWithBuyer = SwatchRequest & { lots: Lot | null; profiles: ProfileSummary | null }
