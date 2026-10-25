import { formatDistanceToNowStrict } from 'date-fns'

export function postedAgo(iso: string) {
  return formatDistanceToNowStrict(new Date(iso), { addSuffix: true })
}
