import type { Metadata } from 'next'
import { ContactLine, LegalPage, Section } from '@/components/legal/LegalPage'

export const metadata: Metadata = { title: 'Terms — SurplusX' }

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" updated="14 September 2026">
      <p>
        These terms cover your use of SurplusX, a marketplace for surplus textiles. By creating an account
        or using the site, you agree to them.
      </p>

      <Section title="What SurplusX is">
        <p>
          SurplusX lets sellers list surplus fabric and yarn and lets buyers claim it. We connect the two
          sides. We are not a party to any deal: we don’t buy or sell stock, set prices, handle payments,
          inspect goods or arrange delivery.
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

      <Section title="Claims, swatches and deals">
        <ul>
          <li>
            Claiming a lot holds it for you for 48 hours and shares your contact details with the seller. A
            claim shows serious interest; it isn’t a binding purchase by itself.
          </li>
          <li>
            Sellers confirm or decline claims. Price, payment, inspection, samples and delivery are agreed
            directly between buyer and seller.
          </li>
          <li>Check stock and terms for yourself before paying. SurplusX doesn’t verify listings or traders.</li>
        </ul>
      </Section>

      <Section title="Using contact details">
        <p>
          Use the contact details you receive only to discuss the lot or swatch in question. Don’t spam,
          harass or pass other traders’ details on.
        </p>
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
          made between users.
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
