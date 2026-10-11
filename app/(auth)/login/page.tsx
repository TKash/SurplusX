import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { normalizePhone } from '@/lib/auth/phone'
import { SIGNIN_QUOTE } from '@/lib/site'
import SignInView from '@/components/auth/SignInView'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect('/feed')

  // ?sent=+91... comes from the homepage form, which has already sent the code.
  const { sent } = await searchParams
  const sentTo = sent ? normalizePhone(sent) : null

  return <SignInView sentTo={sentTo} quote={SIGNIN_QUOTE} />
}
