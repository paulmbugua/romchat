import type { Metadata } from 'next';
import { LegalPage } from '../../components/LegalPage';
import { buildBreadcrumbSchema, buildPageMetadata } from '../../lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Delete Account | Grogon SACCO',
  description: 'Request deactivation or deletion review for a Grogon SACCO member digital account.',
  path: '/delete-account',
  keywords: ['delete Grogon SACCO account', 'SACCO account deletion', 'Grogon SACCO data request'],
});

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: 'Home', path: '/' },
  { name: 'Delete Account', path: '/delete-account' },
]);

const sections = [
  {
    title: '1. What this request does',
    body:
      'This page explains how a member can request deactivation of digital access or review of personal data held in the Grogon SACCO website, member portal and mobile app.',
  },
  {
    title: '2. Before you request deletion',
    items: [
      'Make sure you have downloaded or requested any savings, loan or dividend statements you need for your records.',
      'Clear any pending loan, guarantor, dividend, complaint, repayment, dispute or account reconciliation issue where applicable.',
      'Understand that SACCO financial records may need to be retained for audit, legal, regulatory, fraud-prevention and accounting reasons.',
    ],
  },
  {
    title: '3. How to request account deletion or deactivation',
    items: [
      'Email members@grogonsacco.co.ke using the phone number or email linked to your member account.',
      'Use the subject line: Delete my Grogon SACCO digital account.',
      'Include your full name, member number, registered phone number, national ID or business registration reference, and a short reason for the request.',
      'If you cannot access your registered phone or email, visit or contact the SACCO desk for identity verification before the request is processed.',
    ],
  },
  {
    title: '4. What we may delete or deactivate',
    items: [
      'Mobile app and web portal access credentials may be disabled.',
      'Optional profile preferences, device tokens, notification preferences and non-essential support metadata may be removed or anonymized where possible.',
      'Marketing or non-essential communication preferences may be disabled.',
    ],
  },
  {
    title: '5. What may be retained',
    items: [
      'Membership, KYC, savings, loan, repayment, dividend, guarantor and transaction records may be retained where required for SACCO operations, law, audit, tax, dispute resolution or fraud prevention.',
      'Support tickets, admin approvals and account activity logs may be retained where needed to protect the SACCO and members.',
      'Outstanding obligations may prevent full closure until they are resolved.',
    ],
  },
  {
    title: '6. Processing time',
    body:
      'We aim to acknowledge account deletion or deactivation requests within 7 working days after receiving enough information to verify the member. Complex requests involving loans, guarantors, disputes or payment reconciliation may take longer.',
  },
  {
    title: '7. Reopening access',
    body:
      'If your SACCO membership remains active, digital access may be restored after identity verification and admin approval. A new password or onboarding step may be required.',
  },
];

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <LegalPage
        eyebrow="Account deletion"
        title="Request deletion or deactivation of your digital account."
        intro="Members can request removal of digital access while understanding that SACCO financial and legal records may need to be retained."
        updated="29 June 2026"
        icon="delete"
        sections={sections}
      >
        <div className="mt-6 rounded-xl border border-[#f5b47d] bg-[#fff4ea] p-6 text-[#351000]">
          <h2 className="font-mont text-2xl font-black">Quick request template</h2>
          <p className="mt-3 leading-7 font-semibold">
            Send this to members@grogonsacco.co.ke: My name is [full name]. My member number is [member number]. My registered phone number is [phone]. Please deactivate or review deletion of my Grogon SACCO digital account.
          </p>
        </div>
      </LegalPage>
    </>
  );
}