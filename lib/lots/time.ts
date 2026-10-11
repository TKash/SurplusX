import { formatDistanceToNowStrict } from 'date-fns'

// "31h left" / "1d 6h left" for an accepted request's 48-hour hold. Null until a seller accepts.
export function timeLeftLabel(reservedUntil: string | null) {
  if (!reservedUntil) return null
  const hours = Math.ceil((new Date(reservedUntil).getTime() - Date.now()) / 3_600_000)
  if (hours <= 0) return 'Hold ending'
  if (hours < 24) return `${hours}h left`
  return `${Math.floor(hours / 24)}d ${hours % 24}h left`
}

export function postedAgo(iso: string) {
  return formatDistanceToNowStrict(new Date(iso), { addSuffix: true })
}
