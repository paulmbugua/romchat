import type { Metadata } from 'next';
import { LegalPage } from '../../components/LegalPage';
import { buildBreadcrumbSchema, buildPageMetadata } from '../../lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Privacy Policy | Grogon SACCO',
  description: 'How Grogon SACCO collects, uses, protects and retains member data for SACCO services.',
  path: '/privacy',
  keywords: ['Grogon SACCO privacy', 'SACCO data protection Kenya', 'member KYC privacy'],
});

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: 'Home', path: '/' },
  { name: 'Privacy Policy', path: '/privacy' },
]);

const sections = [
  {
    title: '1. Information we collect',
    items: [
      'Identity and KYC information such as name, phone number, national ID or passport details, KRA PIN, date of birth, next of kin and uploaded documents.',
      'Membership and business information such as workshop name, trade category, garage location, vehicle specialities, business permits and member type.',
      'Financial records such as savings, deposits, withdrawals, loan applications, repayment schedules, dividends, penalties, guarantor records and account statements.',
      'Digital activity such as login time, device details, support messages, app diagnostics, IP address and security audit records.',
    ],
  },
  {
    title: '2. How we use member data',
    items: [
      'To onboard and verify members before activating SACCO accounts.',
      'To maintain savings, loans, dividend records, statements and repayment schedules.',
      'To process support requests, complaints, account changes, password resets and admin-assisted member services.',
      'To detect fraud, prevent unauthorized access, comply with legal duties and protect member funds.',
      'To send relevant SACCO notices about meetings, contributions, repayments, dividends, product changes and service updates.',
    ],
  },
  {
    title: '3. M-Pesa, banks and payment providers',
    body:
      'When you pay through official SACCO payment channels, we may receive confirmation data from payment providers, banks or aggregators. This can include transaction reference, amount, payer phone number, timestamp and payment status. We use this information to reconcile savings, repayments and member account records.',
  },
  {
    title: '4. Admin and staff access',
    body:
      'Only authorized SACCO admins, super admins and approved operational staff should access member records. Access is role-based and intended for onboarding, KYC approval, account maintenance, loan review, member support, reporting and governance duties.',
  },
  {
    title: '5. Sharing information',
    items: [
      'We do not sell member personal data.',
      'We may share necessary data with payment processors, technology providers, auditors, legal advisers, regulators, credit or guarantor review processes and service providers who support SACCO operations.',
      'We may disclose information where required by law, fraud investigation, court order, regulator request or protection of member funds.',
    ],
  },
  {
    title: '6. Data security',
    body:
      'We use administrative, technical and operational controls to protect member information. No digital system is risk-free, so members should also protect passwords, phones, OTPs and SIM cards and report suspicious access quickly.',
  },
  {
    title: '7. Data retention',
    body:
      'SACCO financial and membership records may need to be retained for legal, audit, accounting, dispute, fraud-prevention and regulatory purposes even after a member stops using the app or requests account deletion.',
  },
  {
    title: '8. Your choices and rights',
    items: [
      'You may request correction of inaccurate member profile or KYC information.',
      'You may request copies of your savings, loan or dividend statements through the member portal or SACCO support desk.',
      'You may request deactivation or deletion review through the delete-account page, subject to SACCO record retention and outstanding obligations.',
    ],
  },
];

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <LegalPage
        eyebrow="Privacy and data"
        title="How Grogon SACCO protects member information."
        intro="This policy explains how we collect and use data for KYC, savings, loans, dividends, M-Pesa reconciliation, support and secure SACCO operations."
        updated="29 June 2026"
        icon="privacy"
        sections={sections}
      />
    </>
  );
}