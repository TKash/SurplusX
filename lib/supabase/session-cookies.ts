// "Keep me signed in" on the sign-in page. Left unchecked (the default, for shared mill
// computers), a small flag cookie is set and Supabase's auth cookies are written without
// maxAge/expires, so the browser drops them when it closes. Both the server client and the proxy
// (which refreshes sessions) apply this, otherwise a token refresh would quietly make them
// persistent again.

export const SESSION_ONLY_COOKIE = 'lm_session_only'

type AuthCookie = { name: string; value: string; options?: { maxAge?: number; expires?: Date } }

export function applySessionPreference<T extends AuthCookie>(cookie: T, sessionOnly: boolean): T {
  // Removals (empty value, maxAge 0) must keep their expiry or sign-out wouldn't clear anything.
  if (!sessionOnly || !cookie.value) return cookie
  const options = { ...cookie.options }
  delete options.maxAge
  delete options.expires
  return { ...cookie, options }
}
