'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

const sections = [
  {
    "title": "Digital delivery",
    "body": "Tokens, Super Likes, boosts, and premium access are delivered digitally to the signed-in RomChat account after payment confirmation."
  },
  {
    "title": "Delivery issues",
    "body": "If a confirmed payment does not update your account, contact support with the payment reference and account email."
  }
];

export default function Page() {
  return (
    <main className="min-h-screen bg-[#09050b] px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-black text-white/80">
          <ArrowLeft size={16} /> Back to RomChat
        </Link>
        <section className="mt-6 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#ff1493] px-3 py-2 text-xs font-black uppercase">
            <ShieldCheck size={15} /> RomChat policy
          </div>
          <h1 className="mt-5 text-4xl font-black sm:text-6xl">Fulfillment & Delivery Policy</h1>
          <p className="mt-4 max-w-3xl leading-8 text-white/70">How RomChat delivers digital purchases and premium dating features.</p>
        </section>
        <div className="mt-5 grid gap-4">
          {sections.map((section) => (
            <article key={section.title} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-2xl font-black">{section.title}</h2>
              <p className="mt-3 leading-8 text-white/70">{section.body}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
