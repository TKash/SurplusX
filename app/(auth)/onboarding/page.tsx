import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Logo } from '@/components/app/ui'
import OnboardingForm from './OnboardingForm'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (profile) redirect('/feed')

  // Supabase stores the signed-in phone without the leading +.
  const signedInPhone = user.phone ? `+${user.phone.replace(/^\+/, '')}` : ''

  return (
    <main className="flex min-h-dvh flex-1 flex-col bg-sand px-4 py-8 sm:px-8">
      <Link href="/" className="self-start">
        <Logo />
      </Link>
      <div className="flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-[460px] rounded-[14px] bg-background p-6 shadow-[0_24px_60px_-30px_rgba(30,27,22,0.35)] sm:p-9">
          <div className="mb-3.5 font-mono text-[11px] tracking-[0.1em] text-muted">ONE LAST STEP</div>
          <h1 className="mb-2 font-display text-[36px] leading-[1.05] font-normal">Tell us about your business</h1>
          <p className="mb-7 text-sm leading-relaxed text-muted">
            Buyers and sellers see this when you post, claim or ask for a swatch, so they know who they’re
            dealing with.
          </p>
          <OnboardingForm defaultWhatsApp={signedInPhone} />
        </div>
      </div>
    </main>
  )
}
