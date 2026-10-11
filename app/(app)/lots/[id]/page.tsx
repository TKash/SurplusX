import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireProfile } from '@/lib/auth/guards'
import { getLotDetail, getSwatchLotIds } from '@/lib/lots/queries'
import {
  acceptClaimAction,
  cancelClaimAction,
  declineClaimAction,
  markLotSoldAction,
  withdrawLotAction,
} from '@/lib/lots/actions'
import { displayName, initials, lotPrice, lotQuantity, lotSpecLine, lotTitle } from '@/lib/lots/display'
import { postedAgo, timeLeftLabel } from '@/lib/lots/time'
import { GROUP_HOWTO, dealChatLink, dealSummary } from '@/lib/whatsapp/group'
import type { ClaimWithBuyer, ProfileSummary } from '@/lib/lots/types'
import { Eyebrow, PhotoPlaceholder } from '@/components/app/ui'
import StatusBadge from '@/components/app/StatusBadge'
import ClaimRequestButton from '@/components/app/ClaimRequestButton'
import SwatchButton from '@/components/app/SwatchButton'
import ActionButton from '@/components/app/ActionButton'
import DealContact from '@/components/app/DealContact'

function PersonRow({ profile, role }: { profile: ProfileSummary | null; role: string }) {
  const name = displayName(profile)
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-line text-sm font-semibold text-ink-soft">
        {initials(name)}
      </div>
      <div className="min-w-0">
        <div className="truncate text-[15px] font-semibold">{name}</div>
        <div className="truncate text-[13px] text-muted">{[profile?.city, role].filter(Boolean).join(' · ')}</div>
      </div>
    </div>
  )
}

export default async function LotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, user, profile } = await requireProfile()

  const lot = await getLotDetail(supabase, id)
  if (!lot) notFound()

  const isOwner = lot.seller_id === user.id
  const title = lotTitle(lot)
  const spec = lotSpecLine(lot)
  const requests = lot.claims.filter((claim) => claim.status === 'pending')
  const heldClaim = lot.claims.find((claim) => claim.status === 'confirmed')
  const myClaim = isOwner ? undefined : lot.claims.find((claim) => claim.buyer_id === user.id)
  const swatchRequested = isOwner ? false : (await getSwatchLotIds(supabase, user.id)).has(lot.id)
  const [cover, ...morePhotos] = lot.photo_urls

  const details = (
    [
      ['Quantity', lotQuantity(lot)],
      ['GSM', lot.gsm ? String(lot.gsm) : null],
      ['Width', lot.width_cm ? `${lot.width_cm} cm` : null],
      ['Colour', lot.colour],
      ['Spec', lot.spec],
      ['Location', lot.location],
      ['Posted', postedAgo(lot.created_at)],
    ] as [string, string | null][]
  ).filter((row): row is [string, string] => Boolean(row[1]))

  // Offer wording for a request: what the buyer asked for, against what's listed.
  function offerLine(claim: ClaimWithBuyer) {
    const quantity = claim.offer_quantity ? `${claim.offer_quantity} ${lot!.unit}` : lotQuantity(lot!)
    const price = claim.offer_price ? `₹${claim.offer_price}/${lot!.unit}` : lotPrice(lot!)
    return `${quantity} at ${price}`
  }

  function summaryFor(claim: ClaimWithBuyer, seller: ProfileSummary | null, buyer: ProfileSummary | null) {
    return dealSummary({
      lot: lot!,
      seller,
      buyer,
      offerPrice: claim.offer_price,
      offerQuantity: claim.offer_quantity,
    })
  }

  return (
    <main className="flex-1 px-4 pb-10 pt-5 sm:px-7 sm:pt-7">
      <Link href="/feed" className="mb-5 inline-flex text-sm text-muted hover:text-foreground">
        ← Back to stock
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-10">
        <div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[14px] bg-sand">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt={title} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <PhotoPlaceholder label={title} />
            )}
          </div>
          {morePhotos.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-3">
              {morePhotos.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative block aspect-square overflow-hidden rounded-[10px] bg-sand"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`${title}, another photo`} className="absolute inset-0 h-full w-full object-cover" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2.5">
              <Eyebrow>{lot.category}</Eyebrow>
              <StatusBadge status={lot.status} />
            </div>
            <h1 className="font-display text-[36px] leading-[1.05] font-normal sm:text-[44px]">{title}</h1>
            {spec && <p className="mt-2 text-[15px] text-muted">{spec}</p>}
            <p className="mt-4 font-mono text-2xl">{lotPrice(lot)}</p>
          </div>

          {lot.urgency_note && (
            <div className="rounded-[10px] bg-sand px-4 py-3 text-sm text-ink-soft">
              <span className="mr-2 font-mono text-[10.5px] tracking-[0.06em] text-accent">TIMING</span>
              {lot.urgency_note}
            </div>
          )}

          <section className="rounded-[14px] border border-border bg-surface p-4 sm:p-5">
            {isOwner ? <OwnerPanel /> : <BuyerPanel />}
          </section>

          <dl className="divide-y divide-border rounded-[14px] border border-border bg-surface">
            {details.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-6 px-4 py-3 text-sm">
                <dt className="text-muted">{label}</dt>
                <dd className="text-right">{value}</dd>
              </div>
            ))}
          </dl>

          {lot.notes && (
            <div>
              <Eyebrow className="mb-2">Notes from the seller</Eyebrow>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">{lot.notes}</p>
            </div>
          )}

          {!isOwner && (
            <div className="rounded-[14px] bg-sand px-4 py-3.5">
              <PersonRow profile={lot.profiles} role="Seller" />
            </div>
          )}
        </div>
      </div>
    </main>
  )

  function OwnerPanel() {
    if (heldClaim) {
      const buyerNumber = heldClaim.profiles?.whatsapp_number
      const summary = summaryFor(heldClaim, profile, heldClaim.profiles)
      return (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <Eyebrow>On hold for this buyer</Eyebrow>
            <span className="font-mono text-[11px] text-accent">{timeLeftLabel(heldClaim.reserved_until)}</span>
          </div>
          <PersonRow profile={heldClaim.profiles} role="Buyer" />
          <p className="text-sm leading-relaxed text-ink-soft">
            You accepted {offerLine(heldClaim)}. Agree payment and pickup directly, then mark it sold.
          </p>
          <DealContact
            chatLink={buyerNumber ? dealChatLink(buyerNumber, summary) : null}
            chatLabel="WhatsApp buyer"
            summary={summary}
            groupHowTo={GROUP_HOWTO}
          />
          <div className="flex flex-wrap gap-2">
            <ActionButton
              action={markLotSoldAction.bind(null, lot!.id)}
              label="Mark as sold"
              variant="dark"
              confirm="Mark this lot as sold to this buyer?"
            />
          </div>
        </div>
      )
    }

    if (lot!.status === 'available') {
      return (
        <div className="flex flex-col gap-4">
          <Eyebrow>{requests.length > 0 ? `Requests · ${requests.length}` : 'Your listing'}</Eyebrow>
          {requests.length === 0 ? (
            <p className="text-sm leading-relaxed text-ink-soft">
              No requests yet. Buyers send what they want and at what price; accepting one holds the lot
              for them for 48 hours.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {requests.map((claim) => {
                const buyerNumber = claim.profiles?.whatsapp_number
                return (
                  <li key={claim.id} className="flex flex-col gap-3 rounded-[10px] bg-sand p-3.5">
                    <PersonRow profile={claim.profiles} role={`Asked ${postedAgo(claim.created_at)}`} />
                    <p className="text-sm text-foreground">{offerLine(claim)}</p>
                    {claim.message && (
                      <p className="whitespace-pre-line text-[13px] leading-relaxed text-ink-soft">
                        “{claim.message}”
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {buyerNumber && (
                        <a
                          href={`https://wa.me/${buyerNumber.replace(/[^\d]/g, '')}`}
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
                        confirm="Accept this request? The lot goes on hold for this buyer for 48 hours and other requests are declined."
                      />
                      <ActionButton action={declineClaimAction.bind(null, claim.id)} label="Decline" />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <ActionButton
              action={markLotSoldAction.bind(null, lot!.id)}
              label="Mark as sold"
              confirm="Mark this lot as sold? It will be removed from the feed."
            />
            <ActionButton
              action={withdrawLotAction.bind(null, lot!.id)}
              label="Withdraw"
              variant="danger"
              confirm="Withdraw this lot? It will be removed from the feed."
            />
          </div>
        </div>
      )
    }

    if (lot!.status === 'sold') {
      const buyer = lot!.claims.find((claim) => claim.status === 'confirmed')
      return (
        <div className="flex flex-col gap-3">
          <Eyebrow>Sold</Eyebrow>
          {buyer ? <PersonRow profile={buyer.profiles} role="Buyer" /> : <p className="text-sm text-ink-soft">You marked this lot as sold.</p>}
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-2">
        <Eyebrow>Withdrawn</Eyebrow>
        <p className="text-sm text-ink-soft">This lot isn’t visible to buyers.</p>
      </div>
    )
  }

  function BuyerPanel() {
    const sellerNumber = lot!.profiles?.whatsapp_number

    if (myClaim?.status === 'confirmed') {
      const summary = summaryFor(myClaim, lot!.profiles, profile)
      return (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <Eyebrow>On hold for you</Eyebrow>
            <span className="font-mono text-[11px] text-accent">{timeLeftLabel(myClaim.reserved_until)}</span>
          </div>
          <p className="text-sm leading-relaxed text-ink-soft">
            The seller accepted {offerLine(myClaim)}. Agree payment and pickup with them directly; the
            hold lapses after 48 hours.
          </p>
          <DealContact
            chatLink={sellerNumber ? dealChatLink(sellerNumber, summary) : null}
            chatLabel="WhatsApp seller"
            summary={summary}
            groupHowTo={GROUP_HOWTO}
          />
          <div>
            <ActionButton
              action={cancelClaimAction.bind(null, myClaim.id)}
              label="Release hold"
              confirm="Release this lot? It goes back on the feed for other buyers."
            />
          </div>
        </div>
      )
    }

    if (myClaim?.status === 'pending') {
      return (
        <div className="flex flex-col gap-3">
          <Eyebrow>Request sent</Eyebrow>
          <p className="text-sm leading-relaxed text-ink-soft">
            You asked for {offerLine(myClaim)}. The seller decides whether to hold it for you — you’ll
            get a WhatsApp message either way.
          </p>
          <div>
            <ActionButton
              action={cancelClaimAction.bind(null, myClaim.id)}
              label="Withdraw request"
              confirm="Withdraw your request?"
            />
          </div>
        </div>
      )
    }

    if (lot!.status === 'reserved') {
      return (
        <div className="flex flex-col gap-2">
          <Eyebrow>On hold</Eyebrow>
          <p className="text-sm leading-relaxed text-ink-soft">
            Another buyer’s request was accepted. If the deal doesn’t close within 48 hours, this lot
            comes back to the feed.
          </p>
        </div>
      )
    }

    if (lot!.status === 'available') {
      return (
        <div className="flex flex-col gap-3">
          {myClaim?.status === 'cancelled' && (
            <p className="text-[13px] text-muted">
              Your earlier request wasn’t taken up. You can ask again with different terms.
            </p>
          )}
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <div className="flex-1">
              <ClaimRequestButton
                lotId={lot!.id}
                lotTitle={title}
                quantity={lot!.quantity}
                unit={lot!.unit}
                pricePerUnit={lot!.price_per_unit}
                variant="full"
              />
            </div>
            <div className="flex-1">
              <SwatchButton lotId={lot!.id} requested={swatchRequested} variant="full" />
            </div>
          </div>
          <p className="text-[13px] leading-relaxed text-muted">
            Tell the seller how much you want and at what price. If they accept, the lot is held for you
            for 48 hours and you deal with them directly.
          </p>
        </div>
      )
    }

    return <p className="text-sm text-ink-soft">This lot is no longer available.</p>
  }
}
