import Link from 'next/link'
import { requireProfile } from '@/lib/auth/guards'
import { getMyClaims } from '@/lib/lots/queries'
import { cancelClaimAction } from '@/lib/lots/actions'
import { lotOrigin, lotPrice, lotQuantity, lotTitle } from '@/lib/lots/display'
import { postedAgo, timeLeftLabel } from '@/lib/lots/time'
import { GROUP_HOWTO, dealChatLink, dealSummary } from '@/lib/whatsapp/group'
import type { ClaimWithLot, Profile } from '@/lib/lots/types'
import { EmptyState, Eyebrow, PageHeader } from '@/components/app/ui'
import { ClaimStatusBadge } from '@/components/app/StatusBadge'
import ActionButton from '@/components/app/ActionButton'
import DealContact from '@/components/app/DealContact'

type Claim = ClaimWithLot & { lots: NonNullable<ClaimWithLot['lots']> }

function offerLine(claim: Claim) {
  const lot = claim.lots
  const quantity = claim.offer_quantity ? `${claim.offer_quantity} ${lot.unit}` : lotQuantity(lot)
  const price = claim.offer_price ? `₹${claim.offer_price}/${lot.unit}` : lotPrice(lot)
  return `${quantity} at ${price}`
}

function ClaimRow({ claim, children }: { claim: Claim; children?: React.ReactNode }) {
  const lot = claim.lots
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[10px] bg-sand">
          {lot.photo_urls[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={lot.photo_urls[0]} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0">
          <Link href={`/lots/${lot.id}`} className="block truncate text-[15px] font-semibold hover:underline hover:underline-offset-4">
            {lotTitle(lot)}
          </Link>
          <div className="truncate text-[13px] text-muted">
            {[lotOrigin(lot, lot.profiles), offerLine(claim)].filter(Boolean).join(' · ')}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">{children}</div>
    </div>
  )
}

export default async function MyClaimsPage() {
  const { supabase, user, profile } = await requireProfile()
  const claims = (await getMyClaims(supabase, user.id)).filter((claim): claim is Claim => Boolean(claim.lots))

  const waiting = claims.filter((claim) => claim.status === 'pending')
  const held = claims.filter((claim) => claim.status === 'confirmed')
  const past = claims.filter((claim) => claim.status === 'cancelled' || claim.status === 'expired')

  return (
    <main className="flex-1">
      <PageHeader
        title="My claims"
        description="Requests you’ve sent to sellers, and lots being held for you while you close the deal."
      />

      <div className="flex flex-col gap-9 px-4 py-6 sm:px-7 sm:py-8">
        {claims.length === 0 && (
          <EmptyState title="No requests yet">
            <Link href="/feed" className="text-foreground underline underline-offset-4">
              Browse stock
            </Link>{' '}
            and tell a seller what you want and at what price.
          </EmptyState>
        )}

        {held.length > 0 && (
          <section>
            <Eyebrow className="mb-3">On hold for you · {held.length}</Eyebrow>
            <ul className="flex flex-col gap-3">
              {held.map((claim) => {
                const sellerNumber = claim.lots.profiles?.whatsapp_number
                const summary = dealSummary({
                  lot: claim.lots,
                  seller: claim.lots.profiles,
                  buyer: profile as Profile,
                  offerPrice: claim.offer_price,
                  offerQuantity: claim.offer_quantity,
                })
                return (
                  <li key={claim.id} className="flex flex-col gap-3 rounded-[14px] border border-border bg-surface p-3.5">
                    <ClaimRow claim={claim}>
                      <span className="font-mono text-[11px] text-accent">{timeLeftLabel(claim.reserved_until)}</span>
                      <ActionButton
                        action={cancelClaimAction.bind(null, claim.id)}
                        label="Release"
                        confirm="Release this lot? It goes back on the feed for other buyers."
                      />
                    </ClaimRow>
                    <DealContact
                      chatLink={sellerNumber ? dealChatLink(sellerNumber, summary) : null}
                      chatLabel="WhatsApp seller"
                      summary={summary}
                      groupHowTo={GROUP_HOWTO}
                    />
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {waiting.length > 0 && (
          <section>
            <Eyebrow className="mb-3">Waiting on the seller · {waiting.length}</Eyebrow>
            <ul className="flex flex-col gap-3">
              {waiting.map((claim) => (
                <li key={claim.id} className="rounded-[14px] border border-border bg-surface p-3.5">
                  <ClaimRow claim={claim}>
                    <span className="text-[12px] text-muted">sent {postedAgo(claim.created_at)}</span>
                    <ClaimStatusBadge status="pending" />
                    <ActionButton
                      action={cancelClaimAction.bind(null, claim.id)}
                      label="Withdraw"
                      confirm="Withdraw your request?"
                    />
                  </ClaimRow>
                  {claim.message && (
                    <p className="mt-2.5 whitespace-pre-line border-t border-border pt-2.5 text-[13px] leading-relaxed text-ink-soft">
                      “{claim.message}”
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {past.length > 0 && (
          <section>
            <Eyebrow className="mb-3">Past · {past.length}</Eyebrow>
            <ul className="flex flex-col gap-3 opacity-80">
              {past.map((claim) => (
                <li key={claim.id} className="rounded-[14px] border border-border bg-surface p-3.5">
                  <ClaimRow claim={claim}>
                    <span className="text-[12px] text-muted">{postedAgo(claim.created_at)}</span>
                    <ClaimStatusBadge status={claim.status} />
                  </ClaimRow>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  )
}
