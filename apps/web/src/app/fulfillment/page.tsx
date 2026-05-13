import type { Metadata } from 'next';
import { buildPageMetadata } from '../../lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Service Access | MindCare',
  description: 'Understand how MindCare online therapy access will be delivered after signup or booking.',
  path: '/fulfillment',
  keywords: ['MindCare service access', 'online therapy booking'],
});

export default function Page() {
  return (
    <main className="min-h-screen bg-white px-6 py-16 text-slate-950">
      <section className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-semibold">Service Access</h1>
        <p className="mt-4 leading-7 text-slate-700">
          MindCare service access details for booking, session links, reminders, and support will be added as the
          therapy workflows are implemented.
        </p>
      </section>
    </main>
  );
}
