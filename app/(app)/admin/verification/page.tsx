import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireProfile } from '@/lib/auth/guards'
import { getRecentlyVerified, getVerificationQueue } from '@/lib/lots/queries'
import { displayName, lotPrice, lotQuantity, lotSpecLine, lotTitle } from '@/lib/lots/display'
import { postedAgo } from '@/lib/lots/time'
import { waLink } from '@/lib/format'
import { EmptyState, Eyebrow, PageHeader } from '@/components/app/ui'
import { VerificationBadge } from '@/components/app/StatusBadge'
import VerificationForm from '@/components/app/VerificationForm'

// Staff view: lots whose sellers have asked for an on-floor check. The fee is settled off the
// platform, so this is only about getting there and writing up what was found.
export default async function VerificationQueuePage() {
  const { supabase, profile } = await requireProfile()
  if (!profile.is_admin) notFound()

  const [queue, recent] = await Promise.all([
    getVerificationQueue(supabase),
    getRecentlyVerified(supabase),
  ])

  return (
    <main className="flex-1">
      <PageHeader
        title="Verification"
        description="Sellers who asked for a check. Visit, then write up what you found — it goes straight onto the listing."
      />

      <div className="flex flex-col gap-9 px-4 py-6 sm:px-7 sm:py-8">
        <section>
          <Eyebrow className="mb-3">Waiting · {queue.length}</Eyebrow>
          {queue.length === 0 ? (
            <EmptyState title="Nothing waiting">
              Requests from sellers show up here as soon as they ask.
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-3">
              {queue.map((lot) => (
                <li key={lot.id} className="flex flex-col gap-3.5 rounded-[14px] border border-border bg-surface p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <Link
                        href={`/lots/${lot.id}`}
                        className="text-[15px] font-semibold hover:underline hover:underline-offset-4"
                      >
                        {lotTitle(lot)}
                      </Link>
                      <div className="text-[13px] text-muted">
                        {[lot.category, lotSpecLine(lot), `${lotQuantity(lot)} · ${lotPrice(lot)}`]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                      <div className="mt-1 text-[13px] text-ink-soft">
                        {displayName(lot.profiles)}
                        {lot.location ? ` · ${lot.location}` : ''}
                        {lot.verification_requested_at ? ` · asked ${postedAgo(lot.verification_requested_at)}` : ''}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <VerificationBadge status={lot.verification} />
                      {(lot.contact_phone || lot.profiles?.whatsapp_number) && (
                        <a
                          href={waLink(
                            (lot.contact_phone || lot.profiles?.whatsapp_number)!,
                            `Hi, about verifying your ${lotTitle(lot)} lot on SurplusX.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-line bg-surface px-3 py-2 text-[13px] transition-colors hover:border-muted-light"
                        >
                          WhatsApp seller
                        </a>
                      )}
                    </div>
                  </div>
                  <VerificationForm lotId={lot.id} status={lot.verification} notes={lot.verification_notes} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {recent.length > 0 && (
          <section>
            <Eyebrow className="mb-3">Recently verified</Eyebrow>
            <ul className="flex flex-col gap-2">
              {recent.map((lot) => (
                <li
                  key={lot.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] bg-sand px-3.5 py-3"
                >
                  <div className="min-w-0">
                    <Link href={`/lots/${lot.id}`} className="text-[14.5px] font-semibold hover:underline">
                      {lotTitle(lot)}
                    </Link>
                    <div className="truncate text-[12.5px] text-muted">
                      {displayName(lot.profiles)}
                      {lot.verified_at ? ` · ${postedAgo(lot.verified_at)}` : ''}
                    </div>
                  </div>
                  <VerificationBadge status="verified" />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  )
}
