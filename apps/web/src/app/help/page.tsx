import type { Metadata } from 'next';
import { buildFaqSchema, buildPageMetadata } from '../../lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Help Center | MindCare Support',
  description: 'Get MindCare support for accounts, therapist access, bookings, and online sessions.',
  path: '/help',
  keywords: ['MindCare help', 'online therapy support', 'therapy booking support'],
});

const faqSchema = buildFaqSchema([
  {
    question: 'How do I start using MindCare?',
    answer: 'Create an account, choose the support you need, and continue into therapist matching and booking as the platform is built out.',
  },
  {
    question: 'Is MindCare for online therapy access?',
    answer: 'Yes. MindCare is being built as an online therapy access platform for clients and licensed therapists.',
  },
]);

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <section className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-300">Support</p>
        <h1 className="mt-4 text-4xl font-semibold">MindCare Help Center</h1>
        <p className="mt-4 text-slate-300">
          Support content for accounts, therapist access, booking, and secure online sessions will live here.
        </p>
      </section>
    </main>
  );
}
