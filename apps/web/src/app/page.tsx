'use client';

import {
  BadgeCheck,
  Bell,
  CalendarDays,
  Camera,
  Check,
  ChevronLeft,
  Heart,
  Lock,
  MapPin,
  MessageCircle,
  Mic,
  Phone,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Star,
  Video,
  WalletCards,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type Tab = 'discover' | 'chat' | 'events' | 'safety' | 'wallet' | 'profile';

const profiles = [
  {
    id: 'elena',
    name: 'Elena',
    age: 26,
    city: 'New York',
    image: '/assets/romchat/profile-elena.png',
    match: 94,
    intent: 'Long-term, slow burn',
    prompt: 'A perfect Sunday is coffee, galleries, and dinner where phones stay away.',
    interests: ['Architecture', 'Jazz', 'Mindful dating', 'Travel'],
    verified: true,
    online: true,
  },
  {
    id: 'amara',
    name: 'Amara',
    age: 29,
    city: 'Brooklyn',
    image: '/assets/romchat/profile-amara.png',
    match: 91,
    intent: 'Ready for partnership',
    prompt: 'I plan tiny rituals, host thoughtful dinners, and remember the details.',
    interests: ['Cooking', 'Design', 'Film', 'Live music'],
    verified: true,
    online: false,
  },
  {
    id: 'noah',
    name: 'Noah',
    age: 31,
    city: 'Jersey City',
    image: '/assets/romchat/profile-noah.png',
    match: 88,
    intent: 'Intentional connection',
    prompt: 'Builder, runner, and the friend who books the table before anyone asks.',
    interests: ['Startups', 'Running', 'Books', 'Rooftops'],
    verified: true,
    online: true,
  },
];

const messages = [
  { from: 'Elena', text: 'Your answer about building a life with room for quiet days was rare.', side: 'left' },
  { from: 'You', text: 'I meant it. The best connection feels calm before it feels exciting.', side: 'right' },
  { from: 'Elena', text: 'That deserves a golden-hour walk. Saturday?', side: 'left' },
];

const events = [
  { title: 'Golden Hour Social', date: 'Fri 8:00 PM', seats: 18, price: '$24', image: '/assets/romchat/event-golden-hour.png' },
  { title: 'Mindful Dating Workshop', date: 'Sun 11:00 AM', seats: 9, price: '$18', image: '/assets/romchat/event-golden-hour.png' },
];

const steps = ['Intent', 'Identity', 'Photos', 'Prompts', 'Safety'];

export default function Page() {
  const [tab, setTab] = useState<Tab>('discover');
  const [index, setIndex] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(3);
  const activeProfile = profiles[index % profiles.length];
  const visibleProfiles = useMemo(() => profiles.filter((profile) => !verifiedOnly || profile.verified), [verifiedOnly]);

  function nextProfile() {
    setIndex((current) => (current + 1) % visibleProfiles.length);
  }

  return (
    <main className="min-h-screen bg-[#f9f9fc] text-[#1a1c1e]">
      <header className="sticky top-0 z-40 border-b border-[#ddbfc0]/70 bg-white/80 px-4 py-3 backdrop-blur-xl md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <a href="/" className="flex min-w-0 items-center gap-3">
            <img src="/assets/romchat/icon.png" alt="RomChat logo" className="h-11 w-11 rounded-2xl shadow-lg" />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase text-[#a63646]">RomChat</p>
              <h1 className="truncate text-xl font-black">Intentional dating. Verified chemistry.</h1>
            </div>
          </a>
          <nav className="hidden items-center gap-2 rounded-full border border-[#ddbfc0] bg-white/75 p-1 shadow-sm lg:flex">
            {(['discover', 'chat', 'events', 'safety', 'wallet', 'profile'] as Tab[]).map((item) => (
              <button key={item} onClick={() => setTab(item)} className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${tab === item ? 'bg-[#1a1c1e] text-white' : 'text-[#574142] hover:bg-[#f3f3f6]'}`}>
                {item}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button className="grid h-10 w-10 place-items-center rounded-full border border-[#ddbfc0] bg-white text-[#574142]"><Bell size={18} /></button>
            <button className="rounded-full bg-[#a63646] px-4 py-2 text-sm font-black text-white shadow-[0_10px_25px_rgba(244,113,127,0.28)]">Get verified</button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-5 md:px-8 xl:grid-cols-[280px_1fr_360px]">
        <aside className="hidden rounded-[28px] border border-[#ddbfc0] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] xl:block">
          <div className="flex items-center gap-3">
            <img src="/assets/romchat/profile-mia.png" alt="Your RomChat profile" className="h-14 w-14 rounded-2xl object-cover" />
            <div>
              <p className="font-black">Mia</p>
              <p className="text-sm text-[#574142]">Profile strength 86%</p>
            </div>
          </div>
          <div className="mt-5 h-2 rounded-full bg-[#e2e2e5]"><div className="h-2 w-[86%] rounded-full bg-[#f4717f]" /></div>
          <div className="mt-6 grid gap-2">
            {steps.map((step, stepIndex) => (
              <button key={step} onClick={() => setOnboardingStep(stepIndex + 1)} className={`flex items-center justify-between rounded-2xl px-4 py-3 text-left font-bold ${onboardingStep === stepIndex + 1 ? 'bg-[#ffdadb] text-[#6a041e]' : 'bg-[#f3f3f6] text-[#574142]'}`}>
                {step}
                {stepIndex + 1 < onboardingStep ? <Check size={17} /> : <span className="text-xs">{stepIndex + 1}/5</span>}
              </button>
            ))}
          </div>
          <div className="mt-6 rounded-[24px] bg-[#1a1c1e] p-5 text-white">
            <Shield className="text-[#26c6c4]" />
            <h2 className="mt-3 text-lg font-black">Trust score</h2>
            <p className="mt-2 text-sm leading-6 text-[#f0f0f3]">Photo liveness, ID checks, conversation pacing, and report history shape every recommendation.</p>
          </div>
        </aside>

        <section className="min-w-0">
          {tab === 'discover' && <Discovery profile={activeProfile} verifiedOnly={verifiedOnly} setVerifiedOnly={setVerifiedOnly} nextProfile={nextProfile} />}
          {tab === 'chat' && <Chat />}
          {tab === 'events' && <Events />}
          {tab === 'safety' && <Safety />}
          {tab === 'wallet' && <Wallet />}
          {tab === 'profile' && <ProfileBuilder onboardingStep={onboardingStep} setOnboardingStep={setOnboardingStep} />}
        </section>

        <aside className="grid gap-5">
          <CompatibilityCard />
          <CallCard />
          <RequestsCard />
        </aside>
      </section>

      <nav className="fixed bottom-3 left-1/2 z-50 flex w-[calc(100%-24px)] max-w-xl -translate-x-1/2 justify-between rounded-full border border-white/80 bg-white/80 p-2 shadow-2xl backdrop-blur-xl lg:hidden">
        {(['discover', 'chat', 'events', 'safety', 'profile'] as Tab[]).map((item) => (
          <button key={item} onClick={() => setTab(item)} className={`grid h-12 min-w-12 place-items-center rounded-full px-3 text-xs font-black capitalize ${tab === item ? 'bg-[#1a1c1e] text-white' : 'text-[#574142]'}`}>
            {item}
          </button>
        ))}
      </nav>
    </main>
  );
}

function Discovery({ profile, verifiedOnly, setVerifiedOnly, nextProfile }: any) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
      <section className="relative min-h-[720px] overflow-hidden rounded-[32px] border border-[#ddbfc0] bg-[#1a1c1e] shadow-[0_18px_60px_rgba(26,28,30,0.18)]">
        <img src={profile.image} alt={`${profile.name} profile`} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute left-5 right-5 top-5 flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-full border border-white/25 bg-white/20 px-3 py-2 text-sm font-bold text-white backdrop-blur-xl">
            <MapPin size={16} /> {profile.city}
          </div>
          <button className="grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-white/20 text-white backdrop-blur-xl"><SlidersHorizontal /></button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[#a63646]">
            <Sparkles size={16} /> {profile.match}% compatible
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-5xl font-black text-white md:text-7xl">{profile.name}, {profile.age}</h2>
            <BadgeCheck className="text-[#26c6c4]" size={34} />
          </div>
          <p className="mt-3 max-w-2xl text-xl font-semibold text-[#ffdadb]">{profile.intent}</p>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-white">{profile.prompt}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {profile.interests.map((item: string) => <span key={item} className="rounded-full bg-white/20 px-4 py-2 text-sm font-bold text-white backdrop-blur-xl">{item}</span>)}
          </div>
          <div className="mt-7 flex items-center justify-center gap-3">
            <button onClick={nextProfile} className="grid h-16 w-16 place-items-center rounded-full bg-white text-[#574142] shadow-xl"><X /></button>
            <button onClick={nextProfile} className="grid h-20 w-20 place-items-center rounded-full bg-[#a63646] text-white shadow-[0_10px_25px_rgba(244,113,127,0.42)]"><Heart fill="currentColor" size={34} /></button>
            <button onClick={nextProfile} className="grid h-16 w-16 place-items-center rounded-full bg-[#26c6c4] text-[#102120] shadow-xl"><Star fill="currentColor" /></button>
          </div>
        </div>
      </section>
      <section className="grid gap-4">
        <div className="rounded-[28px] border border-[#ddbfc0] bg-white p-5">
          <p className="text-sm font-black uppercase text-[#a63646]">Discovery mode</p>
          <h3 className="mt-2 text-2xl font-black">Quality over endless swiping.</h3>
          <p className="mt-3 leading-7 text-[#574142]">RomChat ranks people by intent alignment, safety confidence, shared rhythms, and mutual curiosity.</p>
          <label className="mt-5 flex items-center justify-between rounded-2xl bg-[#f3f3f6] p-4 font-bold">
            Verified only
            <input type="checkbox" checked={verifiedOnly} onChange={(event) => setVerifiedOnly(event.target.checked)} className="h-5 w-5 accent-[#a63646]" />
          </label>
        </div>
        <div className="rounded-[28px] bg-[#ffdadb] p-5 text-[#40000e]">
          <Lock />
          <h3 className="mt-3 text-xl font-black">Private by design</h3>
          <p className="mt-2 text-sm leading-6">Screenshots trigger privacy notices. Phone and video unlock only after mutual consent.</p>
        </div>
      </section>
    </div>
  );
}

function Chat() {
  return (
    <section className="overflow-hidden rounded-[32px] border border-[#ddbfc0] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
      <header className="flex items-center justify-between border-b border-[#e2e2e5] bg-white/80 p-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button className="grid h-10 w-10 place-items-center rounded-full bg-[#f3f3f6]"><ChevronLeft /></button>
          <img src="/assets/romchat/profile-elena.png" alt="Elena" className="h-12 w-12 rounded-full object-cover" />
          <div><p className="font-black">Elena</p><p className="text-sm text-[#574142]">Online now, verified</p></div>
        </div>
        <div className="flex gap-2"><button className="grid h-10 w-10 place-items-center rounded-full bg-[#ffdadb] text-[#a63646]"><Phone /></button><button className="grid h-10 w-10 place-items-center rounded-full bg-[#1a1c1e] text-white"><Video /></button></div>
      </header>
      <div className="min-h-[560px] bg-[#f9f9fc] p-5">
        <div className="mb-5 rounded-2xl border border-[#ddbfc0] bg-[#fff7f8] p-4 text-sm font-semibold text-[#6a041e]">Trust insight: Elena is verified, conversation pace is healthy, and no risky language has been detected.</div>
        {messages.map((message) => (
          <div key={message.text} className={`mb-4 flex ${message.side === 'right' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[76%] rounded-[22px] px-5 py-3 leading-7 ${message.side === 'right' ? 'bg-[#a63646] text-white rounded-br-md' : 'bg-white text-[#1a1c1e] rounded-bl-md shadow-sm'}`}>
              {message.text}
            </div>
          </div>
        ))}
      </div>
      <footer className="flex gap-3 border-t border-[#e2e2e5] p-4">
        <button className="grid h-12 w-12 place-items-center rounded-full bg-[#f3f3f6]"><Camera /></button>
        <input className="min-w-0 flex-1 rounded-full border border-[#ddbfc0] bg-[#f9f9fc] px-5 outline-none focus:border-[#f4717f]" placeholder="Send a thoughtful message" />
        <button className="grid h-12 w-12 place-items-center rounded-full bg-[#a63646] text-white"><MessageCircle /></button>
      </footer>
    </section>
  );
}

function Events() {
  return <section className="grid gap-5">{events.map((event) => <div key={event.title} className="overflow-hidden rounded-[32px] border border-[#ddbfc0] bg-white shadow-sm"><img src={event.image} alt={event.title} className="h-64 w-full object-cover" /><div className="grid gap-3 p-5 md:grid-cols-[1fr_auto] md:items-center"><div><p className="text-sm font-black uppercase text-[#a63646]">Curated event</p><h2 className="mt-1 text-3xl font-black">{event.title}</h2><p className="mt-2 text-[#574142]">{event.date} - {event.seats} seats left - {event.price}</p></div><button className="rounded-full bg-[#1a1c1e] px-5 py-3 font-black text-white">Reserve seat</button></div></div>)}</section>;
}

function Safety() {
  const items = ['ID and liveness verification', 'Screenshot privacy warnings', 'Message risk detection', 'Block, report, and trusted-contact check-ins', 'Consent gate for calls and gifts'];
  return <section className="rounded-[32px] border border-[#ddbfc0] bg-white p-6"><p className="text-sm font-black uppercase text-[#a63646]">Safety hub</p><h2 className="mt-2 text-4xl font-black">Built for grown-up dating.</h2><div className="mt-6 grid gap-3">{items.map((item) => <div key={item} className="flex items-center gap-3 rounded-2xl bg-[#f3f3f6] p-4 font-bold"><Shield className="text-[#26c6c4]" />{item}</div>)}</div></section>;
}

function Wallet() {
  return <section className="grid gap-5 md:grid-cols-2"><div className="rounded-[32px] bg-[#1a1c1e] p-6 text-white"><WalletCards /><h2 className="mt-4 text-4xl font-black">$46.00</h2><p className="mt-2 text-[#ffdadb]">RomChat wallet balance</p><button className="mt-6 rounded-full bg-white px-5 py-3 font-black text-[#1a1c1e]">Add funds</button></div><div className="rounded-[32px] border border-[#ddbfc0] bg-white p-6"><h3 className="text-2xl font-black">Premium actions</h3>{['Send a gift', 'Boost verified profile', 'Book event ticket', 'Unlock voice note'].map((item) => <div key={item} className="mt-3 flex items-center justify-between rounded-2xl bg-[#f3f3f6] p-4 font-bold"><span>{item}</span><span className="text-[#a63646]">$6</span></div>)}</div></section>;
}

function ProfileBuilder({ onboardingStep, setOnboardingStep }: any) {
  return <section className="rounded-[32px] border border-[#ddbfc0] bg-white p-6"><p className="text-sm font-black uppercase text-[#a63646]">Onboarding</p><h2 className="mt-2 text-4xl font-black">Make the profile feel like a real introduction.</h2><div className="mt-6 h-2 rounded-full bg-[#e2e2e5]"><div className="h-2 rounded-full bg-[#f4717f]" style={{ width: `${onboardingStep * 20}%` }} /></div><div className="mt-6 grid gap-4 md:grid-cols-2">{steps.map((step, index) => <button key={step} onClick={() => setOnboardingStep(index + 1)} className={`rounded-3xl border p-5 text-left ${onboardingStep === index + 1 ? 'border-[#a63646] bg-[#ffdadb]' : 'border-[#e2e2e5] bg-[#f9f9fc]'}`}><p className="font-black">{step}</p><p className="mt-2 text-sm leading-6 text-[#574142]">Complete this section to improve match quality and trust ranking.</p></button>)}</div></section>;
}

function CompatibilityCard() {
  return <div className="rounded-[28px] border border-[#ddbfc0] bg-white p-5"><p className="text-sm font-black uppercase text-[#a63646]">Compatibility</p><h2 className="mt-2 text-3xl font-black">92%</h2><p className="mt-2 leading-7 text-[#574142]">Shared desire for intentional connection, calm weekends, design, and travel.</p></div>;
}

function CallCard() {
  return <div className="rounded-[28px] bg-[#1a1c1e] p-5 text-white"><Mic className="text-[#26c6c4]" /><h2 className="mt-3 text-2xl font-black">Video vibe check</h2><p className="mt-2 text-sm leading-6 text-[#f0f0f3]">A 7-minute consent-gated call with blur, report, and instant exit controls.</p><button className="mt-4 rounded-full bg-[#f4717f] px-4 py-2 font-black">Start call</button></div>;
}

function RequestsCard() {
  return <div className="rounded-[28px] border border-[#ddbfc0] bg-white p-5"><CalendarDays className="text-[#a63646]" /><h2 className="mt-3 text-2xl font-black">3 new requests</h2><p className="mt-2 text-sm leading-6 text-[#574142]">Verified members who answered your relationship-intention prompt.</p></div>;
}
