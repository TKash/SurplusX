import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StorySite from '@/components/site/StorySite'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Signed-in traders go straight to the stock they came for.
  if (user) redirect('/feed')

  return <StorySite />
}
