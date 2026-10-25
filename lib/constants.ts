import type { LotUnit } from '@/types/database.types'

// Categories and their per-category fields live in lib/lots/categories.ts.

export const LOT_UNITS = [
  'meters',
  'yards',
  'kg',
  'tonnes',
  'pieces',
  'rolls',
  'bales',
  'cones',
  'hanks',
  'cartons',
  'boxes',
  'gross',
  'sets',
] as const

// Fails to compile if this list and the database enum ever drift apart.
const _unitsMatchDatabase: readonly LotUnit[] = LOT_UNITS
void _unitsMatchDatabase

export const MAX_LOT_PHOTOS = 3

// What a seller gets for an on-floor check. The fee is settled off the platform, so this is only
// what the app says about it.
export const VERIFICATION_BLURB =
  'We come to your floor, re-measure the stock, check the rolls and put what we find on the listing.'
