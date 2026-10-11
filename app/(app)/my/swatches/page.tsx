import Link from 'next/link'
import { requireProfile } from '@/lib/auth/guards'
import { getReceivedSwatches, getSentSwatches } from '@/lib/lots/queries'
import { displayName, lotOrigin, lotTitle } from '@/lib/lots/display'
import { postedAgo } from '@/lib/lots/time'
import { waLink } from '@/lib/format'
import { EmptyState, Eyebrow, PageHeader } from '@/components/app/ui'

function WhatsAppButton({ number, message, label }: { number: string; message: string; label: string }) {
  return (
    <a
      href={waLink(number, message)}
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0 rounded-lg border border-line bg-surface px-3 py-2 text-[13px] transition-colors hover:border-muted-light"
    >
      {label}
    </a>
  )
}

export default async function SwatchRequestsPage() {
  const { supabase, user } = await requireProfile()
  const [sent, received] = await Promise.all([
    getSentSwatches(supabase, user.id),
    getReceivedSwatches(supabase, user.id),
  ])

  return (
    <main className="flex-1">
      <PageHeader
        title="Swatch requests"
        description="Samples are arranged directly between buyer and seller on WhatsApp. This keeps track of who asked for what."
      />

      <div className="flex flex-col gap-9 px-4 py-6 sm:px-7 sm:py-8">
        <section>
          <Eyebrow className="mb-3">On your lots · {received.length}</Eyebrow>
          {received.length === 0 ? (
            <p className="text-sm text-muted">When a buyer asks for a sample of one of your lots, they’ll show up here.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {received.map((request) => (
                <li
                  key={request.id}
                  className="flex flex-col gap-3 rounded-[14px] border border-border bg-surface p-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-semibold">
                      {displayName(request.profiles)}
                      {request.profiles?.city && <span className="font-normal text-muted">, {request.profiles.city}</span>}
                    </div>
                    <div className="truncate text-[13px] text-muted">
                      wants a swatch of{' '}
                      {request.lots ? (
                        <Link href={`/lots/${request.lots.id}`} className="text-foreground underline-offset-4 hover:underline">
                          {lotTitle(request.lots)}
                        </Link>
                      ) : (
                        'a lot'
                      )}{' '}
                      · {postedAgo(request.created_at)}
                    </div>
                  </div>
                  {request.profiles?.whatsapp_number && request.lots && (
                    <WhatsAppButton
                      number={request.profiles.whatsapp_number}
                      message={`Hi, about the swatch of my ${lotTitle(request.lots)} lot on SurplusX.`}
                      label="WhatsApp buyer"
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <Eyebrow className="mb-3">Requested by you · {sent.length}</Eyebrow>
          {sent.length === 0 ? (
            <EmptyState title="No swatches requested">
              Tap <span className="text-foreground">Swatch</span> on any lot to ask the seller for a sample.
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-3">
              {sent.map(
                (request) =>
                  request.lots && (
                    <li
                      key={request.id}
                      className="flex flex-col gap-3 rounded-[14px] border border-border bg-surface p-3.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/lots/${request.lots.id}`}
                          className="block truncate text-[15px] font-semibold hover:underline hover:underline-offset-4"
                        >
                          {lotTitle(request.lots)}
                        </Link>
                        <div className="truncate text-[13px] text-muted">
                          {[lotOrigin(request.lots, request.lots.profiles), `asked ${postedAgo(request.created_at)}`]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                      </div>
                      {request.lots.profiles?.whatsapp_number && (
                        <WhatsAppButton
                          number={request.lots.profiles.whatsapp_number}
                          message={`Hi, I asked for a swatch of your ${lotTitle(request.lots)} lot on SurplusX.`}
                          label="WhatsApp seller"
                        />
                      )}
                    </li>
                  )
              )}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
