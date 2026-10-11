import { redirect } from 'next/navigation'

// The code step now lives in a modal on /login. Kept so old links and bookmarks still land on the
// code entry for the right number.
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string }>
}) {
  const { phone } = await searchParams
  redirect(phone ? `/login?sent=${encodeURIComponent(phone)}` : '/login')
}
