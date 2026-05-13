import type { Metadata } from 'next';
import { buildPageMetadata } from '../../lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Cookie Policy | MindCare',
  description: 'Read how MindCare will use cookies for secure account access and service reliability.',
  path: '/cookie-policy',
  keywords: ['MindCare cookie policy', 'online therapy cookies'],
});

export default function Page() {
  return (
    <main className="min-h-screen bg-white px-6 py-16 text-slate-950">
      <section className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-semibold">Cookie Policy</h1>
        <p className="mt-4 leading-7 text-slate-700">
          MindCare will use essential cookies for secure sign-in, preferences, and reliable service delivery.
          Detailed policy content will be finalized before production launch.
        </p>
      </section>
    </main>
  );
}
