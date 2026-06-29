import {
  BadgeCheck,
  Banknote,
  ClipboardCheck,
  Clock3,
  FileText,
  HandCoins,
  Landmark,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from 'lucide-react';

const benefits = [
  'Member savings and withdrawable deposits',
  'Asset finance for lifts, compressors, scanners and spray booths',
  'Working capital for spares, payroll and insurance renewals',
  'Dividends and patronage rebates for active members',
];

const products = [
  {
    title: 'Jua Kali Member',
    detail: 'For individual mechanics, electricians, painters and panel beaters.',
    price: 'KES 2,500 joining fee',
  },
  {
    title: 'Garage Member',
    detail: 'For workshops with bays, apprentices, fleet customers or service contracts.',
    price: 'Monthly savings from KES 5,000',
  },
  {
    title: 'Parts & Spares Trader',
    detail: 'For spare-part shops, stockists, importers, resellers and specialist suppliers.',
    price: 'Stock finance after KYC',
  },
];

export default function Page() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] text-[#0b1c30]">
      <header className="sticky top-0 z-40 border-b border-[#d7dbe5] bg-white/95 px-4 py-3 backdrop-blur md:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#0d1c32] text-[#fd761a]">
              <Wrench size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9d4300]">Grogon Auto Industry</p>
              <h1 className="font-mont text-xl font-black">Grogon SACCO</h1>
            </div>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-bold md:flex">
            <a href="#about">About</a>
            <a href="#membership">Membership</a>
            <a href="#loans">Loans</a>
            <a href="#governance">Governance</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <a href="/login" className="rounded-lg border border-[#0d1c32] px-4 py-2 text-sm font-black">
              Member Login
            </a>
            <a href="#join" className="hidden rounded-lg bg-[#fd761a] px-4 py-2 text-sm font-black text-[#351000] sm:inline-flex">
              Join
            </a>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[#d7dbe5] bg-white">
        <div className="absolute inset-0 hex-pattern opacity-80" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-[1.08fr_0.92fr] md:px-10 md:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d7dbe5] bg-[#eff4ff] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#39475f]">
              <Sparkles size={15} />
              Built around Kirinyaga Road workshops
            </div>
            <h2 className="font-mont mt-6 max-w-4xl text-5xl font-black leading-[1.02] md:text-7xl">
              Where Grogon mechanics and spare shops save, borrow and grow.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#44474d]">
              Built for Kirinyaga Road mechanics, auto electricians, panel beaters, painters, spare-part shops and garage owners who need disciplined savings, fair equipment finance and working capital that understands workshop cashflow.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#join" className="rounded-lg bg-[#0d1c32] px-5 py-3 font-black text-white">
                Become a Member
              </a>
              <a href="/login" className="rounded-lg bg-[#fd761a] px-5 py-3 font-black text-[#351000]">
                Login to Portal
              </a>
            </div>
          </div>
          <div className="rounded-2xl border border-[#c5c6cd] bg-[#0d1c32] p-5 text-white shadow-2xl">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#ffb690]">What members access after login</p>
              <div className="mt-5 grid gap-3">
                {benefits.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-lg bg-white/8 p-4">
                    <BadgeCheck className="mt-0.5 shrink-0 text-[#fd761a]" size={20} />
                    <span className="font-semibold text-[#eaf1ff]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-4 py-16 md:px-10">
        <div className="grid gap-6 md:grid-cols-3">
          <Info icon={<MapPin />} title="Where we serve" text="Grogon, Kirinyaga Road, Kamukunji, downtown garages and the surrounding motor-trade lanes." />
          <Info icon={<Users />} title="Who can join" text="Mechanics, auto shops, parts sellers, body shops, diagnostic technicians and verified suppliers." />
          <Info icon={<ShieldCheck />} title="How we operate" text="Member-owned savings, transparent credit review, KYC verification and elected oversight." />
        </div>
      </section>

      <section id="membership" className="bg-[#0d1c32] px-4 py-16 text-white md:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#ffb690]">Membership</p>
          <h2 className="font-mont mt-3 max-w-3xl text-4xl font-black">Simple entry, serious discipline.</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {products.map((product) => (
              <div key={product.title} className="rounded-xl border border-white/10 bg-white/6 p-6">
                <h3 className="font-mont text-2xl font-black">{product.title}</h3>
                <p className="mt-3 leading-7 text-[#d6e3ff]">{product.detail}</p>
                <p className="mt-5 rounded-lg bg-[#fd761a] px-4 py-3 font-black text-[#351000]">{product.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="loans" className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:grid-cols-[0.9fr_1.1fr] md:px-10">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#9d4300]">SACCO services</p>
          <h2 className="font-mont mt-3 text-4xl font-black">Credit designed around workshop cashflow.</h2>
          <p className="mt-4 leading-8 text-[#44474d]">
            Members can apply for asset finance, working capital, emergency support and
            business-growth loans after savings history and KYC review.
          </p>
        </div>
        <div className="grid gap-4">
          <Service icon={<Banknote />} title="Equipment finance" text="Lifts, compressors, diagnostic scanners, welders, paint booths and specialty tools." />
          <Service icon={<HandCoins />} title="Working capital" text="Short-cycle stock, M-Pesa float and payroll support for shops waiting on fleet, insurer or customer payments." />
          <Service icon={<Clock3 />} title="Repayment discipline" text="Monthly schedules, reminders and repayment tracking through the member portal." />
          <Service icon={<FileText />} title="Statements and dividends" text="Members can access statements, annual dividends and payout preference records after login." />
        </div>
      </section>

      <section id="governance" className="border-y border-[#d7dbe5] bg-white px-4 py-16 md:px-10">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-2">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#9d4300]">Governance</p>
            <h2 className="font-mont mt-3 text-4xl font-black">Member money needs visible rules.</h2>
          </div>
          <div className="grid gap-3">
            {['KYC before account activation', 'Credit committee approval for loans', 'Annual member meetings and audited reports', 'Clear complaint and appeal process'].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-lg bg-[#eff4ff] p-4 font-bold">
                <ClipboardCheck className="text-[#9d4300]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="join" className="mx-auto max-w-7xl px-4 py-16 md:px-10">
        <div className="grid gap-8 rounded-2xl bg-[#fd761a] p-8 text-[#351000] md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em]">Ready to join?</p>
            <h2 className="font-mont mt-2 text-4xl font-black">Bring your ID, KRA PIN and workshop details.</h2>
            <p className="mt-3 max-w-2xl font-semibold">
              The SACCO desk verifies your trade, records your next of kin, activates savings and
              then gives you portal access.
            </p>
          </div>
          <a href="/login" className="rounded-lg bg-[#0d1c32] px-6 py-4 text-center font-black text-white">
            Start Member Access
          </a>
        </div>
      </section>

      <footer id="contact" className="bg-[#0d1c32] px-4 py-10 text-[#d6e3ff] md:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mont text-2xl font-black text-white">Grogon SACCO</p>
            <p className="mt-2">Kirinyaga Road, Nairobi - 0114330356 - members@grogonsacco.co.ke</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-white">
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href="/policies">Policies</a>
            <a href="/delete-account">Delete account</a>
            <a href="/login" className="rounded-lg border border-white/20 px-5 py-3 font-black text-white">
              Member Login
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Info({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-[#d7dbe5] bg-white p-6 shadow-sm">
      <div className="text-[#9d4300]">{icon}</div>
      <h3 className="font-mont mt-4 text-2xl font-black">{title}</h3>
      <p className="mt-3 leading-7 text-[#44474d]">{text}</p>
    </div>
  );
}

function Service({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-[#d7dbe5] bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#eff4ff] text-[#9d4300]">{icon}</div>
        <div>
          <h3 className="font-mont text-xl font-black">{title}</h3>
          <p className="mt-2 leading-7 text-[#44474d]">{text}</p>
        </div>
      </div>
    </div>
  );
}


