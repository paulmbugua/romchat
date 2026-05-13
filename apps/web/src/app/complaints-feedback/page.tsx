import type { Metadata } from 'next';
import ComplaintsFeedbackPage from '../../pages/ComplaintsFeedback';
import { buildBreadcrumbSchema, buildPageMetadata } from '../../lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Complaints & Feedback | MindCare',
  description:
    'Contact MindCare with service complaints, billing concerns, technical issues, account concerns, and product feedback.',
  path: '/complaints-feedback',
  keywords: ['MindCare complaints', 'MindCare feedback', 'online therapy support'],
});

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: 'Home', path: '/' },
  { name: 'Complaints & Feedback', path: '/complaints-feedback' },
]);

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ComplaintsFeedbackPage />
    </>
  );
}
