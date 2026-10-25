'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { InterestScreen, LaptopMock, ListingLiveScreen, PhoneLotMock, PostLotScreen } from './mocks'

// Marketing page from the "SurplusX Story Site" Claude Design handoff. Scroll drives everything:
// the hero pins and dissolves, three phrases type themselves in, the selling steps swap the phone
// screen, and the page tints forest green through the "less waste" section.
//
// Motion is written straight to the DOM from one requestAnimationFrame loop (refs, not state), so
// scrolling doesn't re-render React on every frame. Scroll position and reveal progress are lerped
// so motion eases rather than steps, as the handoff specifies.

const PHRASES = [
  'Every season, the mills that clothe the world end up with fabric nobody ordered. Overruns. Cancelled colours.',
  'The last good rolls of a lot. It sits in the shed, gets sold by the kilo, or never leaves at all.',
  'SurplusX gives it somewhere to go.',
]

// The product name in the last phrase is the one coloured word.
const ACCENT_WORD = 'SurplusX'

const STEPS = [
  {
    n: '01',
    title: 'Photograph it.',
    titleRest: 'We’ll write it.',
    body: 'Send a few photos and the spec from your phone, on the web form or on WhatsApp. We turn it into a listing you approve before it goes live.',
  },
  {
    n: '02',
    title: 'Want it checked?',
    titleRest: 'We’ll come and look.',
    body: 'Optional and paid: we visit your floor, re-measure the stock, look over the rolls and group the dye lots. What we find goes on the listing, and the lot carries a verified badge buyers can filter for.',
  },
  {
    n: '03',
    title: 'Buyers call you.',
    titleRest: 'The deal stays yours.',
    body: 'Anyone interested takes your number straight off the listing and gets in touch. Price, payment and pickup are between you — we don’t sit in the middle or take a cut.',
  },
]

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))
const smoothstep = (p: number) => p * p * (3 - 2 * p)

export default function StorySite() {
  const [step, setStep] = useState(0)

  const shadowRef = useRef<HTMLDivElement>(null)
  const tintRef = useRef<HTMLDivElement>(null)
  const navPillRef = useRef<HTMLDivElement>(null)
  const navInkRef = useRef<HTMLAnchorElement>(null)
  const skyRef = useRef<HTMLDivElement>(null)
  const heroTextRef = useRef<HTMLDivElement>(null)
  const laptopRef = useRef<HTMLDivElement>(null)
  const phoneRef = useRef<HTMLDivElement>(null)
  const revealRef = useRef<HTMLElement>(null)
  const phraseRefs = useRef<(HTMLParagraphElement | null)[]>([])
  const charRefs = useRef<HTMLSpanElement[][]>([])
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])
  const wasteImgRef = useRef<HTMLImageElement>(null)
  const wasteBlockRef = useRef<HTMLDivElement>(null)
  const wasteHeadRef = useRef<HTMLDivElement>(null)
  const wasteBodyRef = useRef<HTMLDivElement>(null)
  const wastePtsRef = useRef<HTMLDivElement>(null)
  const joinRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Reduced motion: show the story text in place and leave every layer still.
    if (reduced) {
      for (const chars of charRefs.current) {
        for (const char of chars ?? []) {
          if (char) {
            char.style.opacity = '1'
            char.style.transform = 'none'
          }
        }
      }
      phraseRefs.current.forEach((phrase, index) => {
        if (phrase) phrase.style.opacity = index === PHRASES.length - 1 ? '1' : '0'
      })
      return
    }

    let frame = 0
    let y = window.scrollY
    let reveal = 0
    let lastStep = -1

    function paint() {
      const vh = window.innerHeight
      const targetY = window.scrollY
      y += (targetY - y) * 0.1

      const revealEl = revealRef.current
      let targetReveal = 0
      let fade = 0
      if (revealEl) {
        const box = revealEl.getBoundingClientRect()
        targetReveal = clamp01(-box.top / Math.max(1, box.height - vh))
        fade = clamp01(-box.top / (vh * 0.5))
      }
      reveal += (targetReveal - reveal) * 0.09

      // Hero: text lifts and fades, sky drifts, devices part at different speeds.
      const hp = clamp01(y / (vh * 0.75))
      const heroFade = clamp01(hp / 0.55)
      if (heroTextRef.current) {
        heroTextRef.current.style.opacity = String(1 - heroFade)
        heroTextRef.current.style.transform = `translateY(${-heroFade * 36}px)`
      }
      if (skyRef.current) skyRef.current.style.transform = `translateY(${-hp * 30}px)`
      const deviceLift = Math.min(y, vh * 2)
      if (laptopRef.current) laptopRef.current.style.transform = `translateY(${-deviceLift * 0.5}px)`
      if (phoneRef.current) phoneRef.current.style.transform = `translateY(${-deviceLift * 0.64}px)`

      // Story text: each phrase types in character by character, then fades out in place.
      PHRASES.forEach((_, index) => {
        const phrase = phraseRefs.current[index]
        if (!phrase) return
        const local = reveal * PHRASES.length - index
        const inP = clamp01(local / 0.7)
        const chars = charRefs.current[index] ?? []
        chars.forEach((char, k) => {
          if (!char) return
          const p = smoothstep(clamp01(inP * 3.2 - (k / Math.max(1, chars.length)) * 2.2))
          char.style.opacity = String(p)
          char.style.transform = `translateY(${-(1 - p) * 14}px)`
        })
        const isLast = index === PHRASES.length - 1
        const out = isLast ? 0 : smoothstep(clamp01((local - 0.82) / 0.16))
        phrase.style.opacity = String(1 - out)
      })

      // Ambient shadow fades in with the story and is gone before the closing sky.
      const joinTop = joinRef.current?.getBoundingClientRect().top ?? vh * 4
      const shadowOut = 1 - clamp01((vh * 1.4 - joinTop) / (vh * 0.6))
      if (shadowRef.current) shadowRef.current.style.opacity = String(0.55 * fade * shadowOut)

      // Green page tint, driven by the "less waste" points block.
      let tint = 0
      const pts = wastePtsRef.current?.getBoundingClientRect()
      if (pts) {
        tint =
          clamp01((vh * 1.45 - pts.top) / (vh * 0.55)) * (1 - clamp01((vh * 0.6 - pts.bottom) / (vh * 0.45)))
      }
      if (tintRef.current) tintRef.current.style.opacity = String(tint)

      // Nav: glass over the hero sky, solid once scrolled, light while the page is green.
      if (navPillRef.current && navInkRef.current) {
        const light = tint > 0.5
        const scrolled = window.scrollY > 60
        navPillRef.current.style.background = light
          ? 'rgba(38,51,42,0.55)'
          : scrolled
            ? 'rgba(251,250,247,0.82)'
            : 'rgba(255,255,255,0.14)'
        navPillRef.current.style.borderColor = light
          ? 'rgba(241,239,230,0.16)'
          : scrolled
            ? 'rgba(28,26,23,0.08)'
            : 'rgba(255,255,255,0.28)'
        const ink = light ? '#F1EFE6' : scrolled ? '#1C1A17' : '#FFFFFF'
        navPillRef.current.style.color = ink
        navInkRef.current.style.color = ink
      }

      // Hillside: image and type drift at different rates, text leaving faster than it arrives.
      const block = wasteBlockRef.current?.getBoundingClientRect()
      if (block) {
        const w = Math.max(-1, Math.min(1, (block.top + block.height / 2 - vh / 2) / vh))
        if (wasteImgRef.current) wasteImgRef.current.style.transform = `translateY(${w * 36}px)`
        if (wasteHeadRef.current) wasteHeadRef.current.style.transform = `translateY(${w > 0 ? w * 40 : w * 120}px)`
        if (wasteBodyRef.current) wasteBodyRef.current.style.transform = `translateY(${w > 0 ? w * 70 : w * 190}px)`
      }

      // Whichever selling step sits nearest the middle of the screen drives the phone.
      let nearest = 0
      let best = Infinity
      stepRefs.current.forEach((el, index) => {
        if (!el) return
        const box = el.getBoundingClientRect()
        const distance = Math.abs(box.top + box.height / 2 - vh / 2)
        if (distance < best) {
          best = distance
          nearest = index
        }
      })
      if (nearest !== lastStep) {
        lastStep = nearest
        setStep(nearest)
      }

      frame = requestAnimationFrame(paint)
    }

    frame = requestAnimationFrame(paint)
    return () => cancelAnimationFrame(frame)
  }, [])

  const screens = [<PostLotScreen key="0" />, <ListingLiveScreen key="1" />, <InterestScreen key="2" />]

  return (
    <main className="relative min-h-dvh flex-1 overflow-x-clip bg-[#F4F1EB] font-rom text-[#1C1A17] antialiased">
      {/* Fixed ambient light layer: a soft moving shadow across the whole page. */}
      <div
        ref={shadowRef}
        aria-hidden="true"
        className="pointer-events-none fixed -inset-[12%] z-0 bg-cover bg-center opacity-0 mix-blend-multiply blur-[1.5px] contrast-[1.15] motion-safe:animate-[site-sway_26s_ease-in-out_infinite_alternate]"
        style={{ backgroundImage: 'url(/site/ambient-shadow.jpg)' }}
      />
      {/* Fixed green wash for the "less waste" stretch. */}
      <div ref={tintRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 bg-[#26332A] opacity-0" />

      <nav className="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-center justify-between px-[clamp(16px,3vw,36px)] py-5">
        <Link href="#top" aria-label="SurplusX" ref={navInkRef} className="pointer-events-auto flex items-center text-white">
          <span
            className="block h-[38px] w-[108px] bg-current transition-colors duration-200 sm:h-[53px] sm:w-[150px]"
            style={{
              WebkitMask: 'url(/brand/surplusx-logo.svg) center / contain no-repeat',
              mask: 'url(/brand/surplusx-logo.svg) center / contain no-repeat',
            }}
          />
        </Link>
        <div
          ref={navPillRef}
          className="pointer-events-auto flex items-center gap-1 rounded-[14px] border p-[5px] text-white backdrop-blur-[14px] transition-colors duration-200"
          style={{ background: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.28)' }}
        >
          {/* Below sm only "Log in" and the CTA fit; the section links live in the page itself. */}
          <a href="#story" className="hidden px-3.5 py-[9px] text-[15px] transition-opacity hover:opacity-75 sm:block">
            How it works
          </a>
          <a href="#buyers" className="hidden px-3.5 py-[9px] text-[15px] transition-opacity hover:opacity-75 sm:block">
            Browse stock
          </a>
          <a href="#standard" className="hidden px-3.5 py-[9px] text-[15px] transition-opacity hover:opacity-75 sm:block">
            Verification
          </a>
          <Link href="/login" className="px-3 py-[9px] text-[14px] transition-opacity hover:opacity-75 sm:px-3.5 sm:text-[15px]">
            Log in
          </Link>
          <Link
            href="/login"
            className="whitespace-nowrap rounded-[10px] bg-[#E8892F] px-3.5 py-2.5 font-plexmono text-[12px] font-medium tracking-[0.04em] text-[#1C1A17] transition-opacity hover:opacity-90 sm:px-[18px] sm:py-[11px] sm:text-[13px]"
          >
            LIST SURPLUS
          </Link>
        </div>
      </nav>

      {/* ---------------- Hero ---------------- */}
      <div className="relative z-[1] h-[175vh]">
        <header
          id="top"
          className="sticky top-0 box-border h-dvh px-[clamp(16px,4vw,48px)] pt-[clamp(120px,16vh,170px)] text-center"
          style={{
            WebkitMaskImage:
              'linear-gradient(180deg, #000 0%, #000 68%, rgba(0,0,0,0.45) 84%, transparent 98%)',
            maskImage: 'linear-gradient(180deg, #000 0%, #000 68%, rgba(0,0,0,0.45) 84%, transparent 98%)',
          }}
        >
          <div className="absolute inset-0 -z-[1] overflow-hidden">
            <div
              ref={skyRef}
              className="absolute inset-0 bg-cover bg-center motion-safe:animate-[site-sky_60s_ease-in-out_infinite_alternate]"
              style={{ backgroundImage: 'url(/site/hero-sky.jpg)' }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,34,58,0.32)_0%,rgba(18,34,58,0.08)_26%,rgba(18,34,58,0)_50%)]" />
          </div>

          <div ref={heroTextRef} className="will-change-[transform,opacity]">
            <div className="mb-[26px] inline-flex items-center gap-2.5 rounded-full border border-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.16)] py-1.5 pl-3.5 pr-1.5 text-[13px] text-white backdrop-blur-[10px]">
              <span>Now onboarding our first mills</span>
              <span className="rounded-full bg-[rgba(255,255,255,0.92)] px-2.5 py-[5px] font-plexmono text-[11px] tracking-[0.1em] text-[#1C1A17]">
                EARLY ACCESS
              </span>
            </div>

            <h1 className="mx-auto max-w-[860px] font-arizona text-[clamp(40px,6vw,84px)] leading-none font-normal tracking-[-0.05em] text-white [text-shadow:0_2px_30px_rgba(18,34,58,0.18)] [text-wrap:balance]">
              Make value out of your surplus inventory.
            </h1>

            <p className="mx-auto mt-[22px] max-w-[500px] text-[clamp(15px,1.25vw,17px)] leading-[1.55] text-[rgba(255,255,255,0.94)] [text-wrap:pretty]">
              SurplusX is the exchange for mills, agents and garment units. List what’s left over — fibre,
              yarn, fabric, trims or garments — and buyers call you directly.
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-2.5">
              <Link
                href="/login"
                className="rounded-[9px] bg-white px-[19px] py-[13px] font-plexmono text-[12.5px] font-medium tracking-[0.04em] text-[#1C1A17] shadow-[0_10px_30px_rgba(18,34,58,0.18)] transition-opacity hover:opacity-90"
              >
                LIST YOUR SURPLUS →
              </Link>
              <Link
                href="/login"
                className="rounded-[9px] border border-[rgba(255,255,255,0.45)] bg-[rgba(255,255,255,0.14)] px-[19px] py-[13px] font-plexmono text-[12.5px] font-medium tracking-[0.04em] text-white backdrop-blur-[10px] transition-opacity hover:opacity-90"
              >
                BROWSE STOCK
              </Link>
            </div>
          </div>

          <div className="relative mx-auto mt-[calc(clamp(48px,7vh,80px)-160px)] box-border hidden max-w-[1140px] px-[140px] pb-20 pt-[160px] sm:block">
            <div ref={laptopRef} className="will-change-transform">
              <LaptopMock />
            </div>
            <div
              ref={phoneRef}
              className="absolute right-[70px] top-[280px] z-[2] hidden will-change-transform xl:block"
            >
              <PhoneLotMock />
            </div>
          </div>
        </header>
      </div>

      {/* ---------------- Story text ---------------- */}
      <section ref={revealRef} className="relative z-[1] -mt-[25vh] h-[560vh]">
        <div className="sticky top-0 box-border grid h-dvh place-items-center px-[clamp(20px,6vw,96px)]">
          <div className="relative h-[70vh] w-full max-w-[1240px]">
            {PHRASES.map((phrase, index) => (
              <p
                key={index}
                ref={(el) => {
                  phraseRefs.current[index] = el
                }}
                className="absolute inset-0 m-0 flex flex-wrap content-center justify-center gap-x-[0.26em] text-center font-arizona text-[clamp(32px,4.4vw,66px)] leading-[1.12] tracking-[-0.05em]"
              >
                {phrase.split(' ').map((word, wordIndex, words) => {
                  // Character index across the whole phrase drives the stagger.
                  const before = words.slice(0, wordIndex).join(' ').length + (wordIndex ? 1 : 0)
                  return (
                    <span
                      key={wordIndex}
                      className="inline-flex whitespace-nowrap"
                      style={word === ACCENT_WORD ? { color: '#D27322' } : undefined}
                    >
                      {word.split('').map((character, charIndex) => (
                        <span
                          key={charIndex}
                          ref={(el) => {
                            if (!el) return
                            charRefs.current[index] ??= []
                            charRefs.current[index][before + charIndex] = el
                          }}
                          className="inline-block opacity-0"
                        >
                          {character}
                        </span>
                      ))}
                    </span>
                  )
                })}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- How selling works ---------------- */}
      <section id="story" className="relative z-[1] px-[clamp(20px,6vw,96px)] pb-[120px] pt-10">
        <div className="mb-6 font-plexmono text-[12px] tracking-[0.14em] text-[#8E887E]">02 — HOW SELLING WORKS</div>
        <h2 className="m-0 mb-[72px] max-w-[980px] font-arizona text-[clamp(36px,5vw,72px)] leading-[1.02] font-normal tracking-[-0.05em] [text-wrap:balance]">
          Three steps. <span className="text-[#9A9488]">Your stock stays on your floor, and the deal stays yours.</span>
        </h2>

        <div className="grid grid-cols-1 items-start gap-[clamp(32px,6vw,96px)] lg:grid-cols-2">
          <div className="sticky top-[max(72px,calc((100dvh-min(608px,74vh))/2))] hidden justify-center lg:flex">
            {screens[step]}
          </div>

          <div className="flex flex-col pb-[20vh]">
            {STEPS.map((item, index) => (
              <div
                key={item.n}
                ref={(el) => {
                  stepRefs.current[index] = el
                }}
                className="flex min-h-[72vh] flex-col justify-center transition-opacity duration-[400ms]"
                style={{ opacity: step === index ? 1 : 0.28 }}
              >
                <div className="mb-4 font-plexmono text-[13px] text-[#D27322]">{item.n}</div>
                <h3 className="m-0 mb-4 font-arizona text-[clamp(30px,3.4vw,48px)] leading-[1.05] font-normal tracking-[-0.05em]">
                  {item.title} <span>{item.titleRest}</span>
                </h3>
                <p className="m-0 max-w-[460px] text-[18px] leading-[1.55] text-[#5E594F] [text-wrap:pretty]">
                  {item.body}
                </p>
                <div className="mt-8 lg:hidden">{screens[index]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- For buyers / what the app does ---------------- */}
      <section id="buyers" className="relative z-[1] px-[clamp(20px,6vw,96px)] pb-[120px] pt-20">
        <div className="mb-14 grid grid-cols-1 items-end gap-8 lg:grid-cols-2 lg:gap-[clamp(32px,6vw,96px)]">
          <div>
            <div className="mb-6 font-plexmono text-[12px] tracking-[0.14em] text-[#8E887E]">
              03 — BUILT FROM INSIDE THE TRADE
            </div>
            <h2 className="m-0 max-w-[820px] font-arizona text-[clamp(36px,5vw,72px)] leading-[1.02] font-normal tracking-[-0.05em] [text-wrap:balance]">
              Made with a surplus broker’s 20+ years of deals behind it.
            </h2>
          </div>
          <div className="flex lg:justify-end">
            <Link
              href="/login"
              className="rounded-[10px] bg-[#1C1A17] px-5 py-3.5 font-plexmono text-[13px] font-medium tracking-[0.04em] text-[#F4F1EB] transition-opacity hover:opacity-90"
            >
              BROWSE STOCK →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <FeatureCard
            image="/site/warehouse.jpg"
            alt="Fabric rolls in a mill shed"
            title="List in minutes"
            body="Category, spec, quantity, price and location, plus a few photos, and it’s live."
          >
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.12)] px-[18px] py-4">
              <span className="font-plexmono text-[11px] tracking-[0.16em]">NEW LISTING</span>
              <span className="rounded-full bg-[#E8892F] px-[9px] py-1 font-plexmono text-[10.5px] tracking-[0.08em] text-[#1C1A17]">
                LIVE
              </span>
            </div>
            <div className="px-[18px] pb-[18px] pt-2">
              {[
                ['Category', 'Cotton · jersey'],
                ['Spec', '180 GSM · ecru'],
                ['Quantity', '4,200 m'],
                ['Price', '₹142 / m'],
                ['Location', 'Tirupur, IN'],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-3 border-b border-[rgba(255,255,255,0.1)] py-[9px] text-[13px]"
                >
                  <span className="text-[rgba(251,250,247,0.65)]">{label}</span>
                  <span>{value}</span>
                </div>
              ))}
              <div className="mt-3.5 grid grid-cols-4 gap-1.5">
                {['/site/lot-jersey.jpg', '/site/warehouse.jpg', '/site/inspection.jpg'].map((src) => (
                  <div key={src} className="relative aspect-square overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  </div>
                ))}
                <div className="grid aspect-square place-items-center rounded-lg border border-dashed border-[rgba(255,255,255,0.35)] text-[rgba(251,250,247,0.7)]">
                  +
                </div>
              </div>
            </div>
          </FeatureCard>

          <FeatureCard
            image="/site/lot-linen.jpg"
            alt="Sage linen twill"
            title="Verified, if you want it"
            body="Pay for a visit and we re-measure the stock on your floor. The listing then carries what we found, and a badge buyers filter for."
          >
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.12)] px-[18px] py-4">
              <span className="font-plexmono text-[11px] tracking-[0.16em]">VERIFIED LOT</span>
              <span className="rounded-full bg-[#FBFAF7] px-2 py-1 font-plexmono text-[10.5px] tracking-[0.06em] text-[#1C1A17]">
                ✓ CHECKED
              </span>
            </div>
            <div className="flex flex-col gap-3.5 p-[18px]">
              {[
                ['Metreage, re-measured', '4,186 m'],
                ['Rolls seen', '18 of 18'],
                ['Shade groups', '2 dye lots'],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-3 border-b border-[rgba(255,255,255,0.1)] pb-2.5 text-[13px]"
                >
                  <span className="text-[rgba(251,250,247,0.65)]">{label}</span>
                  <span>{value}</span>
                </div>
              ))}
              <div className="text-[13px] leading-[1.5] text-[rgba(251,250,247,0.8)]">
                “Counted on a metre counter with the mill’s man present. Two shade groups, kept separate.”
              </div>
            </div>
          </FeatureCard>

          <FeatureCard
            image="/site/lot-crepe.jpg"
            alt="Dusty rose viscose crepe"
            title="The deal stays yours"
            body="Buyers take your number off the listing and call you. Price, payment and pickup are between you, and we take no cut."
          >
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.12)] px-[18px] py-4">
              <span className="font-plexmono text-[11px] tracking-[0.16em]">BUYER CONTACT</span>
            </div>
            <div className="flex flex-col gap-3.5 p-[18px]">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#D9CBB4] text-[14px] text-[#1C1A17]">
                  RK
                </span>
                <div>
                  <div className="text-[15px]">Rhea Kapoor</div>
                  <div className="text-[12.5px] text-[rgba(251,250,247,0.65)]">Sourcing lead · Leeds</div>
                </div>
              </div>
              <div>
                {[
                  ['WhatsApp', '+91 98 4012 ····'],
                  ['Asked for', '1,200 m'],
                  ['At', '₹395 / m'],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between gap-3 border-b border-[rgba(255,255,255,0.1)] py-[9px] text-[13px]"
                  >
                    <span className="text-[rgba(251,250,247,0.65)]">{label}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2 text-[13px]">
                {['Price', 'Payment', 'Pickup'].map((label) => (
                  <div key={label} className="flex justify-between">
                    <span>{label}</span>
                    <span className="text-[rgba(251,250,247,0.65)]">Between you</span>
                  </div>
                ))}
              </div>
              <div className="rounded-[10px] bg-[#FBFAF7] p-[11px] text-center text-[13px] text-[#1C1A17]">
                WhatsApp buyer
              </div>
            </div>
          </FeatureCard>
        </div>
      </section>

      {/* ---------------- Less waste ---------------- */}
      <section id="waste" className="relative z-[1] text-[#1C1A17]">
        <div ref={wasteBlockRef} className="relative min-h-dvh w-full overflow-hidden [aspect-ratio:2000/1939]">
          <div
            className="absolute inset-0 overflow-hidden bg-[#ECEBE6]"
            style={{
              WebkitMaskImage:
                'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.5) 6%, #000 16%, #000 72%, rgba(0,0,0,0.45) 86%, transparent 100%)',
              maskImage:
                'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.5) 6%, #000 16%, #000 72%, rgba(0,0,0,0.45) 86%, transparent 100%)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={wasteImgRef}
              src="/site/hillside.jpg"
              alt="Unsold fabric bolts dumped across a misty green hillside"
              className="absolute left-0 h-[104%] w-full object-cover will-change-transform"
              style={{ top: 'clamp(0px, 260px - 14vw, 160px)', objectPosition: '50% 0%' }}
            />
          </div>
          <div className="relative grid grid-cols-1 items-start gap-8 px-[clamp(20px,5.5vw,96px)] pt-[clamp(72px,8vw,140px)] md:grid-cols-2 md:gap-x-[clamp(32px,8vw,140px)]">
            <div ref={wasteHeadRef} className="flex flex-col gap-[22px] will-change-transform">
              <div className="font-plexmono text-[12px] tracking-[0.14em] text-[#6E685E]">04 — LESS WASTE</div>
              <h2 className="m-0 max-w-[720px] font-arizona text-[clamp(36px,4.4vw,72px)] leading-[1.02] font-normal tracking-[-0.05em] text-[#1C1A17] [text-wrap:balance]">
                The most sustainable metre of fabric is the one that’s already been woven.
              </h2>
            </div>
            <div
              ref={wasteBodyRef}
              className="flex max-w-[400px] flex-col gap-[18px] pt-[34px] will-change-transform md:justify-self-end"
            >
              <p className="m-0 text-[clamp(15px,1.15vw,17px)] leading-[1.55] text-[#4A463F] [text-wrap:pretty]">
                Most surplus ends up like this: shredded, burned or buried once the season moves on.
              </p>
              <p className="m-0 text-[clamp(15px,1.15vw,17px)] leading-[1.55] text-[#4A463F] [text-wrap:pretty]">
                Every roll SurplusX moves stays fabric, and it’s one less roll a brand has to make from
                scratch.
              </p>
            </div>
          </div>
        </div>

        <div
          ref={wastePtsRef}
          className="relative px-[clamp(20px,5.5vw,96px)] pb-[26vh] pt-[clamp(24px,4vh,48px)] text-[#F1EFE6]"
        >
          <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-9 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-[clamp(28px,4vw,56px)]">
            {[
              [
                '01',
                'Sold by the metre, not the kilo',
                'Surplus usually leaves the mill as rag weight. Here it stays whole and sells as fabric, at fabric prices.',
              ],
              [
                '02',
                'Fewer fresh runs',
                'A sold lot replaces a new order: no extra cotton grown, no extra water, dye or power spent weaving it again.',
              ],
              [
                '03',
                'What it is, where it’s from',
                'Every lot carries its spec, origin and photos, so a buyer knows exactly what they are taking on.',
              ],
            ].map(([n, title, body]) => (
              <div key={n} className="flex flex-col gap-2.5 border-t border-[rgba(232,236,224,0.22)] pt-5">
                <div className="font-plexmono text-[12px] tracking-[0.1em] text-[#B9C7A4]">{n}</div>
                <div className="font-arizona text-[26px] leading-[1.12] tracking-[-0.05em] text-[#F1EFE6]">{title}</div>
                <div className="text-[16px] leading-[1.6] text-[rgba(241,239,230,0.74)] [text-wrap:pretty]">{body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- The standard ---------------- */}
      <section id="standard" className="relative z-[1] px-[clamp(20px,6vw,96px)] pb-[140px] pt-20">
        <div className="grid grid-cols-1 items-center gap-[clamp(32px,6vw,96px)] lg:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-[22px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/site/inspection.jpg"
              alt="Fabric inspection on a backlit table"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
          <div>
            <div className="mb-6 font-plexmono text-[12px] tracking-[0.14em] text-[#8E887E]">05 — THE STANDARD</div>
            <h2 className="m-0 mb-10 font-arizona text-[clamp(34px,4.2vw,60px)] leading-[1.03] font-normal tracking-[-0.05em] [text-wrap:balance]">
              Surplus has a reputation problem. <span className="text-[#9A9488]">So you can have your lot checked in person.</span>
            </h2>
            <div className="grid grid-cols-1 gap-x-9 gap-y-7 sm:grid-cols-2">
              {[
                ['Metre-verified quantity', 'Re-measured on your floor, not copied from the mill’s paperwork.'],
                ['What we found, in writing', 'Rolls seen, faults noted and shade groups, written onto the listing.'],
                ['A badge buyers filter for', 'Verified lots stand out on the feed and in search.'],
                ['Optional and paid', 'Ask for it on any of your lots; we quote the visit and settle it with you.'],
              ].map(([title, body]) => (
                <div key={title} className="border-t border-[#DDD6C9] pt-4">
                  <div className="mb-1.5 text-[18px] tracking-[-0.02em]">{title}</div>
                  <div className="text-[15px] leading-[1.55] text-[#6E685E]">{body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Closing + footer ---------------- */}
      <section
        ref={joinRef}
        id="join"
        className="relative z-[1] box-border flex min-h-dvh flex-col justify-end overflow-hidden px-[clamp(20px,6vw,96px)] pb-10 text-center"
      >
        <div
          className="absolute inset-0 -z-[1]"
          style={{
            WebkitMaskImage:
              'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.2) 14%, rgba(0,0,0,0.6) 26%, #000 42%)',
            maskImage: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.2) 14%, rgba(0,0,0,0.6) 26%, #000 42%)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/site/hero-sky.jpg" alt="" className="absolute inset-0 h-full w-full -scale-y-100 object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,34,58,0)_40%,rgba(18,34,58,0.12)_75%,rgba(18,34,58,0.4)_100%)]" />
        </div>
        <div className="my-auto pt-[30vh]">
          <h2 className="mx-auto max-w-[900px] font-arizona text-[clamp(44px,7vw,100px)] leading-[0.98] font-normal tracking-[-0.05em] text-white [text-shadow:0_2px_30px_rgba(18,34,58,0.2)] [text-wrap:balance]">
            Fabric deserves a <span>second season.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-[520px] text-[18px] leading-[1.5] text-[rgba(255,255,255,0.94)]">
            Listing is free while we onboard our first mills, and we’ll come to your floor for the first
            check.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            <Link
              href="/login"
              className="rounded-[10px] bg-white px-[22px] py-[15px] font-plexmono text-[14px] font-medium tracking-[0.04em] text-[#1C1A17] transition-opacity hover:opacity-90"
            >
              LIST YOUR SURPLUS →
            </Link>
            <Link
              href="/login"
              className="rounded-[10px] border border-[rgba(255,255,255,0.45)] bg-[rgba(255,255,255,0.14)] px-[22px] py-[15px] font-plexmono text-[14px] font-medium tracking-[0.04em] text-white transition-opacity hover:opacity-90"
            >
              I’M A BUYER
            </Link>
          </div>
        </div>
        <footer className="mt-[18vh] flex flex-wrap justify-between gap-5 border-t border-[rgba(255,255,255,0.3)] pt-5 text-[13px] text-[rgba(255,255,255,0.88)]">
          <span>© 2026 SurplusX · Tirupur · Surat · Ludhiana</span>
          <div className="flex gap-[22px]">
            <a href="#story" className="transition-opacity hover:opacity-75">
              How it works
            </a>
            <a href="#standard" className="transition-opacity hover:opacity-75">
              Verification
            </a>
            <Link href="/terms" className="transition-opacity hover:opacity-75">
              Terms
            </Link>
            <Link href="/privacy" className="transition-opacity hover:opacity-75">
              Privacy
            </Link>
          </div>
        </footer>
      </section>
    </main>
  )
}

// Tall image card with a glass panel showing a real screen detail.
function FeatureCard({
  image,
  alt,
  title,
  body,
  children,
}: {
  image: string
  alt: string
  title: string
  body: string
  children: React.ReactNode
}) {
  return (
    <div className="relative box-border flex min-h-[640px] flex-col justify-between overflow-hidden rounded-[20px] p-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,18,15,0.18)_0%,rgba(20,18,15,0.05)_40%,rgba(20,18,15,0.55)_78%,rgba(20,18,15,0.82)_100%)]" />
      <div className="relative mt-10 overflow-hidden rounded-[14px] border border-[rgba(255,255,255,0.16)] bg-[rgba(28,26,23,0.38)] text-[#FBFAF7] shadow-[0_24px_60px_rgba(0,0,0,0.25)] backdrop-blur-[18px] backdrop-saturate-[1.1]">
        {children}
      </div>
      <div className="relative flex flex-col gap-1.5 pt-10 text-[#FBFAF7]">
        <div className="text-[18px] tracking-[-0.01em]">{title}</div>
        <div className="max-w-[340px] text-[16px] leading-[1.45] text-[rgba(251,250,247,0.82)] [text-wrap:pretty]">
          {body}
        </div>
      </div>
    </div>
  )
}
