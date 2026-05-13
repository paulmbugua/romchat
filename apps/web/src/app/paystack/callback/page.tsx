import type { Metadata } from 'next';
import { buildPageMetadata } from '../../../lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Payment Verification | MindCare',
  description: 'Secure payment verification callback for MindCare checkout.',
  path: '/paystack/callback',
  noIndex: true,
});

export default function Page() {
  return (
    <main className="grid min-h-screen place-items-center bg-white px-6 text-slate-950">
      <section className="max-w-md text-center">
        <h1 className="text-3xl font-semibold">Payment verification</h1>
        <p className="mt-3 text-slate-700">Checkout verification will be connected here.</p>
      </section>
    </main>
  );
}
