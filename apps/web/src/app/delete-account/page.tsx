import type { Metadata } from 'next';
import { LegalPage } from '../../components/LegalPage';
import { buildBreadcrumbSchema, buildPageMetadata } from '../../lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Delete Account | Grogon SACCO',
  description: 'Delete Grogon SACCO web and mobile app access directly from the member portal, with SACCO records retained where legally required.',
  path: '/delete-account',
  keywords: ['delete Grogon SACCO account', 'SACCO account deletion', 'Grogon SACCO data request'],
});

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: 'Home', path: '/' },
  { name: 'Delete Account', path: '/delete-account' },
]);

const sections = [
  {
    title: '1. What direct deletion does',
    body:
      'A logged-in member can delete digital account access directly from the member portal. This revokes web and mobile app login sessions and removes the member portal password.',
  },
  {
    title: '2. Before you delete digital access',
    items: [
      'Make sure you have downloaded or requested any savings, loan or dividend statements you need for your records.',
      'Clear any pending loan, guarantor, dividend, complaint, repayment, dispute or account reconciliation issue where applicable.',
      'Understand that SACCO financial records may need to be retained for audit, legal, regulatory, fraud-prevention and accounting reasons.',
    ],
  },
  {
    title: '3. How to delete your account directly',
    items: [
      'Log in to the member portal with your member number, registered phone and password.',
      'Open the Account tab and choose Delete digital account.',
      'Enter your current password and type DELETE MY ACCOUNT to confirm.',
      'The system immediately revokes your sessions and disables future web or mobile app login.',
    ],
  },
  {
    title: '4. What is deleted or deactivated',
    items: [
      'Mobile app and web portal sessions are revoked.',
      'The member portal password is removed so the deleted digital account cannot be used for future login.',
      'A closed support record and audit entry are created to show that the member performed the deletion directly.',
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
    title: '6. When support is still needed',
    body:
      'If you cannot log in, need full SACCO membership closure, have unresolved loans, guarantor issues, payment disputes or identity verification problems, call the SACCO desk on 0114330356.',
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
        title="Delete your digital account access."
        intro="Logged-in members can delete web and mobile app access directly from the member portal. SACCO financial, KYC and audit records may still be retained where required."
        updated="29 June 2026"
        icon="delete"
        sections={sections}
      >
        <div className="mt-6 rounded-xl border border-[#f5b47d] bg-[#fff4ea] p-6 text-[#351000]">
          <h2 className="font-mont text-2xl font-black">Need help?</h2>
          <p className="mt-3 leading-7 font-semibold">
            Members who cannot log in or need full SACCO membership closure should call 0114330356 with their member number and registered phone details ready.
          </p>
          <a href="/login" className="mt-4 inline-flex rounded-lg bg-[#0d1c32] px-5 py-3 font-black text-white">Login to delete directly</a>
        </div>
      </LegalPage>
    </>
  );
}