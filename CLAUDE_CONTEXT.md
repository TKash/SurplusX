# SurplusX — context for a fresh Claude Code session

This file exists so a new session can pick up the project without re-deriving it.
Read it fully before changing anything.

**Last rewritten: 2026-10-31**, against commit `7fdf254`. Where this file and an
older memory of the project disagree, this file wins — the product changed shape
twice (claims → claim requests → direct contact) and earlier notes described flows
that no longer exist. See §15 for what was removed, so nobody rebuilds it.

---

## 1. What this is

An "OLX for textile surplus". The owner's father has been a textile surplus
broker for 20–30 years — he helps buyers acquire excess fabric and yarn stock,
cancelled orders and mill deadstock, on commission. The market has real supply and
demand but no organised place to meet. The father is the intended primary operator
(he has the ground relationships); the owner builds the tech part-time.

The insight that shaped everything: **surplus is a push market, not a pull market.**
A surplus lot exists right now, is time-sensitive, and goes to whoever moves first.
So this is a listings product ("here is what I have"), not an RFQ/quote engine
("here is what I want, please bid").

### The core loop, as actually built

1. A seller posts a lot — on the web form, or by sending a free-text WhatsApp
   message to the bot (§12). The lot carries a **contact number**.
2. A buyer browses the feed, filters or searches, and opens a lot.
3. The buyer presses the contact button. The number is revealed, the view is
   recorded in `contact_views`, and **the seller is told on WhatsApp** that a named
   buyer took their number.
4. The two of them deal directly, off-platform. There is no in-app chat, no
   offer/acceptance flow, no hold on the lot, and no escrow — by design.

The seller then marks the lot sold or withdraws it from `/my/listings`.

### Monetisation

Optional **paid verification**, and nothing else. A seller asks for a lot to be
verified; someone goes to the floor, re-measures the stock and checks the rolls;
the findings are published onto the listing with a ✓ Verified badge, and buyers can
filter the feed to verified lots only. The fee is agreed and settled off the
platform — the app only ever says that it is paid, never what it costs (§16).

There is no commission logic, no billing, no payments code anywhere.

### Out of scope (do not add unasked)

Payments, in-app chat or negotiation, ratings and reviews, logistics integration,
AI supplier matching, analytics dashboards.

---

## 2. Where it runs

- **Live: https://surplus-x.vercel.app** — Vercel Hobby, repo `TKash/SurplusX`,
  branch `main` auto-deploys on push. Deployment Protection is off. The Vercel
  Framework Preset must stay "Next.js" (importing onto an empty repo once left it
  as "Other", which served only `public/` and 404'd every route).
- **Supabase** project ref `awrqgizxeaaqzrezbbol`, free tier. Migrations
  `0001`–`0007` are all applied.
- Supabase free tier **pauses the project after ~7 idle days** (has happened).
  If everything 500s for no reason, check that first.

---

## 3. Tech stack

- **Next.js 16.2.12, App Router, TypeScript, Turbopack.** Genuinely newer than most
  training data. The repo root carries an `AGENTS.md` saying so — read
  `node_modules/next/dist/docs/` before assuming an API behaves as you remember.
  In practice App Router basics (async `params`, async `cookies()`, route handlers)
  behaved as in Next 15. "Cache Components" / `use cache` exists in this version and
  is **not used anywhere** here.
- **No `src/`** — `app/`, `components/`, `lib/`, `types/` sit at the repo root.
- **`proxy.ts` at the root is this version's `middleware.ts`.** Don't go looking for
  `middleware.ts`; it doesn't exist. It refreshes the Supabase session cookie on
  every matched request.
- **Tailwind CSS v4** — `@import "tailwindcss"` plus `@theme inline` in
  `app/globals.css`. There is no `tailwind.config.js`.
- **Supabase** — Postgres, Auth (phone OTP), Storage. Raw `@supabase/supabase-js`,
  deliberately no ORM.
- **Twilio** — WhatsApp (bot + outbound notifications) and SMS (login codes).
  Still a **trial account**; see §16.
- **Anthropic API** — `claude-haiku-4-5-20251001`, server-side only, used to parse
  free-text WhatsApp messages into structured fields via forced tool use.
- **GSAP** (`gsap`, `@gsap/react`) — marketing story-scroll animation only.
- **lucide-react** — icons.
- **zod v4** for input validation, **date-fns** for relative times.

No test suite exists. `npx tsc --noEmit` has been the primary correctness check
throughout; keep using it after every change.

---

## 4. Directory layout

```
app/
  page.tsx                        PUBLIC marketing story-scroll; renders components/site/StorySite
  layout.tsx                      root layout: fonts, metadata
  globals.css                     design tokens, @font-face, Tailwind v4 theme
  (app)/                          the signed-in shell — sidebar on desktop, tab bar on phones
    layout.tsx                    calls requireProfile(); sidebar, saved searches, account menu
    feed/page.tsx                 browse available lots: search, filters, sort, saved-search banner
    lots/[id]/page.tsx            lot detail: spec, photos, seller card, contact button, verification
    lots/new/page.tsx             post a lot (renders components/app/LotForm)
    my/listings/page.tsx          seller's lots: interest counts, sold/withdraw/relist, verification
    my/saved/page.tsx             saved searches
    admin/verification/page.tsx   staff queue; gated on profiles.is_admin
  (auth)/
    login/page.tsx                phone entry (components/auth/SignInView)
    verify/page.tsx               6-box OTP entry
    onboarding/page.tsx           + OnboardingForm.tsx — profile creation, redirects to /feed if done
  (legal)/
    layout.tsx, privacy/page.tsx, terms/page.tsx
  api/
    lots/route.ts                 POST — create a lot (the web form path)
    whatsapp/webhook/route.ts     Twilio inbound webhook; the whole bot state machine
components/
  site/StorySite.tsx              the marketing page: canvas animation + 5 scroll sections
  site/mocks.tsx                  hand-built fake UI for the marketing page
  app/LotCard.tsx                 feed card
  app/LotForm.tsx                 post-a-lot form; renders per-category fields from categories.ts
  app/ContactButton.tsx           reveal-the-number button
  app/VerificationForm.tsx        staff form in the admin queue
  app/SidebarNav.tsx, MobileTabBar.tsx, SavedSearchLink.tsx, SaveSearchButton.tsx
  app/Dropdown.tsx, ActionButton.tsx, StatusBadge.tsx, ui.tsx (Logo and shared primitives)
  auth/SignInView.tsx, OtpModal.tsx
  legal/LegalPage.tsx
  PhotoUploader.tsx               uploads to Supabase Storage; slotted grid
lib/
  auth/actions.ts                 requestOtp, verifyOtp, completeOnboarding, signOut
  auth/guards.ts                  requireProfile() — THE shared guard, React cache()d
  auth/otp-channel.ts             OTP_CHANNEL from NEXT_PUBLIC_OTP_CHANNEL ('sms' | 'whatsapp')
  auth/phone.ts                   normalizePhone() — bare 10 digits default to +91
  lots/categories.ts              the five categories and their per-category field definitions
  lots/queries.ts                 getFeed, getLotDetail, createLot, getMyListings, getLotInterest,
                                  getRevealedLotIds, getAppCounts, verification queue, saved searches
  lots/actions.ts                 server actions: revealContact, sold/withdraw/relist,
                                  request/cancel/setVerification, saved searches
  lots/filters.ts                 feed query-param parsing, bands, sorts, href building
  lots/display.ts                 lotTitle, lotSpecLine, lotPrice, lotContact, initials…
  lots/schema.ts                  zod schema for creating a lot
  lots/types.ts, lots/time.ts
  claude/extract-listing.ts       Anthropic forced-tool-use extraction + deterministic field merge
  whatsapp/twilio.ts              sendWhatsAppMessage, validateTwilioSignature, downloadTwilioMedia
  whatsapp/parse-inbound.ts       parses Twilio's form-encoded inbound webhook
  constants.ts                    LOT_UNITS, MAX_LOT_PHOTOS, VERIFICATION_BLURB
  format.ts                       formatPrice, waLink
  site.ts                         SUPPORT_EMAIL, SIGNIN_QUOTE — both null on purpose (§16)
  supabase/server.ts              cookie client for Server Components / route handlers (obeys RLS)
  supabase/client.ts              browser client (obeys RLS)
  supabase/admin.ts               service-role client, BYPASSES RLS — server-only, never bundled
  supabase/session-cookies.ts     "stay signed in" vs session-only cookie handling
proxy.ts                          the middleware (see §3)
supabase/migrations/0001…0007
types/database.types.ts           hand-maintained, NOT generated — update it when schema changes
archive/marketing-v1/             the previous GSAP marketing page, kept for reference only
public/fonts, public/brand, public/site, public/marketing
```

---

## 5. Database schema

All applied by pasting SQL into the **Supabase SQL Editor**. There is no Supabase
CLI link and no `supabase/config.toml`, so `supabase gen types` has never been run —
`types/database.types.ts` is hand-shaped and must be edited by hand alongside any
migration.

### Enums

| enum | values |
|---|---|
| `user_role` | `seller` `buyer` `both` |
| `lot_status` | `available` `reserved` `sold` `expired` — **`reserved` is dead**, kept only because Postgres can't drop an enum value |
| `lot_unit` | `meters` `yards` `kg` `tonnes` `pieces` `rolls` `bales` `cones` `hanks` `cartons` `boxes` `gross` `sets` |
| `verification_status` | `none` `requested` `scheduled` `verified` |
| `draft_status` | `collecting` `awaiting_confirmation` `confirmed` `abandoned` |
| `claim_status` | orphaned — the `claims` table is gone |

`LOT_UNITS` in `lib/constants.ts` has a compile-time assertion against the
`lot_unit` enum type, so the list and the database cannot silently drift.

### Tables

**`profiles`** — `id` (PK → `auth.users`), `full_name`, `company_name`, `city`,
`whatsapp_number` (unique), `role`, `is_admin` (default false), `created_at`.
RLS: **any authenticated user can SELECT any profile** — intentional, B2B
counterparty identity is meant to be visible. INSERT/UPDATE own row only.

**`lots`** — `id`, `seller_id` → `profiles`, `category`, `quantity`, `unit`,
`price_per_unit` (**nullable** = "price on request"), `price_unit`, `currency`,
`location`, `notes`, `urgency_note`, `photo_urls[]`, `status`, `source`
(`web` | `whatsapp`), `expires_at`, `title`, `attributes` **jsonb**,
`contact_phone`, `contact_name`, verification columns (`verification`,
`verification_requested_at`, `verified_at`, `verified_by`, `verification_notes`,
`verification_photo_urls[]`), plus legacy `spec`, `gsm`, `width_cm`, `colour` kept
so older fabric lots and the bot keep working.
RLS: SELECT for any authenticated user; INSERT/UPDATE only where
`auth.uid() = seller_id`.

Quantity and price can use **different units** — 12 rolls priced per metre is
normal, hence both `unit` and `price_unit`.

**`contact_views`** — `id`, `lot_id`, `viewer_id`, `created_at`,
`unique (lot_id, viewer_id)`. One row per buyer per lot. This is the interest
signal a seller sees, and the reason paying for verification is worth it.
RLS: INSERT where `viewer_id = auth.uid()`; SELECT if you are the viewer or the
lot's seller.

**`saved_searches`** — `id`, `user_id`, `name`, `filters` jsonb (mirrors the feed's
query params), `last_seen_at`, `created_at`. `last_seen_at` drives the "N new"
counts. Capped at `MAX_SAVED_SEARCHES = 8` in app code. RLS: own rows only, all
four verbs.

**`pending_listing_drafts`** — the WhatsApp bot's state. `whatsapp_number` is plain
text, **not** a user FK, because a sender may have no account yet. `raw_messages`
jsonb[], `parsed_fields`, `missing_fields[]`, `photo_urls[]`, `status`,
`last_bot_message`. Partial unique index `one_active_draft_per_number` on
`whatsapp_number WHERE status IN ('collecting','awaiting_confirmation')`.
**RLS enabled with no policies at all** — reachable only via the service-role
client, deliberately invisible to the browser.

**Storage**: bucket `lot-photos`, public. Public read + authenticated insert for the
web path; the bot uploads through the admin client, which bypasses RLS.

---

## 6. Environment variables

`.env.example` is the authoritative list. Local values go in `.env.local`
(gitignored); production values live in Vercel.

```
NEXT_PUBLIC_SUPABASE_URL          Supabase → Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY     the "publishable" key — not sensitive
SUPABASE_SERVICE_ROLE_KEY         the "secret" key — SENSITIVE, bypasses RLS
TWILIO_ACCOUNT_SID                not sensitive
TWILIO_AUTH_TOKEN                 SENSITIVE
TWILIO_WHATSAPP_NUMBER            e.g. whatsapp:+14155238886 (the shared Sandbox)
ANTHROPIC_API_KEY                 SENSITIVE
NEXT_PUBLIC_APP_URL               https://surplus-x.vercel.app in production
NEXT_PUBLIC_OTP_CHANNEL           sms | whatsapp
VERIFICATION_ALERT_NUMBER         WhatsApp number told when a seller asks for verification
CRON_SECRET                       VESTIGIAL — see below
```

Twilio Messaging Service SID (used by Supabase, not by this codebase):
`MG3222554834b69425daa9304d3e645da0`.

Supabase's phone provider is configured **in the Supabase dashboard**
(Authentication → Sign In / Providers → Phone), not via env vars here: provider on,
SMS provider Twilio, Account SID + Auth Token + Messaging Service SID. OTP expiry
was raised from 60s to 300s.

**`CRON_SECRET` is vestigial.** It guarded `/api/cron/expire-reservations`, which
was deleted with the claim flow. `.env.example` still documents it and `proxy.ts`
still excludes `api/cron` from its matcher — both harmless, both worth deleting next
time someone is in those files.

> **Credential handling.** Never print live secret values into tool output or chat —
> the harness has a classifier that blocks it, correctly. If a secret needs to reach
> `.env.local`, ask the owner to paste it, then write it without echoing it back.

---

## 7. Categories and the `attributes` design

Five categories, in `lib/lots/categories.ts`:
**Fibre · Yarns · Fabrics · Trims & accessories · Garments**.

Each has a `CategorySpec`: a `blurb`, its own `units` and `priceUnits`, a
`titlePlaceholder`, and a list of `AttributeField`s (`text` | `number` | `select`,
with optional `options`, `placeholder`, `suffix`, `hint`, and `summary`).

Only the universal fields are required — **category, quantity, unit, contact
number**. Everything category-specific is optional, so a seller can list in a
minute. Values are stored in `lots.attributes` (jsonb), keyed by field `key`, which
means **adding or changing a field needs no migration** — edit `categories.ts` and
the form, feed cards and spec lines follow.

Fields marked `summary: true` are the ones shown on cards and in the one-line spec,
in declaration order.

`lib/lots/schema.ts` trims attribute values, drops blanks, and caps keys at 40 and
values at 200 characters.

> The **Trims and Garments** field lists came from trade practice, not a published
> standard, and have not yet been reviewed with the father. Treat them as drafts.

---

## 8. Auth

Phone number + 6-digit OTP through Supabase Auth, delivered by Twilio.

- `lib/auth/phone.ts` `normalizePhone()` defaults bare 10-digit input to `+91`.
- `lib/auth/otp-channel.ts` exposes `OTP_CHANNEL` from `NEXT_PUBLIC_OTP_CHANNEL`.
  Supabase's Twilio provider can deliver the same OTP over SMS or WhatsApp;
  verification is identical either way (`verifyOtp` type `'sms'`).
- `requireProfile()` in `lib/auth/guards.ts` is the single guard for every page in
  the `(app)` group: no session → `/login`, session but no `profiles` row →
  `/onboarding`. It is wrapped in React's `cache()` so the layout and the page it
  wraps share one auth+profile lookup per request.
- "Stay signed in" vs session-only cookies: `lib/supabase/session-cookies.ts`,
  applied in `proxy.ts`.

Email auth does not exist. It was tried and abandoned: Supabase's default email
sender only ever sends a *link*, never a code, and code templates require custom
SMTP. The PKCE `/auth/callback` handler that was built for it has been **deleted** —
reintroducing email login means rebuilding it.

**Login codes do not currently reach real Indian numbers** (§16).

---

## 9. Revealing a seller's contact

`revealContactAction` in `lib/lots/actions.ts`:

1. Re-checks the caller — server actions are public endpoints, so a lot id from the
   client proves nothing.
2. Resolves the number via `lotContact()`: the lot's own `contact_phone`, falling
   back to the seller profile's `whatsapp_number`.
3. If the caller is the seller, returns the number and records nothing.
4. Otherwise inserts into `contact_views`. **Postgres `23505` (unique violation) is
   treated as success** — this buyer already looked, so there is nothing new to
   record and the seller should not be pinged twice.
5. On a genuinely new view, sends the seller a WhatsApp message naming the buyer,
   their city and the lot, with a `wa.me` link back to them.

`sendWhatsAppMessage` **catches its own errors and never throws**, so a WhatsApp
delivery failure can never break the action that triggered it.

---

## 10. Paid verification

- Seller presses the button on their own lot → `requestVerificationAction` sets
  `verification = 'requested'` (guarded on `verification = 'none'`), then WhatsApps
  `VERIFICATION_ALERT_NUMBER` with the lot, the seller, a `wa.me` link and a link to
  the admin queue. **If that env var is unset, nobody is told** — the request just
  sits in the database.
- Seller can withdraw a `requested` or `scheduled` request
  (`cancelVerificationAction`).
- Staff work `/admin/verification`, gated on `profiles.is_admin`. The page shows the
  queue (oldest request first) and recently verified lots.
- `setVerificationAction` re-checks `is_admin`, then uses the **service-role client**
  — necessary because RLS only lets a seller update their own lot. On reaching
  `verified` it stamps `verified_at`/`verified_by`, publishes `verification_notes`
  onto the listing, and WhatsApps the seller.
- Buyers can filter the feed to verified lots only (`verified` filter key).
- `VERIFICATION_BLURB` in `lib/constants.ts` is the only description of the service:
  *"We come to your floor, re-measure the stock, check the rolls and put what we find
  on the listing."* It deliberately does not state a price.

---

## 11. Feed, filters and saved searches

`lib/lots/filters.ts` owns the feed's URL contract. Filter keys: `q`, `category`,
`qty`, `price`, `verified`, plus `sort`. Quantity and price are **bands**
(`QTY_BANDS`, `PRICE_BANDS`), not free numeric input. `FEED_PAGE_SIZE = 60`.

`sanitizeSearch()` cleans free text before it reaches Postgres; `q` also matches
seller names via `findSellerIdsMatching()`.

A saved search stores the same params. "N new" = available lots matching the
filters, created after `last_seen_at`, **excluding the user's own lots**. Shown in
the sidebar, on the mobile top bar (summed) and as a feed banner.

`getAppCounts()` feeds the nav badges: available lots, the user's active listings,
total interest in their lots (`contact_views` joined to their lots), and their
pending verification requests.

---

## 12. The WhatsApp listing bot

`app/api/whatsapp/webhook/route.ts` — the entire state machine. Verified working
end-to-end in an earlier session: *"2000m cotton 120gsm surat range, 90 rs, need to
clear by Friday"* parsed correctly, confirmed, and published a real `lots` row with
`source='whatsapp'`.

Per inbound message:

1. **Validate the Twilio signature** (`validateTwilioSignature`) — reject anything
   not genuinely from Twilio.
2. Look up an active draft for the sender's number
   (`status IN ('collecting','awaiting_confirmation')`).
3. No draft + text → call Claude, compute missing required fields
   (`category`, `quantity`, `unit`), ask for what's missing, or go straight to
   `awaiting_confirmation`.
4. `collecting` + text → re-run Claude **passing the existing fields as context** so
   it merges instead of starting over.
5. `awaiting_confirmation` + text → `YES_PATTERN`
   (`yes|y|confirm|correct|ok|okay`) publishes; `CANCEL_PATTERN`
   (`cancel|stop|no listing`) abandons; anything else is treated as a correction
   (re-extract, merge, re-confirm).
6. Photos (`NumMedia > 0`) can arrive at any stage — downloaded from Twilio with
   Basic Auth (their media URLs aren't public), re-uploaded to `lot-photos`, capped
   at `MAX_LOT_PHOTOS`.
7. On confirmation, find-or-create a `profiles` row keyed by `whatsapp_number`,
   auto-provisioning a lightweight seller via
   `supabase.auth.admin.createUser({ phone, phone_confirm: true })`, then insert the
   lot.
8. The whole dispatch is wrapped in try/catch and **always replies something** — an
   earlier version returned a raw 500 and left the sender in total silence when the
   Anthropic account ran out of credit.

`lib/claude/extract-listing.ts` uses `tool_choice: {type:'tool', name:'record_listing_fields'}`
to force structured output rather than scraping prose. **The merge is deterministic
TypeScript, not left to the model** — existing field wins unless the new message
explicitly mentions it. That is what makes "actually it's 1800m not 2000" override
exactly one field.

> The bot is **offline** until the Twilio Sandbox webhook is repointed (§16).

---

## 13. Design system

One system across the marketing site and the signed-in app, from the Claude Design
handoff. Tokens in `app/globals.css` as CSS custom properties, re-exported through
Tailwind v4's `@theme inline` so `bg-accent`, `text-muted`, `border-line` etc. work
as utilities.

Palette: paper `#f4f1eb`, surface `#fbfaf7`, sand `#f1ede5`, ink `#1c1a17`,
muted `#6e685e`, borders `#ece7dd`/`#e1dacc`, orange `#e8892f` for fills,
terracotta `#d27322` for accent text on paper, green `#4a6b46` for success, deep
rust `#9c3b16` for danger.

Note the deliberate split: **orange is for fills** (which carry ink-coloured text),
**terracotta is for accent text** on paper, where the bright orange is too faint.

Type: **ABC Arizona Flare** (display), **ABC ROM** (body), **IBM Plex Mono** (labels,
figures) — the mono comes from `next/font`, the other two from `@font-face` blocks
pointing at `public/fonts/*.otf`.

**Light mode only.** The `prefers-color-scheme: dark` override was removed
deliberately — do not re-add it unasked.

The signed-in shell is a dark ink sidebar (248px, desktop) against paper-toned
content; on phones it becomes a slim top bar plus a bottom tab bar.

> The ABC Dinamo fonts are used on the owner's instruction but **the web licence is
> unconfirmed** (§16).

---

## 14. Marketing site

`app/page.tsx` → `components/site/StorySite.tsx`: a canvas-animated story-scroll with
sections `#top`, `#story`, `#buyers`, `#waste`, `#standard`, `#join`. Signed-in
visitors are redirected to `/feed`. `components/site/mocks.tsx` holds hand-built fake
UI for it — and carries a comment reminding whoever edits it that it must not depict
a feature that doesn't exist.

The previous GSAP marketing page is kept at `archive/marketing-v1/` for reference.
It is not routed and not built.

---

## 15. What was removed — do not rebuild it

The product went through two pivots. Earlier notes (and `git log`) describe flows
that are gone:

- **Claims / "I'm interested" / 48-hour reservations** (migration `0001`, removed in
  `0007`). A buyer claimed a lot, it flipped to `reserved`, a partial unique index
  `one_active_claim_per_lot` guarded the race, and a cron job expired stale holds.
- **Claim requests with offers** (migration `0006`, removed in `0007`) — the brief
  middle state where buyers sent an offer price, quantity and message, and the seller
  accepted one, which auto-declined the rest.
- **Swatch requests** (migration `0005`, removed in `0007`) — a buyer asking for a
  physical sample.
- **`/api/lots/[id]/claim`** and **`/api/cron/expire-reservations`** route handlers.
- **The `expire_stale_reservations()` function and its pg_cron job** — unscheduled in
  `0007`.

All of it was replaced by §9: the number is simply revealed, and the two parties talk.
`lot_status.reserved` and the `claim_status` enum survive as orphans only because
Postgres can't drop enum values.

---

## 16. Open items and known limitations

**Blocked on the owner, in rough priority order:**

1. **Vercel env vars missing**: `NEXT_PUBLIC_APP_URL` =
   `https://surplus-x.vercel.app`, and `VERIFICATION_ALERT_NUMBER` = his WhatsApp in
   `+9199…` form. Until the second one is set, **verification requests alert
   nobody**. Redeploy after adding.
2. **The Twilio WhatsApp Sandbox webhook still points at the dead
   `loomover.vercel.app`.** It must become
   `https://surplus-x.vercel.app/api/whatsapp/webhook` or **the listing bot stays
   offline**.
3. **Login codes don't reach real Indian numbers.** Twilio error 30008 — Indian
   carriers filter non-DLT SMS from foreign numbers. The plan is WhatsApp OTP, which
   needs: Twilio upgraded off trial → Meta business verification → the Indian number
   he bought registered as a WhatsApp sender → Supabase's phone provider switched to
   Twilio Verify with WhatsApp enabled → `NEXT_PUBLIC_OTP_CHANNEL=whatsapp`.
   Meta verification wants a Udyam registration; he was last checking whether his
   father's proprietorship already has one.
   **Until then only Supabase "Test OTPs" numbers can sign in:**
   `+919958867473` / `123456`, and `+910000000001` / `111111` (the demo seller).
4. **Business decisions pending**: what verification costs (per lot or per visit — the
   app only says it's paid and the fee is agreed); whether the "5% commission for two
   years" line should go back on the marketing page; and a review of the Trims and
   Garments field lists with his father (§7).
5. **Test data is still in the live database**: two old fabric lots, a "Demo Textiles"
   seller with a linen lot, and a verified test yarn lot. Offer to clear it before
   real sellers arrive.
6. **`lib/site.ts` has `SUPPORT_EMAIL` and `SIGNIN_QUOTE` as `null`** — awaiting a
   real contact address for the legal pages and a genuine, attributable quote for the
   sign-in panel. Pages render a neutral fallback rather than invent either.
7. **The ABC Dinamo web font licence is unconfirmed.** Swapping the faces means
   editing the two `@font-face` blocks in `app/globals.css` and nothing else.

**Technical debt:**

- **No automated tests.** `npx tsc --noEmit` and manual browser checks only.
- **Twilio is still a trial account** — SMS reaches only Caller-ID-verified numbers,
  and WhatsApp is the shared Sandbox, which requires every tester to send a
  `join <code>` message first and cannot message anyone who hasn't.
- `types/database.types.ts` is hand-maintained; schema changes need a matching manual
  edit, or set up the Supabase CLI link properly.
- `CRON_SECRET` in `.env.example` and the `api/cron` exclusion in `proxy.ts` are
  leftovers from the deleted cron route.

---

## 17. House rules

These came from the owner and have held all along:

- **Never ship copy that claims a feature the app doesn't have** — no escrow, no
  inspection before it existed, no invented testimonials, no fabricated counts or
  logos. `components/site/mocks.tsx` carries this as a code comment for a reason, and
  two strings describing the dead claim/swatch flow had to be fixed in `7fdf254`
  after surviving the pivot.
- **Flag unverifiable claims rather than publishing them.** This is why
  `lib/site.ts` holds `null`s instead of a plausible-looking support address.
- **Verify changes in the browser before reporting them**, not just by typecheck.
- **Never touch the unrelated TORQ WARS files** if a parent directory contains them
  (they appear beside this project on the owner's own machine).

---

## 18. Commands

```bash
npm install
npm run dev            # Next dev server, port 3000
npx tsc --noEmit       # primary correctness check — run after every change
npm run build          # full production build
npm run lint
npx next typegen       # regenerate route types if a route was added/removed
```

A local run needs a `.env.local` with at least the two `NEXT_PUBLIC_SUPABASE_*`
values; without them `proxy.ts` can't construct a client and every request fails.
Next reads env vars **only at process start**, so restart the dev server after
editing `.env.local` — a hot reload won't pick it up.
