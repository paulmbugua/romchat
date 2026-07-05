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
  'Sample savings dashboard and balance views',
  'Sample asset-finance request screens',
  'Sample working-capital workflow',
  'Sample dividend and statement views',
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
    price: 'Sample monthly savings view',
  },
  {
    title: 'Parts & Spares Trader',
    detail: 'For spare-part shops, stockists, importers, resellers and specialist suppliers.',
    price: 'Sample stock finance request',
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
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9d4300]">Portfolio Demo App</p>
              <h1 className="font-mont text-xl font-black">Grogon Sacco Demo</h1>
            </div>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-bold md:flex">
            <a href="#about">About</a>
            <a href="#membership">Demo Flows</a>
            <a href="#loans">Loan UI</a>
            <a href="#governance">Activation</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <a href="/login" className="rounded-lg border border-[#0d1c32] px-4 py-2 text-sm font-black">
              Open Demo
            </a>
            <a href="#join" className="hidden rounded-lg bg-[#fd761a] px-4 py-2 text-sm font-black text-[#351000] sm:inline-flex">
              View Demo
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
              Demo app for portfolio review
            </div>
            <h2 className="font-mont mt-6 max-w-4xl text-5xl font-black leading-[1.02] md:text-7xl">
              A SACCO-style app concept for Grogon mechanics and spare shops.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#44474d]">
              This demo uses sample data to showcase login, member dashboards, savings views, loan request UI, dividend summaries, statements and support flows. It does not provide real savings, loans, payments, dividends or financial services.
            </p>
            <div className="mt-6 rounded-xl border border-[#fd761a] bg-[#fff7ed] p-4 text-sm font-bold leading-6 text-[#351000]">No real financial services are provided by this demo build. All balances, loan records, dividends, statements and support activity are sample data for app-development portfolio review.</div>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#join" className="rounded-lg bg-[#0d1c32] px-5 py-3 font-black text-white">
                View Demo Screens
              </a>
              <a href="/login" className="rounded-lg bg-[#fd761a] px-5 py-3 font-black text-[#351000]">
                Open Demo Portal
              </a>
            </div>
          </div>
          <div className="rounded-2xl border border-[#c5c6cd] bg-[#0d1c32] p-5 text-white shadow-2xl">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#ffb690]">What the demo previews</p>
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
          <Info icon={<MapPin />} title="Demo context" text="Designed around Grogon, Kirinyaga Road, Kamukunji, downtown garages and surrounding motor-trade lanes." />
          <Info icon={<Users />} title="Who it is designed for" text="Mechanics, auto shops, parts sellers, body shops, diagnostic technicians and verified suppliers." />
          <Info icon={<ShieldCheck />} title="Live activation path" text="Full SACCO operations can be activated later only after licensing, organization approval and live backend configuration." />
        </div>
      </section>

      <section id="membership" className="bg-[#0d1c32] px-4 py-16 text-white md:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#ffb690]">Demo Flows</p>
          <h2 className="font-mont mt-3 max-w-3xl text-4xl font-black">Demo screens, realistic workflow.</h2>
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
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#9d4300]">Demo services</p>
          <h2 className="font-mont mt-3 text-4xl font-black">Loan request UI designed around workshop cashflow.</h2>
          <p className="mt-4 leading-8 text-[#44474d]">
            The demo shows how members would request asset finance, working capital and support after onboarding. No real credit is offered in this build.
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
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#9d4300]">Activation</p>
            <h2 className="font-mont mt-3 text-4xl font-black">Full operations need visible rules and licensing.</h2>
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
            <p className="text-sm font-black uppercase tracking-[0.16em]">Ready to review the demo?</p>
            <h2 className="font-mont mt-2 text-4xl font-black">Sample data only. No real member onboarding is active.</h2>
            <p className="mt-3 max-w-2xl font-semibold">
              When licensed, the same system can be switched to live mode for verified members, backend records and admin-controlled activation.
            </p>
          </div>
          <a href="/login" className="rounded-lg bg-[#0d1c32] px-6 py-4 text-center font-black text-white">
            Open Demo Access
          </a>
        </div>
      </section>

      <footer id="contact" className="bg-[#0d1c32] px-4 py-10 text-[#d6e3ff] md:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mont text-2xl font-black text-white">Grogon Sacco Demo</p>
            <p className="mt-2">Kirinyaga Road, Nairobi - 0114330356 - members@grogonsacco.co.ke</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-white">
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href="/policies">Policies</a>
            <a href="/delete-account">Delete account</a>
            <a href="/login" className="rounded-lg border border-white/20 px-5 py-3 font-black text-white">
              Open Demo
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


