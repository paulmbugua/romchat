import type { Metadata } from 'next';
import AntiSpamPolicyPage from '../../pages/AntiSpamPolicy';
import { buildBreadcrumbSchema, buildPageMetadata } from '../../lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Anti-Spam Policy | MindCare',
  description:
    'Review MindCare anti-spam commitments, permitted communications, unsubscribe expectations, and abuse reporting instructions.',
  path: '/anti-spam-policy',
  keywords: ['MindCare anti-spam policy', 'email compliance', 'online therapy support'],
});

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: 'Home', path: '/' },
  { name: 'Anti-Spam Policy', path: '/anti-spam-policy' },
]);

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <AntiSpamPolicyPage />
    </>
  );
}
