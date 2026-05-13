import type { Metadata } from 'next';
import { buildFaqSchema, buildPageMetadata } from '../lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'MindCare Online Therapy | Private Mental Health Support',
  description:
    'Find a therapist, book a private online session, and manage your therapy access from one secure web app.',
  path: '/',
  keywords: ['online therapy', 'therapy booking', 'mental health access'],
});

const homepageFaq = buildFaqSchema([
  {
    question: 'What is MindCare?',
    answer:
      'MindCare is an online therapy access platform for discovering therapists, booking sessions, and managing care securely.',
  },
  {
    question: 'Can clients book therapy online?',
    answer:
      'Yes. The platform is being built around secure therapist discovery, availability, booking, and session access.',
  },
]);

const focusAreas = [
  'Private therapy sessions',
  'Therapist discovery',
  'Secure client accounts',
  'Session access and reminders',
];

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageFaq) }}
      />
      <main className="min-h-screen bg-slate-950 text-white">
        <section className="mx-auto grid min-h-screen max-w-6xl gap-10 px-6 py-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-300">
              MindCare Online Therapy
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-tight md:text-7xl">
              Therapy access that feels calm, private, and direct.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              A focused web app for clients to find licensed support, book secure online
              sessions, and keep their mental wellness journey organized.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/login"
                className="rounded-md bg-teal-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-200"
              >
                Start Access
              </a>
              <a
                href="/help"
                className="rounded-md border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40"
              >
                Get Support
              </a>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30">
            <div className="rounded-md bg-slate-900 p-5">
              <p className="text-sm font-medium text-slate-400">Platform foundation</p>
              <div className="mt-5 grid gap-3">
                {focusAreas.map((area) => (
                  <div
                    key={area}
                    className="rounded-md border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-100"
                  >
                    {area}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
