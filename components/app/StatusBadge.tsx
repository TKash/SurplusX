import type { LotStatus, VerificationStatus } from '@/types/database.types'
import { Pill } from './ui'

type Tone = Parameters<typeof Pill>[0]['tone']

const LOT: Record<LotStatus, { label: string; tone: Tone }> = {
  available: { label: 'Available', tone: 'ok' },
  // Left over from the old claim flow; no new lot reaches it.
  reserved: { label: 'On hold', tone: 'accent' },
  sold: { label: 'Sold', tone: 'dark' },
  expired: { label: 'Withdrawn', tone: 'quiet' },
}

const VERIFICATION: Record<VerificationStatus, { label: string; tone: Tone } | null> = {
  none: null,
  requested: { label: 'Check requested', tone: 'quiet' },
  scheduled: { label: 'Visit booked', tone: 'accent' },
  verified: { label: '✓ Verified', tone: 'ok' },
}

export default function StatusBadge({ status }: { status: LotStatus }) {
  const { label, tone } = LOT[status]
  return <Pill tone={tone}>{label}</Pill>
}

// Only shows once a seller has asked for a check; an unverified lot says nothing either way.
export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const badge = VERIFICATION[status]
  if (!badge) return null
  return <Pill tone={badge.tone}>{badge.label}</Pill>
}
