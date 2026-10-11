import type { Metadata } from 'next'
import { ContactLine, LegalPage, Section } from '@/components/legal/LegalPage'

export const metadata: Metadata = { title: 'Privacy — SurplusX' }

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy" updated="14 September 2026">
      <p>
        SurplusX is a marketplace where textile mills, traders and brokers list surplus fabric and yarn,
        and buyers claim it. This page explains what we collect, why, and who can see it.
      </p>

      <Section title="What we collect">
        <ul>
          <li>Your mobile number, which is how you sign in.</li>
          <li>Profile details you give us: your name, business name, city, WhatsApp number and whether you mostly buy or sell.</li>
          <li>Listings you post: photos, fabric details, quantity, price, location and notes.</li>
          <li>What you do on SurplusX: lots you claim, swatches you request and searches you save.</li>
          <li>Messages you send to our WhatsApp listing bot, including photos.</li>
          <li>Cookies that keep you signed in. We don’t use advertising or tracking cookies.</li>
        </ul>
      </Section>

      <Section title="How we use it">
        <ul>
          <li>To sign you in by sending a one-time code.</li>
          <li>To show listings, and to show who posted or claimed them.</li>
          <li>
            To tell the other side of a deal what’s happening, usually on WhatsApp: for example when a lot
            is claimed, confirmed or released, or a swatch is requested.
          </li>
          <li>To count new lots that match your saved searches.</li>
          <li>To turn a WhatsApp message into a listing for you to confirm.</li>
        </ul>
        <p>We don’t sell your information, and we don’t show ads.</p>
      </Section>

      <Section title="Who can see what">
        <p>
          SurplusX is a business marketplace, so identity is visible to counterparties. Signed-in users can
          see listings and the name, business name and city of the person who posted them. When you claim a
          lot or request a swatch, the seller also gets your WhatsApp number so you can talk; when a seller
          responds to your claim, you get theirs.
        </p>
        <p>Your saved searches are only visible to you.</p>
      </Section>

      <Section title="Services we use">
        <p>We rely on a few providers to run SurplusX. They handle data only to provide their service to us:</p>
        <ul>
          <li>Supabase: database, sign-in and photo storage.</li>
          <li>Twilio: sending sign-in codes and WhatsApp messages.</li>
          <li>Vercel: hosting the website.</li>
          <li>Anthropic: reading WhatsApp listing messages to fill in the listing details.</li>
        </ul>
      </Section>

      <Section title="Payments and deals">
        <p>
          SurplusX doesn’t handle payments, inspection or delivery. Anything you share with another trader
          while agreeing a deal happens directly between you and them.
        </p>
      </Section>

      <Section title="Keeping and deleting your data">
        <p>
          We keep your information while your account is active. You can ask us to delete your account,
          profile and listings at any time; some records may be kept where the law requires it.
        </p>
      </Section>

      <Section title="Changes and contact">
        <p>If we change how we use your information, we’ll update this page and the date above.</p>
        <ContactLine />
      </Section>
    </LegalPage>
  )
}
