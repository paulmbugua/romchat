'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

const sections = [
  {
    "title": "Eligibility",
    "body": "RomChat is for adults 18+ only. Users must provide accurate profile information and must not impersonate others."
  },
  {
    "title": "Community conduct",
    "body": "No harassment, hate, sexual coercion, scams, spam, fake profiles, or pressure to move conversations off platform."
  },
  {
    "title": "Paid features",
    "body": "Tokens, subscriptions, Super Likes, boosts, and premium discovery features are optional and are shown in Kenyan Shillings where applicable."
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
          <h1 className="mt-5 text-4xl font-black sm:text-6xl">Terms of Use</h1>
          <p className="mt-4 max-w-3xl leading-8 text-white/70">Rules for using RomChat dating, chatting, token, and safety features.</p>
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
