// Device mockups for the marketing page. They mirror screens the app really has: the feed, the
// post-a-lot form, a published listing and an accepted request on hold. Nothing here shows a
// feature that doesn't exist -- no escrow, no in-app inspection report.

const MONO = 'font-plexmono'

const APP_LOTS = [
  { img: '/site/lot-jersey.jpg', name: 'Cotton jersey', price: '₹142', meta: '180 GSM · 4,200 m · Tirupur' },
  { img: '/site/lot-linen.jpg', name: 'Linen twill', price: '₹410', meta: '240 GSM · 1,860 m · Ludhiana' },
  { img: '/site/lot-crepe.jpg', name: 'Viscose crepe', price: '₹96', meta: '110 GSM · 1,100 m · Surat' },
  { img: '/site/warehouse.jpg', name: 'Mixed knit clearance', price: '₹84', meta: '9 rolls · Erode' },
  { img: '/site/inspection.jpg', name: 'Cotton poplin', price: '₹118', meta: '120 GSM · 2,640 m · Erode' },
  { img: '/site/lot-jersey.jpg', name: 'Washed linen', price: '₹365', meta: '190 GSM · 780 m · Coimbatore' },
]

export function LaptopMock() {
  return (
    <div className="rounded-[16px] bg-[#1C1A17] p-[5px] shadow-[0_40px_90px_rgba(28,26,23,0.28),0_0_0_1px_rgba(255,255,255,0.08)_inset]">
      <div className="grid aspect-[16/10] grid-cols-[190px_minmax(0,1fr)] overflow-hidden rounded-[11px] bg-[#FBFAF7] text-left">
        <div className="flex flex-col gap-1 border-r border-[#ECE7DD] bg-[#F7F4EE] px-3 py-[18px]">
          <div className="flex items-center gap-2 px-2 pb-[18px]">
            <span className="grid h-[18px] w-[18px] place-items-center rounded-[6px] bg-[#1C1A17]">
              <span className="h-[7px] w-[7px] rounded-full bg-[#E8892F]" />
            </span>
            <span className="text-[14px] tracking-[-0.02em]">SurplusX</span>
          </div>
          <div className="rounded-lg bg-white px-2.5 py-2 text-[12.5px] shadow-[0_1px_2px_rgba(28,26,23,0.06)]">Browse stock</div>
          <div className="px-2.5 py-2 text-[12.5px] text-[#6E685E]">My claims</div>
          <div className="px-2.5 py-2 text-[12.5px] text-[#6E685E]">My listings</div>
          <div className="px-2.5 py-2 text-[12.5px] text-[#6E685E]">Saved searches</div>
          <div className="mt-auto rounded-lg bg-[#1C1A17] px-2.5 py-[9px] text-center text-[12px] text-[#FBFAF7]">
            + Post a lot
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-3.5 px-5 py-[18px]">
          <div className="flex items-center gap-2.5">
            <div className="flex-1 rounded-[9px] border border-[#E6E0D4] bg-white px-3 py-[9px] text-[12.5px] text-[#8E887E]">
              Search fibre, GSM, colour or mill…
            </div>
            <span className="h-[30px] w-[30px] rounded-full bg-[#D9CBB4]" />
          </div>
          <div className="flex flex-wrap gap-1.5 text-[11.5px]">
            <span className="rounded-full bg-[#1C1A17] px-2.5 py-[5px] text-[#FBFAF7]">All lots</span>
            {['Cotton', 'Linen', 'Denim', 'Viscose', 'Yarn'].map((chip) => (
              <span key={chip} className="rounded-full border border-[#E1DACC] px-2.5 py-[5px]">
                {chip}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {APP_LOTS.map((lot, index) => (
              <div key={index} className="overflow-hidden rounded-[10px] border border-[#ECE7DD] bg-white">
                <div className="relative h-[78px] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={lot.img} alt="" className="absolute inset-0 h-full w-full object-cover" />
                </div>
                <div className="flex flex-col gap-[3px] px-2.5 py-[9px]">
                  <div className="flex justify-between gap-1.5 text-[11.5px]">
                    <span className="truncate">{lot.name}</span>
                    <span className={`${MONO} font-medium`}>{lot.price}</span>
                  </div>
                  <div className="text-[10.5px] text-[#8E887E]">{lot.meta}</div>
                  <div className="mt-[5px] flex gap-[5px]">
                    <span className="flex-1 rounded-[6px] bg-[#1C1A17] p-1 text-center text-[10.5px] text-[#FBFAF7]">Claim</span>
                    <span className="flex-1 rounded-[6px] border border-[#E1DACC] p-1 text-center text-[10.5px]">Swatch</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PhoneShell({ children, tall = false }: { children: React.ReactNode; tall?: boolean }) {
  return (
    <div
      className={`rounded-[42px] bg-[#1C1A17] p-[5px] shadow-[0_40px_80px_rgba(28,26,23,0.35),0_0_0_1px_rgba(255,255,255,0.1)_inset] ${
        tall ? 'w-[290px] rounded-[48px] p-[9px] shadow-[0_50px_90px_rgba(28,26,23,0.22)]' : 'w-[250px]'
      }`}
    >
      <div
        className={`flex flex-col overflow-hidden bg-[#FBFAF7] text-left ${
          tall ? 'h-[min(590px,72vh)] rounded-[40px]' : 'h-[540px] rounded-[38px]'
        }`}
      >
        <div className="flex items-center justify-between px-6 pb-1.5 pt-3.5 text-[12px]">
          <span>9:41</span>
          <span className="h-5 w-[70px] rounded-[20px] bg-[#1C1A17]" />
          <span>5G</span>
        </div>
        {children}
      </div>
    </div>
  )
}

// Hero phone: a listing as a buyer sees it.
export function PhoneLotMock() {
  return (
    <PhoneShell>
      <div className="relative mx-3 mt-1.5 h-[210px] overflow-hidden rounded-[22px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/site/lot-linen.jpg" alt="Sage linen twill" className="absolute inset-0 h-full w-full object-cover" />
        <span className={`absolute left-2.5 top-2.5 rounded-full bg-[rgba(251,250,247,0.92)] px-2 py-1 text-[9.5px] tracking-[0.08em] ${MONO}`}>
          CLEARING THIS MONTH
        </span>
      </div>
      <div className="flex flex-col gap-1 px-[18px] pt-3.5">
        <div className={`text-[10px] tracking-[0.08em] text-[#8E887E] ${MONO}`}>LINEN · LUDHIANA, IN</div>
        <div className="text-[19px] leading-[1.15] tracking-[-0.03em]">European linen twill, 240 GSM</div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-[22px] tracking-[-0.03em]">₹410</span>
          <span className="text-[12px] text-[#8E887E]">per metre · 1,860 m available</span>
        </div>
      </div>
      <div className="mx-[18px] mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
        <div className="rounded-[10px] bg-[#F1EDE5] px-2.5 py-2">
          <div className="text-[#8E887E]">Width</div>
          <div>148 cm</div>
        </div>
        <div className="rounded-[10px] bg-[#F1EDE5] px-2.5 py-2">
          <div className="text-[#8E887E]">Colour</div>
          <div>Sage</div>
        </div>
      </div>
      <div className="mx-3.5 mb-4 mt-auto flex gap-2">
        <span className="flex-1 rounded-[14px] border border-[#E1DACC] p-3 text-center text-[13px]">Swatch</span>
        <span className="flex-[1.6] rounded-[14px] bg-[#E8892F] p-3 text-center text-[13px]">Claim lot</span>
      </div>
    </PhoneShell>
  )
}

// Step 1 — the seller posting a lot.
export function PostLotScreen() {
  return (
    <PhoneShell tall>
      <div className="flex flex-1 flex-col gap-3 px-[18px] pb-[18px] pt-1.5">
        <div className="text-[22px] tracking-[-0.03em]">Post a lot</div>
        <div className="grid grid-cols-3 gap-1.5">
          {['/site/lot-jersey.jpg', '/site/warehouse.jpg'].map((src) => (
            <div key={src} className="relative aspect-square overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          ))}
          <div className="grid aspect-square place-items-center rounded-xl border-[1.5px] border-dashed border-[#D6CEBF] text-[20px] text-[#8E887E]">
            +
          </div>
        </div>
        <div className="flex flex-col gap-1.5 text-[12.5px]">
          <div className="rounded-xl border border-[#E6E0D4] bg-white px-3 py-[9px]">
            <div className="text-[10.5px] text-[#8E887E]">Fabric</div>
            Organic cotton jersey
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded-xl border border-[#E6E0D4] bg-white px-3 py-[9px]">
              <div className="text-[10.5px] text-[#8E887E]">GSM</div>180
            </div>
            <div className="rounded-xl border border-[#E6E0D4] bg-white px-3 py-[9px]">
              <div className="text-[10.5px] text-[#8E887E]">Quantity</div>4,200 m
            </div>
          </div>
          <div className="rounded-xl border border-[#E6E0D4] bg-white px-3 py-[9px]">
            <div className="text-[10.5px] text-[#8E887E]">Where the stock is</div>
            Tirupur, Tamil Nadu
          </div>
        </div>
        <div className="rounded-xl bg-[#F1EDE5] px-3 py-2.5 text-[11.5px] leading-[1.45] text-[#6E685E]">
          Send the details on WhatsApp instead and we’ll draft the listing for you to approve.
        </div>
        <div className="mt-auto rounded-[14px] bg-[#E8892F] p-3.5 text-center text-[13.5px]">Post lot</div>
      </div>
    </PhoneShell>
  )
}

// Step 2 — the listing live, with what the on-floor check found written into it.
export function ListingLiveScreen() {
  return (
    <PhoneShell tall>
      <div className="flex flex-1 flex-col gap-3 px-[18px] pb-[18px] pt-1.5">
        <div className={`text-[10px] tracking-[0.08em] text-[#8E887E] ${MONO}`}>LISTING · LIVE</div>
        <div className="text-[22px] leading-[1.1] tracking-[-0.03em]">Checked on your floor</div>
        <div className="relative h-[150px] overflow-hidden rounded-[16px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/site/inspection.jpg" alt="Fabric inspection table" className="absolute inset-0 h-full w-full object-cover" />
        </div>
        <div className="flex flex-col text-[12.5px]">
          {[
            ['Metreage, re-measured', '4,186 m'],
            ['Rolls seen', '18 of 18'],
            ['Shade groups', '2 dye lots'],
            ['Photos on the listing', '6'],
          ].map(([label, value], index, all) => (
            <div
              key={label}
              className={`flex justify-between py-2.5 ${index < all.length - 1 ? 'border-b border-[#ECE7DD]' : ''}`}
            >
              <span className="text-[#6E685E]">{label}</span>
              <span>{value}</span>
            </div>
          ))}
        </div>
        <div className="mt-auto rounded-[14px] bg-[#1C1A17] p-3.5 text-center text-[13.5px] text-[#FBFAF7]">
          View listing
        </div>
      </div>
    </PhoneShell>
  )
}

// Step 3 — a buyer's request accepted, the lot on hold, contact shared.
export function HoldScreen() {
  return (
    <PhoneShell tall>
      <div className="flex flex-1 flex-col gap-3 px-[18px] pb-[18px] pt-1.5">
        <div className={`text-[10px] tracking-[0.08em] text-[#8E887E] ${MONO}`}>MY LISTINGS · LINEN TWILL</div>
        <div className="text-[22px] leading-[1.1] tracking-[-0.03em]">1,200 m requested</div>
        <div className="flex flex-col gap-1 rounded-[16px] border border-[#ECE7DD] bg-white p-3.5">
          <div className="text-[11px] text-[#8E887E]">Buyer</div>
          <div className="text-[14px]">Sourcing agent · Leeds, UK</div>
          <div className="text-[11.5px] text-[#6E685E]">Asked at ₹395 per metre</div>
        </div>
        <div className="flex flex-col gap-1.5 rounded-[16px] bg-[#1C1A17] p-4 text-[#FBFAF7]">
          <div className={`text-[10px] tracking-[0.08em] opacity-70 ${MONO}`}>ON HOLD FOR THIS BUYER</div>
          <div className="text-[28px] tracking-[-0.03em]">47h left</div>
          <div className="text-[11.5px] opacity-75">Agree payment and pickup between you</div>
        </div>
        <div className="flex flex-col gap-2 text-[12px]">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-[#1C1A17]" />
            Request accepted
          </div>
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-[#E8892F]" />
            Pickup being arranged
          </div>
          <div className="flex items-center gap-2.5 text-[#8E887E]">
            <span className="box-border h-2 w-2 rounded-full border-[1.5px] border-[#C9C1B2]" />
            Marked sold
          </div>
        </div>
        <div className="mt-auto rounded-[14px] bg-[#E8892F] p-3.5 text-center text-[13.5px]">WhatsApp buyer</div>
      </div>
    </PhoneShell>
  )
}
