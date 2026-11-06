import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  BadgeAlert,
  FileWarning,
  Gavel,
  MessageCircleWarning,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Child Safety Standards | RomChat',
  description:
    'RomChat child safety standards prohibiting child sexual abuse and exploitation, grooming, sextortion, trafficking, and child sexual abuse material.',
  alternates: { canonical: '/safety-standards' },
};

const standards = [
  {
    id: 'zero-tolerance',
    icon: ShieldCheck,
    title: 'Zero tolerance for child sexual abuse and exploitation',
    body:
      'RomChat strictly prohibits child sexual abuse and exploitation (CSAE) and any content or conduct that sexually exploits, abuses, or endangers a child. This includes child grooming, sexualization of a minor, sextortion, child trafficking, solicitation of a minor, and attempts to obtain or exchange sexual imagery involving a minor.',
  },
  {
    id: 'csam',
    icon: FileWarning,
    title: 'Child sexual abuse material is prohibited',
    body:
      'Users must not create, upload, store, request, share, distribute, or promote child sexual abuse material (CSAM), including real, altered, computer-generated, or other visual depictions of a minor in sexually explicit conduct. RomChat removes such material when it obtains actual knowledge of it and preserves relevant evidence where legally required.',
  },
  {
    id: 'adult-only',
    icon: UserRoundCheck,
    title: 'Adults-only service',
    body:
      'RomChat is a dating service for people aged 18 and older. Accounts believed to belong to minors, accounts that misrepresent age, or adults attempting sexual contact with minors are investigated and may be immediately restricted, suspended, or permanently removed. Age or identity verification may be required when risk signals arise.',
  },
  {
    id: 'reporting',
    icon: MessageCircleWarning,
    title: 'Reporting and immediate safety action',
    body:
      'Members can report and block a profile from its profile screen and report unsafe messages from chat. Reports involving suspected underage users, grooming, CSAE, or CSAM receive urgent safety review. Members should not download, forward, or redistribute suspected CSAM; they should report it immediately through RomChat and contact local law enforcement when a child may be in immediate danger.',
  },
  {
    id: 'enforcement',
    icon: BadgeAlert,
    title: 'Moderation and enforcement',
    body:
      'RomChat may review reported profiles, messages, and uploaded media; remove prohibited content; disable access; suspend or terminate accounts; prevent repeat access; and retain limited records needed for safety, investigation, and legal compliance. A confirmed violation can result in permanent removal without prior warning.',
  },
  {
    id: 'legal-compliance',
    icon: Gavel,
    title: 'Cooperation with authorities',
    body:
      'RomChat complies with applicable child-safety laws and responds to valid legal requests. Confirmed CSAM and related child exploitation may be reported to the National Center for Missing & Exploited Children or the appropriate regional or national authority, as required by law. RomChat cooperates with lawful investigations and does not notify an offender when doing so could endanger a child or compromise an investigation.',
  },
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
            <ShieldCheck size={15} /> Published safety standards
          </div>
          <h1 className="mt-5 text-4xl font-black sm:text-6xl">RomChat Child Safety Standards</h1>
          <p className="mt-4 max-w-3xl leading-8 text-white/70">
            These standards explain how RomChat prevents and responds to child sexual abuse and exploitation across its dating, profile, media, and chat services.
          </p>
          <p className="mt-4 text-sm font-bold text-white/45">Effective 6 November 2026</p>
        </section>

        <nav aria-label="Child safety standards" className="mt-5 flex flex-wrap gap-2">
          {standards.map(({ id, title }) => (
            <a key={id} href={`#${id}`} className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/70 hover:border-[#ff1493]/60 hover:text-white">
              {title}
            </a>
          ))}
        </nav>

        <div className="mt-5 grid gap-4">
          {standards.map(({ id, icon: Icon, title, body }) => (
            <article id={id} key={id} className="scroll-mt-5 rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#ff1493]/15 text-[#ff7abf]">
                  <Icon size={18} />
                </div>
                <h2 className="text-2xl font-black">{title}</h2>
              </div>
              <p className="mt-3 leading-8 text-white/70">{body}</p>
            </article>
          ))}
        </div>

        <section id="contact" className="mt-5 rounded-[28px] border border-[#ff1493]/30 bg-[#ff1493]/10 p-6">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#ff8bc7]">Report a concern</p>
          <h2 className="mt-2 text-2xl font-black">Use RomChat&apos;s in-app safety tools</h2>
          <p className="mt-3 leading-8 text-white/70">
            Open the relevant profile or conversation and choose Report or Block and Report. Include enough detail for the safety team to identify the account and assess the concern. If a child is in immediate danger, contact local law enforcement or the appropriate child-protection authority first.
          </p>
        </section>

        <footer className="mt-8 flex flex-wrap gap-5 border-t border-white/10 py-6 text-sm font-bold text-white/55">
          <Link href="/terms">Terms of Use</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/complaints-feedback">Complaints and feedback</Link>
        </footer>
      </div>
    </main>
  );
}
