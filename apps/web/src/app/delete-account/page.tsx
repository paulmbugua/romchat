import type { Metadata } from 'next';
import { LegalPage } from '../../components/LegalPage';
import { buildBreadcrumbSchema, buildPageMetadata } from '../../lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Delete Account | RomChat',
  description: 'Delete your RomChat access, request deletion review, and understand what data may be retained for safety, legal, or fraud-prevention reasons.',
  path: '/delete-account',
  keywords: ['delete RomChat account', 'RomChat data deletion', 'RomChat privacy'],
});

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: 'Home', path: '/' },
  { name: 'Delete Account', path: '/delete-account' },
]);

const sections = [
  {
    title: '1. What deleting your account means',
    body:
      'Deleting your RomChat account removes your active access to the web and mobile app, revokes sessions, and clears your profile from the live experience.',
  },
  {
    title: '2. Request a deletion review first',
    items: [
      'If you want a review instead of immediate removal, use the data deletion request button from your profile screen.',
      'A request lets the team confirm identity, resolve active safety or payment issues, and process the deletion correctly.',
      'You can still delete immediately from the profile screen after you confirm the warning dialog.',
    ],
  },
  {
    title: '3. What is removed',
    items: [
      'Your login session is revoked.',
      'Your active profile, media links, swipes, matches, messages, notifications, subscriptions, boosts, gifts, payments, wallet history, and verification records are removed from the live user experience where possible.',
      'Any linked password-reset or email-otp records tied to your account are cleared.',
    ],
  },
  {
    title: '4. What may be retained',
    items: [
      'Safety, fraud-prevention, abuse-reporting, tax, payment, audit, and legal records may be retained where required.',
      'A deletion request audit entry may be kept to show that the request was processed.',
      'Backups can persist for a limited operational period before expiring.',
    ],
  },
  {
    title: '5. Need support?',
    body:
      'If you cannot sign in or need help with a deletion request, open the RomChat profile screen, submit a request, or contact support through the help page.',
  },
];

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <LegalPage
        eyebrow="Account deletion"
        title="Delete your RomChat account."
        intro="Control your RomChat presence from the profile screen. You can request a deletion review or remove your live account access immediately."
        updated="10 August 2026"
        icon="delete"
        sections={sections}
      >
        <div className="mt-6 rounded-xl border border-[#ff6f61]/30 bg-[#fff0f0] p-6 text-[#351000]">
          <h2 className="font-mont text-2xl font-black">Start in your profile</h2>
          <p className="mt-3 leading-7 font-semibold">
            Open RomChat profile settings to request deletion or remove the account immediately. That screen includes the live account actions.
          </p>
          <a href="/profile" className="mt-4 inline-flex rounded-lg bg-[#120914] px-5 py-3 font-black text-white">
            Go to profile
          </a>
        </div>
      </LegalPage>
    </>
  );
}
