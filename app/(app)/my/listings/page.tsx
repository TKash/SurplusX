import Link from 'next/link'
import { requireProfile } from '@/lib/auth/guards'
import { getMyListings } from '@/lib/lots/queries'
import {
  acceptClaimAction,
  declineClaimAction,
  markLotSoldAction,
  withdrawLotAction,
} from '@/lib/lots/actions'
import { displayName, lotPrice, lotQuantity, lotTitle } from '@/lib/lots/display'
import { postedAgo, timeLeftLabel } from '@/lib/lots/time'
import { GROUP_HOWTO, dealChatLink, dealSummary } from '@/lib/whatsapp/group'
import { waLink } from '@/lib/format'
import type { ClaimWithBuyer, LotWithClaims, Profile } from '@/lib/lots/types'
import { EmptyState, Eyebrow, PageHeader } from '@/components/app/ui'
import StatusBadge from '@/components/app/StatusBadge'
import ActionButton from '@/components/app/ActionButton'
import DealContact from '@/components/app/DealContact'

function Thumb({ lot }: { lot: LotWithClaims }) {
  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[10px] bg-sand">
      {lot.photo_urls[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={lot.photo_urls[0]} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
    </div>
  )
}

function LotHeading({ lot, meta }: { lot: LotWithClaims; meta: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3.5">
      <Thumb lot={lot} />
      <div className="min-w-0">
        <Link href={`/lots/${lot.id}`} className="block truncate text-[15px] font-semibold hover:underline hover:underline-offset-4">
          {lotTitle(lot)}
        </Link>
        <div className="truncate text-[13px] text-muted">{meta}</div>
      </div>
    </div>
  )
}

function offerLine(claim: ClaimWithBuyer, lot: LotWithClaims) {
  const quantity = claim.offer_quantity ? `${claim.offer_quantity} ${lot.unit}` : lotQuantity(lot)
  const price = claim.offer_price ? `₹${claim.offer_price}/${lot.unit}` : lotPrice(lot)
  return `${quantity} at ${price}`
}

export default async function MyListingsPage() {
  const { supabase, user, profile } = await requireProfile()
  const lots = await getMyListings(supabase, user.id)

  const withRequests = lots.filter(
    (lot) => lot.status === 'available' && lot.claims.some((claim) => claim.status === 'pending')
  )
  const onHold = lots.filter((lot) => lot.status === 'reserved')
  const quiet = lots.filter(
    (lot) => lot.status === 'available' && !lot.claims.some((claim) => claim.status === 'pending')
  )
  const closed = lots.filter((lot) => lot.status === 'sold' || lot.status === 'expired')

  return (
    <main className="flex-1">
      <PageHeader
        title="My listings"
        description="Buyers send a request with what they want and at what price. Accepting one holds the lot for them for 48 hours."
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
            and buyers can send you requests.
          </EmptyState>
        )}

        {withRequests.length > 0 && (
          <section>
            <Eyebrow className="mb-3">
              Requests waiting · {withRequests.reduce((sum, lot) => sum + lot.claims.filter((c) => c.status === 'pending').length, 0)}
            </Eyebrow>
            <ul className="flex flex-col gap-3">
              {withRequests.map((lot) => (
                <li key={lot.id} className="rounded-[14px] border border-border bg-surface p-3.5">
                  <LotHeading lot={lot} meta={`${lotQuantity(lot)} · ${lotPrice(lot)}`} />
                  <ul className="mt-3 flex flex-col gap-2.5">
                    {lot.claims
                      .filter((claim) => claim.status === 'pending')
                      .map((claim) => (
                        <li key={claim.id} className="flex flex-col gap-2.5 rounded-[10px] bg-sand p-3">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className="text-[14.5px] font-semibold">
                              {displayName(claim.profiles)}
                              {claim.profiles?.city && (
                                <span className="font-normal text-muted">, {claim.profiles.city}</span>
                              )}
                            </span>
                            <span className="text-[13px] text-muted">asked {postedAgo(claim.created_at)}</span>
                          </div>
                          <p className="text-sm">{offerLine(claim, lot)}</p>
                          {claim.message && (
                            <p className="whitespace-pre-line text-[13px] leading-relaxed text-ink-soft">
                              “{claim.message}”
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {claim.profiles?.whatsapp_number && (
                              <a
                                href={waLink(
                                  claim.profiles.whatsapp_number,
                                  `Hi, about your request for my ${lotTitle(lot)} lot on SurplusX.`
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg border border-line bg-surface px-3 py-2 text-[13px] transition-colors hover:border-muted-light"
                              >
                                WhatsApp
                              </a>
                            )}
                            <ActionButton
                              action={acceptClaimAction.bind(null, claim.id)}
                              label="Accept"
                              variant="dark"
                              confirm="Accept this request? The lot goes on hold for this buyer for 48 hours and the other requests are declined."
                            />
                            <ActionButton action={declineClaimAction.bind(null, claim.id)} label="Decline" />
                          </div>
                        </li>
                      ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>
        )}

        {onHold.length > 0 && (
          <section>
            <Eyebrow className="mb-3">On hold · {onHold.length}</Eyebrow>
            <ul className="flex flex-col gap-3">
              {onHold.map((lot) => {
                const claim = lot.claims.find((c) => c.status === 'confirmed')
                const summary = claim
                  ? dealSummary({
                      lot,
                      seller: profile as Profile,
                      buyer: claim.profiles,
                      offerPrice: claim.offer_price,
                      offerQuantity: claim.offer_quantity,
                    })
                  : ''
                const buyerNumber = claim?.profiles?.whatsapp_number
                return (
                  <li key={lot.id} className="flex flex-col gap-3 rounded-[14px] border border-border bg-surface p-3.5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <LotHeading
                        lot={lot}
                        meta={
                          claim ? (
                            <>
                              {displayName(claim.profiles)} · {offerLine(claim, lot)} ·{' '}
                              <span className="text-accent">{timeLeftLabel(claim.reserved_until)}</span>
                            </>
                          ) : (
                            'On hold'
                          )
                        }
                      />
                      <ActionButton
                        action={markLotSoldAction.bind(null, lot.id)}
                        label="Mark sold"
                        variant="dark"
                        confirm="Mark this lot as sold to this buyer?"
                      />
                    </div>
                    {claim && (
                      <DealContact
                        chatLink={buyerNumber ? dealChatLink(buyerNumber, summary) : null}
                        chatLabel="WhatsApp buyer"
                        summary={summary}
                        groupHowTo={GROUP_HOWTO}
                      />
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {quiet.length > 0 && (
          <section>
            <Eyebrow className="mb-3">On the feed · {quiet.length}</Eyebrow>
            <ul className="flex flex-col gap-3">
              {quiet.map((lot) => (
                <li key={lot.id} className="flex flex-col gap-3 rounded-[14px] border border-border bg-surface p-3.5 sm:flex-row sm:items-center">
                  <LotHeading
                    lot={lot}
                    meta={`${lotQuantity(lot)} · ${lotPrice(lot)} · posted ${postedAgo(lot.created_at)}`}
                  />
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
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
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {closed.length > 0 && (
          <section>
            <Eyebrow className="mb-3">Closed · {closed.length}</Eyebrow>
            <ul className="flex flex-col gap-3 opacity-80">
              {closed.map((lot) => {
                const buyer = lot.claims.find((c) => c.status === 'confirmed')
                return (
                  <li key={lot.id} className="flex flex-col gap-3 rounded-[14px] border border-border bg-surface p-3.5 sm:flex-row sm:items-center">
                    <LotHeading
                      lot={lot}
                      meta={
                        buyer
                          ? `Sold to ${displayName(buyer.profiles)} · ${lotQuantity(lot)}`
                          : `${lotQuantity(lot)} · ${lotPrice(lot)}`
                      }
                    />
                    <StatusBadge status={lot.status} />
                  </li>
                )
              })}
            </ul>
          </section>
        )}
      </div>
    </main>
  )
}
