import type { Metadata } from 'next'
import { ContactLine, LegalPage, Section } from '@/components/legal/LegalPage'

export const metadata: Metadata = { title: 'Terms — SurplusX' }

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" updated="25 October 2026">
      <p>
        These terms cover your use of SurplusX, a marketplace for surplus textiles. By creating an account
        or using the site, you agree to them.
      </p>

      <Section title="What SurplusX is">
        <p>
          SurplusX lets sellers list surplus textiles — fibre, yarn, fabric, trims and garments — and lets
          buyers contact them directly. We connect the two sides. We are not a party to any deal: we don’t
          buy or sell stock, set prices, handle payments or arrange delivery, and we take no commission on
          what you trade.
        </p>
        <p>
          We separately offer an optional paid service: visiting a seller’s premises to check a lot (see
          Verification below).
        </p>
      </Section>

      <Section title="Your account">
        <ul>
          <li>You sign in with a mobile number you control, and you’re responsible for activity on your account.</li>
          <li>Keep your profile accurate. Other traders rely on it to know who they’re dealing with.</li>
          <li>You must be able to enter into business agreements on behalf of yourself or your business.</li>
        </ul>
      </Section>

      <Section title="Listing stock">
        <ul>
          <li>
            You’re responsible for your listings being accurate, including photos, specification, quantity,
            price and location, and for having the right to sell what you list.
          </li>
          <li>Update or withdraw a listing when stock is sold or no longer available.</li>
          <li>Don’t list counterfeit, stolen or illegal goods, or anything you don’t actually have.</li>
        </ul>
      </Section>

      <Section title="Contacting a seller">
        <ul>
          <li>
            A listing carries a contact number. When you ask to see it, we show it to you and tell the seller
            you did, including your name, business and city.
          </li>
          <li>
            Everything after that is between you: price, payment, samples, inspection and delivery. Nothing
            on SurplusX is an offer, an order or a reservation.
          </li>
          <li>
            Use the contact details only to discuss that lot. Don’t spam, harass or pass other traders’
            details on.
          </li>
          <li>Check stock and terms for yourself before paying.</li>
        </ul>
      </Section>

      <Section title="Verification">
        <ul>
          <li>
            Sellers may ask us to check a lot in person. It is optional and paid; we agree the fee with the
            seller before the visit, and it is settled directly with us, not through the site.
          </li>
          <li>
            A verified lot shows a badge and what we found on the day we visited: quantity re-measured, rolls
            seen, shade groups and any faults noted.
          </li>
          <li>
            A check is an inspection of the goods on that date, not a guarantee of quality, quantity later, or
            of the seller’s conduct. Buyers should still satisfy themselves before paying.
          </li>
          <li>Paying for a check doesn’t buy a particular outcome, and we may decline to verify a lot.</li>
        </ul>
      </Section>

      <Section title="Suspending accounts">
        <p>
          We may remove listings or suspend accounts that break these terms, mislead other users, or put the
          marketplace at risk.
        </p>
      </Section>

      <Section title="Liability">
        <p>
          SurplusX is provided as it is. To the extent the law allows, we aren’t liable for the quality,
          safety or legality of listed goods, for the conduct of other users, or for losses arising from deals
          made between users. Where we have verified a lot, our responsibility is limited to the check we
          carried out on that date.
        </p>
      </Section>

      <Section title="Changes and contact">
        <p>
          We may update these terms; the date above shows the latest version. These terms are governed by the
          laws of India.
        </p>
        <ContactLine />
      </Section>
    </LegalPage>
  )
}
