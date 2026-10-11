import Link from 'next/link'
import type { LotWithSeller } from '@/lib/lots/types'
import { lotOrigin, lotPrice, lotQuantity, lotSpecLine, lotTitle } from '@/lib/lots/display'
import { PhotoPlaceholder, Pill } from './ui'
import ClaimRequestButton from './ClaimRequestButton'
import SwatchButton from './SwatchButton'

export default function LotCard({
  lot,
  isOwn,
  swatchRequested,
  alreadyRequested = false,
}: {
  lot: LotWithSeller
  isOwn: boolean
  swatchRequested: boolean
  alreadyRequested?: boolean
}) {
  const title = lotTitle(lot)
  const spec = lotSpecLine(lot)
  const origin = lotOrigin(lot, lot.profiles)
  const href = `/lots/${lot.id}`
  // On hold: still listed so buyers can see what's moving, but nothing to act on until it frees up.
  const onHold = lot.status === 'reserved'

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-[14px] border bg-surface ${
        onHold ? 'border-dashed border-line' : 'border-border'
      }`}
    >
      <Link href={href} className={`group relative block aspect-[3/2] overflow-hidden bg-sand ${onHold ? 'opacity-55' : ''}`}>
        {lot.photo_urls[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={lot.photo_urls[0]}
            alt={title}
            className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 ${
              onHold ? 'grayscale' : 'group-hover:scale-[1.03]'
            }`}
          />
        ) : (
          <PhotoPlaceholder label={title} />
        )}
        {onHold ? (
          <span className="absolute left-3 top-3">
            <Pill tone="accent">On hold</Pill>
          </span>
        ) : (
          lot.urgency_note && (
            <span className="absolute left-3 top-3 max-w-[calc(100%-24px)] truncate rounded-[5px] bg-[rgba(247,244,238,0.94)] px-2 py-[5px] font-mono text-[10px] tracking-[0.06em] uppercase">
              {lot.urgency_note}
            </span>
          )
        )}
      </Link>

      <div className={`flex flex-1 flex-col gap-2.5 p-4 ${onHold ? 'opacity-70' : ''}`}>
        <div className="flex items-baseline justify-between gap-3">
          <Link
            href={href}
            className="min-w-0 text-base leading-[1.3] font-semibold hover:underline hover:decoration-line hover:underline-offset-4"
          >
            {title}
          </Link>
          <span className="whitespace-nowrap font-mono text-sm">{lotPrice(lot)}</span>
        </div>

        {(spec || origin) && (
          <div className="text-[13.5px] leading-[1.6] text-muted">
            {spec}
            {spec && origin && <br />}
            {origin}
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2.5 border-t border-[#EFEBE0] pt-3">
          <span className="font-mono text-[11px] text-muted">{lotQuantity(lot)} available</span>
          {isOwn ? (
            <Link href={href} className="rounded-lg border border-line px-3 py-2 text-[13px] text-muted hover:text-foreground">
              Your lot
            </Link>
          ) : onHold ? (
            <span className="text-[13px] text-muted">Held for another buyer</span>
          ) : (
            <div className="flex gap-2">
              <SwatchButton lotId={lot.id} requested={swatchRequested} />
              <ClaimRequestButton
                lotId={lot.id}
                lotTitle={title}
                quantity={lot.quantity}
                unit={lot.unit}
                pricePerUnit={lot.price_per_unit}
                alreadyRequested={alreadyRequested}
              />
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
