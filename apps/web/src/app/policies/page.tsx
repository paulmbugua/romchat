import type { Metadata } from 'next';
import { LegalPage } from '../../components/LegalPage';
import { buildBreadcrumbSchema, buildPageMetadata } from '../../lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Member Policies | Grogon SACCO',
  description: 'Operational policies for Grogon SACCO membership, savings, loans, support, statements and account security.',
  path: '/policies',
  keywords: ['Grogon SACCO policies', 'SACCO member rules', 'Kirinyaga Road mechanics SACCO'],
});

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: 'Home', path: '/' },
  { name: 'Member Policies', path: '/policies' },
]);

const sections = [
  {
    title: '1. Membership policy',
    items: [
      'Membership is intended for verified mechanics, garages, auto shops, spare-part businesses and related motor-trade workers or businesses around Grogon, Kirinyaga Road and nearby Nairobi trade areas.',
      'Activation requires complete onboarding information, KYC documents, next-of-kin details and payment of applicable joining or share requirements.',
      'The SACCO may suspend digital access while reviewing suspicious activity, disputed documents, unpaid obligations or security concerns.',
    ],
  },
  {
    title: '2. Savings and deposits policy',
    items: [
      'Members should use official SACCO payment channels only, including approved M-Pesa PayBill or bank channels where published by the SACCO.',
      'Savings and repayment records may update automatically after payment confirmation, but reconciliations can be reviewed by admins where references are incomplete or disputed.',
      'Manual balance adjustments require admin authorization and must leave an auditable record.',
    ],
  },
  {
    title: '3. Loan policy',
    items: [
      'Loan applications are reviewed against savings behavior, repayment capacity, KYC status, existing obligations and SACCO credit rules.',
      'A loan committee or authorized officer may approve, reject, defer or request more information before disbursement.',
      'Members remain responsible for repayments even where business cashflow, customer payments, insurer payments or supplier delays affect income.',
    ],
  },
  {
    title: '4. Statements and records policy',
    body:
      'Members can download or print savings, loan and dividend statements where the portal supports it. Printed or downloaded statements are for member reference and may be subject to confirmation by the SACCO office for official use.',
  },
  {
    title: '5. Dividends and rebates policy',
    body:
      'Dividends, patronage rebates and other distributions depend on SACCO performance, member eligibility, shareholding, board approvals, audited records and applicable law. Estimates shown digitally are not final until approved and posted.',
  },
  {
    title: '6. Support and complaints policy',
    items: [
      'Members should use official support channels for password issues, KYC questions, payment posting problems, loan queries and statement disputes.',
      'Complaints should include member number, phone number, transaction references and clear supporting details.',
      'The SACCO may contact the member, payment provider, guarantor, committee or admin officer while resolving a complaint.',
    ],
  },
  {
    title: '7. Security policy',
    items: [
      'Members must keep passwords, phone access, OTPs and SIM cards secure.',
      'Admins and super admins must use only their own credentials and must not share accounts.',
      'Suspicious access, suspected fraud, lost phones and SIM-swap risks should be reported immediately.',
    ],
  },
  {
    title: '8. Policy updates',
    body:
      'These policies may be updated as Grogon SACCO adds services, improves digital operations, responds to member feedback or meets regulatory and governance requirements.',
  },
];

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <LegalPage
        eyebrow="SACCO policies"
        title="Operational policies for members and admins."
        intro="A practical guide to how Grogon SACCO handles membership, savings, loans, statements, support, complaints and digital account security."
        updated="29 June 2026"
        icon="policies"
        sections={sections}
      />
    </>
  );
}