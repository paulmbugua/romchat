import type { Metadata } from 'next';
import { LegalPage } from '../../components/LegalPage';
import { buildBreadcrumbSchema, buildPageMetadata } from '../../lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Terms of Use | Grogon SACCO',
  description: 'Terms for using Grogon SACCO website, member portal, mobile app and digital SACCO services.',
  path: '/terms',
  keywords: ['Grogon SACCO terms', 'Kenya SACCO terms', 'mechanics SACCO Nairobi'],
});

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: 'Home', path: '/' },
  { name: 'Terms of Use', path: '/terms' },
]);

const sections = [
  {
    title: '1. Who these terms apply to',
    body:
      'These terms apply when you visit the Grogon SACCO website, use the member portal, use the mobile app, or access digital services provided for mechanics, garages, auto electricians, panel beaters, painters, spare shops and related motor-trade members around Grogon and Kirinyaga Road.',
  },
  {
    title: '2. Membership and onboarding',
    items: [
      'A person or business becomes an active member only after SACCO onboarding, KYC review, required joining payments and account activation by an authorized SACCO officer.',
      'You must provide accurate identity, contact, next-of-kin, business and workshop information during registration or admin-assisted onboarding.',
      'Grogon SACCO may pause, reject or request more information where documents are unclear, inconsistent or suspected to be fraudulent.',
    ],
  },
  {
    title: '3. Member account security',
    items: [
      'You are responsible for protecting your member number, phone number, password, OTPs and device access.',
      'Do not share your login details with another mechanic, employee, apprentice, supplier, agent or family member.',
      'Notify the SACCO immediately if your phone is lost, your SIM is swapped, your password is exposed or a transaction appears suspicious.',
    ],
  },
  {
    title: '4. Savings, loans and dividends',
    items: [
      'Savings balances, loan balances, dividends and statements shown in the portal are member records generated from SACCO systems and approved transaction channels.',
      'Loan approval is not automatic. Applications may require savings history, KYC status, guarantors, committee review, collateral, business verification and repayment capacity checks.',
      'Dividends, rebates and distributions depend on SACCO performance, member eligibility, board approvals and applicable law.',
    ],
  },
  {
    title: '5. M-Pesa and payment records',
    body:
      'Where automated M-Pesa PayBill or payment integrations are active, member savings and repayments may update automatically after confirmation from payment providers. If a payment is delayed, duplicated, reversed or posted to the wrong member record, the SACCO may reconcile the account before finalizing the balance.',
  },
  {
    title: '6. Acceptable use',
    items: [
      'Do not attempt to access another member account, admin area, system logs, API endpoints or database records without authorization.',
      'Do not upload false documents, impersonate another member, abuse support channels or use the platform for fraud, money laundering or illegal activity.',
      'Do not interfere with the website, mobile app, backend services, security controls or payment reconciliation processes.',
    ],
  },
  {
    title: '7. Service availability',
    body:
      'We aim to keep digital services available, but access may be interrupted by maintenance, internet outages, payment-provider downtime, device issues, security reviews or events outside our control. Critical SACCO instructions should be confirmed through official SACCO channels where needed.',
  },
  {
    title: '8. Changes to these terms',
    body:
      'We may update these terms as the SACCO grows, launches new services or responds to legal, operational and security requirements. Continued use of the services after an update means you accept the latest terms.',
  },
];

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <LegalPage
        eyebrow="Member terms"
        title="Terms for using Grogon SACCO digital services."
        intro="Plain rules for members using the website, member portal and mobile app to access savings, loans, dividends, statements and support."
        updated="29 June 2026"
        icon="terms"
        sections={sections}
      />
    </>
  );
}