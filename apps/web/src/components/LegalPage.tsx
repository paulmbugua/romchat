import type { ReactNode } from 'react';
import { ArrowLeft, FileText, Landmark, LockKeyhole, Mail, Phone, ShieldCheck, Trash2, Wrench } from 'lucide-react';

type LegalSection = {
  title: string;
  body?: string;
  items?: string[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  updated: string;
  icon: 'terms' | 'privacy' | 'policies' | 'delete';
  sections: LegalSection[];
  children?: ReactNode;
};

const iconMap = {
  terms: FileText,
  privacy: LockKeyhole,
  policies: ShieldCheck,
  delete: Trash2,
};

export function LegalPage({ eyebrow, title, intro, updated, icon, sections, children }: LegalPageProps) {
  const Icon = iconMap[icon];

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-[#0b1c30]">
      <header className="border-b border-[#d7dbe5] bg-white px-4 py-4 md:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#0d1c32] text-[#fd761a]">
              <Wrench size={23} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9d4300]">Grogon Auto Industry</p>
              <p className="font-mont text-xl font-black">Grogon SACCO</p>
            </div>
          </a>
          <a href="/" className="inline-flex items-center gap-2 rounded-lg border border-[#0d1c32] px-4 py-2 text-sm font-black">
            <ArrowLeft size={16} />
            Home
          </a>
        </div>
      </header>

      <section className="border-b border-[#d7dbe5] bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1fr_280px] md:px-10 md:py-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d7dbe5] bg-[#eff4ff] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#39475f]">
              <Icon size={15} />
              {eyebrow}
            </div>
            <h1 className="font-mont mt-5 max-w-4xl text-4xl font-black leading-tight md:text-6xl">{title}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#44474d]">{intro}</p>
          </div>
          <aside className="rounded-xl border border-[#d7dbe5] bg-[#0d1c32] p-5 text-white">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-[#ffb690]">Effective date</p>
            <p className="mt-2 text-2xl font-black">{updated}</p>
            <div className="mt-5 space-y-3 text-sm font-semibold text-[#d6e3ff]">
              <p className="flex gap-2"><Landmark className="shrink-0 text-[#fd761a]" size={18} /> Member-owned SACCO services</p>
              <p className="flex gap-2"><Phone className="shrink-0 text-[#fd761a]" size={18} /> 0114330356</p>
              <p className="flex gap-2"><Mail className="shrink-0 text-[#fd761a]" size={18} /> members@grogonsacco.co.ke</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 md:px-10 md:py-14">
        <div className="grid gap-5">
          {sections.map((section) => (
            <article key={section.title} className="rounded-xl border border-[#d7dbe5] bg-white p-6 shadow-sm">
              <h2 className="font-mont text-2xl font-black">{section.title}</h2>
              {section.body ? <p className="mt-3 leading-8 text-[#44474d]">{section.body}</p> : null}
              {section.items ? (
                <ul className="mt-4 grid gap-3 text-[#44474d]">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-3 leading-7">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#fd761a]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
        {children}
      </section>

      <footer className="bg-[#0d1c32] px-4 py-8 text-[#d6e3ff] md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="font-semibold">Grogon SACCO - Kirinyaga Road, Nairobi</p>
          <div className="flex flex-wrap gap-4 text-sm font-bold text-white">
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href="/policies">Policies</a>
            <a href="/safety-standards">Safety standards</a>
            <a href="/delete-account">Delete account</a>
          </div>
        </div>
      </footer>
    </main>
  );
}