import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireProfile } from '@/lib/auth/guards'
import { getLotDetail, getLotInterest, getRevealedLotIds } from '@/lib/lots/queries'
import {
  cancelVerificationAction,
  markLotSoldAction,
  relistLotAction,
  requestVerificationAction,
  withdrawLotAction,
} from '@/lib/lots/actions'
import { attributeRows } from '@/lib/lots/categories'
import { VERIFICATION_BLURB } from '@/lib/constants'
import {
  displayName,
  initials,
  lotContact,
  lotPrice,
  lotQuantity,
  lotSpecLine,
  lotTitle,
} from '@/lib/lots/display'
import { postedAgo } from '@/lib/lots/time'
import { waLink } from '@/lib/format'
import type { ProfileSummary } from '@/lib/lots/types'
import { Eyebrow, PhotoPlaceholder } from '@/components/app/ui'
import StatusBadge, { VerificationBadge } from '@/components/app/StatusBadge'
import ContactButton from '@/components/app/ContactButton'
import ActionButton from '@/components/app/ActionButton'

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
  const { supabase, user } = await requireProfile()

  const lot = await getLotDetail(supabase, id)
  if (!lot) notFound()

  const isOwner = lot.seller_id === user.id
  const title = lotTitle(lot)
  const spec = lotSpecLine(lot)
  const { phone, name: contactName } = lotContact(lot, lot.profiles)
  const [interest, revealedLotIds] = await Promise.all([
    isOwner ? getLotInterest(supabase, lot.id) : Promise.resolve([]),
    isOwner ? Promise.resolve(new Set<string>()) : getRevealedLotIds(supabase, user.id),
  ])
  const [cover, ...morePhotos] = lot.photo_urls

  const details: [string, string][] = [
    ['Category', lot.category],
    ['Quantity', lotQuantity(lot)],
    ...attributeRows(lot.category, lot.attributes),
    ...((lot.location ? [['Location', lot.location]] : []) as [string, string][]),
    ['Posted', postedAgo(lot.created_at)],
  ]

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

          {lot.verification === 'verified' && (
            <section className="mt-4 rounded-[14px] border border-ok/25 bg-ok-soft p-4 sm:p-5">
              <div className="mb-2 flex items-center gap-2.5">
                <VerificationBadge status="verified" />
                {lot.verified_at && <span className="text-[13px] text-muted">{postedAgo(lot.verified_at)}</span>}
              </div>
              <p className="text-[15px] leading-relaxed text-ink-soft">
                {lot.verification_notes?.trim() ||
                  'A member of the SurplusX team saw this stock in person and checked it against the listing.'}
              </p>
            </section>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2.5">
              <Eyebrow>{lot.category}</Eyebrow>
              <StatusBadge status={lot.status} />
              {lot.verification === 'verified' && <VerificationBadge status="verified" />}
            </div>
            <h1 className="font-display text-[36px] leading-[1.05] font-normal sm:text-[44px]">{title}</h1>
            {spec && <p className="mt-2 text-[15px] text-muted">{spec}</p>}
            <p className="mt-4 font-mono text-2xl">{lotPrice(lot)}</p>
          </div>

          {lot.urgency_note && (
            <div className="rounded-[10px] bg-sand px-4 py-3 text-sm text-ink-soft">
              <span className="mr-2 font-mono text-[10.5px] tracking-[0.06em] text-accent-text">TIMING</span>
              {lot.urgency_note}
            </div>
          )}

          <section className="rounded-[14px] border border-border bg-surface p-4 sm:p-5">
            {isOwner ? <OwnerPanel /> : <BuyerPanel />}
          </section>

          <dl className="divide-y divide-border rounded-[14px] border border-border bg-surface">
            {details.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-6 px-4 py-3 text-sm">
                <dt className="capitalize text-muted">{label}</dt>
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
    return (
      <div className="flex flex-col gap-5">
        <div>
          <Eyebrow className="mb-2">Your listing</Eyebrow>
          <p className="text-sm leading-relaxed text-ink-soft">
            {interest.length === 0
              ? 'No buyer has taken your contact yet. Buyers call or message you directly.'
              : `${interest.length} ${interest.length === 1 ? 'buyer has' : 'buyers have'} taken your contact.`}
          </p>
          {interest.length > 0 && (
            <ul className="mt-3 flex flex-col gap-2">
              {interest.slice(0, 5).map((view) => (
                <li key={view.id} className="flex items-center justify-between gap-3 rounded-[10px] bg-sand px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-semibold">{displayName(view.profiles)}</div>
                    <div className="truncate text-[12.5px] text-muted">
                      {[view.profiles?.city, postedAgo(view.created_at)].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  {view.profiles?.whatsapp_number && (
                    <a
                      href={waLink(view.profiles.whatsapp_number, `Hi, about my ${title} lot on SurplusX.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-lg border border-line bg-surface px-3 py-2 text-[13px]"
                    >
                      WhatsApp
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border pt-4">
          <div className="mb-2 flex items-center gap-2.5">
            <Eyebrow>Verification</Eyebrow>
            <VerificationBadge status={lot!.verification} />
          </div>
          {lot!.verification === 'none' ? (
            <>
              <p className="mb-3 text-sm leading-relaxed text-ink-soft">
                {VERIFICATION_BLURB} It’s optional and paid — we’ll message you to arrange the visit and the fee.
              </p>
              <ActionButton
                action={requestVerificationAction.bind(null, lot!.id)}
                label="Ask for a check"
                variant="dark"
              />
            </>
          ) : lot!.verification === 'verified' ? (
            <p className="text-sm leading-relaxed text-ink-soft">
              Buyers see the verified badge on this lot and can filter for it.
            </p>
          ) : (
            <>
              <p className="mb-3 text-sm leading-relaxed text-ink-soft">
                {lot!.verification === 'requested'
                  ? 'We’ve got your request and will message you to arrange the visit.'
                  : 'A visit is booked. We’ll update the listing once we’ve seen the stock.'}
              </p>
              <ActionButton action={cancelVerificationAction.bind(null, lot!.id)} label="Cancel request" />
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          {lot!.status === 'available' ? (
            <>
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
            </>
          ) : (
            <ActionButton action={relistLotAction.bind(null, lot!.id)} label="Put back on the feed" variant="dark" />
          )}
        </div>
      </div>
    )
  }

  function BuyerPanel() {
    if (lot!.status !== 'available') {
      return <p className="text-sm text-ink-soft">This lot is no longer available.</p>
    }

    return (
      <div className="flex flex-col gap-3">
        <ContactButton
          lotId={lot!.id}
          revealed={revealedLotIds.has(lot!.id)}
          phone={phone}
          name={contactName}
          variant="full"
        />
        <p className="text-[13px] leading-relaxed text-muted">
          Deals happen directly between you and the seller: price, payment and pickup are between you.
          SurplusX doesn’t take a cut of the trade.
        </p>
      </div>
    )
  }
}
