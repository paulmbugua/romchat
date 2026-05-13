import type { Metadata } from 'next';
import { buildPageMetadata } from '../../lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Login or Sign Up | MindCare',
  description: 'Log in or create your MindCare account for online therapy access.',
  path: '/login',
  noIndex: true,
});

export default function Page() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-white">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.04] p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-300">MindCare</p>
        <h1 className="mt-4 text-3xl font-semibold">Account access</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Authentication for clients and therapists will be connected here.
        </p>
      </section>
    </main>
  );
}
