import Link from 'next/link'
import { requireProfile } from '@/lib/auth/guards'
import { getMyListings } from '@/lib/lots/queries'
import {
  cancelVerificationAction,
  markLotSoldAction,
  relistLotAction,
  requestVerificationAction,
  withdrawLotAction,
} from '@/lib/lots/actions'
import { lotPrice, lotQuantity, lotSpecLine, lotTitle } from '@/lib/lots/display'
import { postedAgo } from '@/lib/lots/time'
import { VERIFICATION_BLURB } from '@/lib/constants'
import type { LotWithInterest } from '@/lib/lots/types'
import { EmptyState, Eyebrow, PageHeader } from '@/components/app/ui'
import StatusBadge, { VerificationBadge } from '@/components/app/StatusBadge'
import ActionButton from '@/components/app/ActionButton'

function interestCount(lot: LotWithInterest) {
  return lot.contact_views?.[0]?.count ?? 0
}

function Row({ lot, children }: { lot: LotWithInterest; children?: React.ReactNode }) {
  const spec = lotSpecLine(lot)
  return (
    <li className="flex flex-col gap-3 rounded-[14px] border border-border bg-surface p-3.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3.5">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[10px] bg-sand">
            {lot.photo_urls[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={lot.photo_urls[0]} alt="" className="absolute inset-0 h-full w-full object-cover" />
            )}
          </div>
          <div className="min-w-0">
            <Link
              href={`/lots/${lot.id}`}
              className="block truncate text-[15px] font-semibold hover:underline hover:underline-offset-4"
            >
              {lotTitle(lot)}
            </Link>
            <div className="truncate text-[13px] text-muted">
              {[lot.category, spec, `${lotQuantity(lot)} · ${lotPrice(lot)}`].filter(Boolean).join(' · ')}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">{children}</div>
      </div>
    </li>
  )
}

export default async function MyListingsPage() {
  const { supabase, user } = await requireProfile()
  const lots = await getMyListings(supabase, user.id)

  const live = lots.filter((lot) => lot.status === 'available')
  const closed = lots.filter((lot) => lot.status !== 'available')
  const totalInterest = live.reduce((sum, lot) => sum + interestCount(lot), 0)

  return (
    <main className="flex-1">
      <PageHeader
        title="My listings"
        description={
          totalInterest > 0
            ? `${totalInterest} ${totalInterest === 1 ? 'buyer has' : 'buyers have'} taken your contact. They reach you directly — keep the stock here up to date.`
            : 'Buyers take your contact and come straight to you. Keep the stock here up to date so nobody calls about a lot that has gone.'
        }
        action={
          <Link
            href="/lots/new"
            className="rounded-[10px] bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-85"
          >
            + Post a lot
          </Link>
        }
      />

      <div className="flex flex-col gap-9 px-4 py-6 sm:px-7 sm:py-8">
        {lots.length === 0 && (
          <EmptyState title="You haven’t posted any lots">
            <Link href="/lots/new" className="text-foreground underline underline-offset-4">
              Post your first lot
            </Link>{' '}
            and buyers can call you about it straight away.
          </EmptyState>
        )}

        {live.length > 0 && (
          <section>
            <Eyebrow className="mb-3">On the feed · {live.length}</Eyebrow>
            <ul className="flex flex-col gap-3">
              {live.map((lot) => {
                const views = interestCount(lot)
                return (
                  <Row key={lot.id} lot={lot}>
                    {views > 0 && (
                      <Link
                        href={`/lots/${lot.id}`}
                        className="rounded-full bg-accent px-2.5 py-1 font-mono text-[11px] text-accent-foreground"
                        title="Buyers who took your contact"
                      >
                        {views} interested
                      </Link>
                    )}
                    <VerificationBadge status={lot.verification} />
                    {lot.verification === 'none' ? (
                      <ActionButton
                        action={requestVerificationAction.bind(null, lot.id)}
                        label="Get verified"
                        confirm={`${VERIFICATION_BLURB}\n\nThis is a paid visit — we'll message you to arrange it and agree the fee. Send the request?`}
                      />
                    ) : lot.verification !== 'verified' ? (
                      <ActionButton action={cancelVerificationAction.bind(null, lot.id)} label="Cancel check" />
                    ) : null}
                    <ActionButton
                      action={markLotSoldAction.bind(null, lot.id)}
                      label="Mark sold"
                      confirm="Mark this lot as sold? It will be removed from the feed."
                    />
                    <ActionButton
                      action={withdrawLotAction.bind(null, lot.id)}
                      label="Withdraw"
                      variant="danger"
                      confirm="Withdraw this lot? It will be removed from the feed."
                    />
                  </Row>
                )
              })}
            </ul>
          </section>
        )}

        {closed.length > 0 && (
          <section>
            <Eyebrow className="mb-3">Closed · {closed.length}</Eyebrow>
            <ul className="flex flex-col gap-3 opacity-90">
              {closed.map((lot) => (
                <Row key={lot.id} lot={lot}>
                  <span className="text-[12px] text-muted">{postedAgo(lot.created_at)}</span>
                  <StatusBadge status={lot.status} />
                  <ActionButton action={relistLotAction.bind(null, lot.id)} label="Relist" />
                </Row>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  )
}
