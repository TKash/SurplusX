import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_ONLY_COOKIE, applySessionPreference } from '@/lib/supabase/session-cookies'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  const sessionOnly = request.cookies.get(SESSION_ONLY_COOKIE)?.value === '1'

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const cookie of cookiesToSet) {
            const { name, value, options } = applySessionPreference(cookie, sessionOnly)
            response.cookies.set(name, value, options)
          }
        },
      },
    }
  )

  // Refreshes the session cookie if expired -- required so Server Components
  // (which can only read cookies, not write them) see a valid session.
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/whatsapp|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
