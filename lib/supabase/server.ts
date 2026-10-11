import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'
import { SESSION_ONLY_COOKIE, applySessionPreference } from './session-cookies'

// `sessionOnly` overrides the stored "keep me signed in" preference -- verifyOtp passes it because
// the preference cookie it sets in the same request isn't readable yet.
export async function createClient({ sessionOnly }: { sessionOnly?: boolean } = {}) {
  const cookieStore = await cookies()
  const sessionCookiesOnly = sessionOnly ?? cookieStore.get(SESSION_ONLY_COOKIE)?.value === '1'

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const cookie of cookiesToSet) {
              const { name, value, options } = applySessionPreference(cookie, sessionCookiesOnly)
              cookieStore.set(name, value, options)
            }
          } catch {
            // setAll called from a Server Component — safe to ignore because
            // proxy.ts refreshes the session on every request instead.
          }
        },
      },
    }
  )
}
