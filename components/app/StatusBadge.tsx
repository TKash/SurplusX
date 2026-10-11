import type { ClaimStatus, LotStatus } from '@/types/database.types'
import { Pill } from './ui'

type Tone = Parameters<typeof Pill>[0]['tone']

const LOT: Record<LotStatus, { label: string; tone: Tone }> = {
  available: { label: 'Available', tone: 'ok' },
  reserved: { label: 'On hold', tone: 'accent' },
  sold: { label: 'Sold', tone: 'dark' },
  expired: { label: 'Withdrawn', tone: 'quiet' },
}

// Claim statuses read differently to the people involved: 'pending' is a request waiting on the
// seller, 'confirmed' is an accepted request holding the lot, 'cancelled' covers both a seller
// declining and a buyer withdrawing.
const CLAIM: Record<ClaimStatus, { label: string; tone: Tone }> = {
  pending: { label: 'Awaiting seller', tone: 'accent' },
  confirmed: { label: 'On hold', tone: 'ok' },
  cancelled: { label: 'Closed', tone: 'quiet' },
  expired: { label: 'Hold lapsed', tone: 'quiet' },
}

export default function StatusBadge({ status }: { status: LotStatus }) {
  const { label, tone } = LOT[status]
  return <Pill tone={tone}>{label}</Pill>
}

export function ClaimStatusBadge({ status, seller = false }: { status: ClaimStatus; seller?: boolean }) {
  const { label, tone } = CLAIM[status]
  const sellerLabel = status === 'pending' ? 'Needs your answer' : status === 'cancelled' ? 'Declined' : label
  return <Pill tone={tone}>{seller ? sellerLabel : label}</Pill>
}
