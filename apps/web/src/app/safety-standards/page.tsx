import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, FileText, Lock, MessageCircleWarning, ShieldCheck, UserCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Safety Standards | RomChat',
  description: 'Public safety standards for RomChat, including verification, underage protection, abuse reporting, blocking, moderation, and enforcement.',
  alternates: { canonical: '/safety-standards' },
};

const sections = [
  { icon: UserCheck, title: 'Age and access standards', body: 'RomChat is intended for adults only. Accounts that appear underage, misrepresent age, or attempt to access the service as a minor may be rejected, suspended, or removed. We may require age and identity checks when risk signals appear.' },
  { icon: ShieldCheck, title: 'Verification standards', body: 'Profile photos, selfies, and account details may be reviewed to reduce impersonation, fake profiles, catfishing, and fraud. Verification may use automated checks, manual review, and liveness comparison where available.' },
  { icon: AlertTriangle, title: 'Abuse, exploitation, and spam standards', body: 'RomChat does not allow harassment, sexual exploitation, grooming, coercion, threats, hate speech, spam, scams, or requests that push users off-platform too early. Reported or automatically detected abuse may be blocked, reviewed, or escalated to the admin team.' },
  { icon: MessageCircleWarning, title: 'Blocking, reporting, and review', body: 'Users can block and report accounts or messages. Reports may be recorded for moderation review, appeal handling, and safety enforcement. Serious or repeated violations can lead to account restriction, suspension, or permanent removal.' },
  { icon: Lock, title: 'Content moderation', body: 'RomChat may moderate profile text, chat messages, uploaded media, and safety complaints using automated systems and human review where needed. Content that signals child sexual abuse and exploitation, sexual abuse, threats, or abusive conduct may be removed or escalated immediately.' },
  { icon: FileText, title: 'Contact and help', body: 'If you need help with a safety concern, use the in-app report flow or contact RomChat support through the website. Urgent safety issues should be reported immediately.' },
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
            <ShieldCheck size={15} /> Safety standards
          </div>
          <h1 className="mt-5 text-4xl font-black sm:text-6xl">RomChat Safety Standards</h1>
          <p className="mt-4 max-w-3xl leading-8 text-white/70">
            Public safety standards for RomChat&apos;s dating, chat, verification, reporting, blocking, moderation, and abuse-response systems.
          </p>
        </section>

        <div className="mt-5 grid gap-4">
          {sections.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#ff1493]/15 text-[#ff7abf]">
                  <Icon size={18} />
                </div>
                <h2 className="text-2xl font-black">{title}</h2>
              </div>
              <p className="mt-3 leading-8 text-white/70">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
