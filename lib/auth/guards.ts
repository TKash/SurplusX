import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Every page under /feed, /lots, /my requires a completed profile, not just a
// session -- lots.seller_id and claims.buyer_id both have FK constraints on
// profiles(id), so posting/claiming fails otherwise. Centralized here so no
// page can accidentally skip the onboarding check the way feed/page.tsx did.
//
// Wrapped in React's cache() so the (app) layout and the page it wraps share one auth + profile
// lookup per request instead of each doing their own.
export const requireProfile = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile) redirect('/onboarding')

  return { supabase, user, profile }
})
