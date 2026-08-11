import React, { useEffect, useMemo, useState } from 'react';
import { APP_BACKEND_URL } from './config';
import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Download,
  Eye,
  HeartHandshake,
  MessageSquareWarning,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
} from 'lucide-react';

type QueueItem = {
  id: string;
  name: string;
  age: number;
  city: string;
  status: string;
  risk: string;
  notes: string;
};

const initialQueue: QueueItem[] = [
  { id: 'rv-101', name: 'Elena Marquez', age: 26, city: 'New York', status: 'liveness_pending', risk: 'low', notes: 'ID uploaded, selfie video pending final review.' },
  { id: 'rv-102', name: 'Amara Stone', age: 29, city: 'Brooklyn', status: 'manual_review', risk: 'medium', notes: 'Name mismatch between ID and payment profile.' },
  { id: 'rv-103', name: 'Noah Carter', age: 31, city: 'Jersey City', status: 'verified', risk: 'low', notes: 'Clean verification history and healthy report score.' },
];

const reports = [
  { id: 'rp-441', type: 'Harassment', member: 'Hidden user', severity: 'high', status: 'open' },
  { id: 'rp-442', type: 'Off-platform payment', member: 'Hidden user', severity: 'medium', status: 'triage' },
  { id: 'rp-443', type: 'Impersonation', member: 'Hidden user', severity: 'critical', status: 'open' },
];

const conversations = [
  { match: 'Mia and Elena', score: 98, state: 'healthy', last: 'Planning Saturday coffee.' },
  { match: 'Ari and Dana', score: 71, state: 'watch', last: 'Repeated phone-number pressure.' },
  { match: 'Noah and Sam', score: 87, state: 'healthy', last: 'Video call completed.' },
];

export default function App() {
  const [queue, setQueue] = useState(initialQueue);
  const [tab, setTab] = useState('Command');
  const [status, setStatus] = useState('RomChat operations online');
  const [verifiedFilter, setVerifiedFilter] = useState(false);
  const pending = useMemo(() => queue.filter((item) => item.status !== 'verified').length, [queue]);

  function approve(id: string) {
    setQueue((items) => items.map((item) => item.id === id ? { ...item, status: 'verified', risk: 'low', notes: 'Approved by RomChat trust desk.' } : item));
    setStatus('Member verified and discovery ranking updated.');
  }

  function hold(id: string) {
    setQueue((items) => items.map((item) => item.id === id ? { ...item, status: 'manual_hold', risk: 'high', notes: 'Held for senior safety review.' } : item));
    setStatus('Member placed on manual safety hold.');
  }

  const tabs = ['Command', 'Verification', 'Moderation', 'Conversations', 'Events', 'Revenue', 'Safety'];

  return (
    <main className="min-h-screen bg-[#f9f9fc] text-[#1a1c1e]">
      <aside className="fixed hidden h-screen w-72 border-r border-[#ddbfc0] bg-[#1a1c1e] p-6 text-white lg:block">
        <img src="/romchat-logo.svg" alt="RomChat admin" className="w-full rounded-3xl border border-white/10" />
        <div className="mt-6 rounded-3xl bg-white/8 p-4">
          <p className="text-sm font-bold uppercase text-[#ffdadb]">Trust desk</p>
          <h1 className="mt-1 text-2xl font-black">Admin Console</h1>
          <p className="mt-2 text-sm leading-6 text-[#f0f0f3]">Verification, safety, events, and monetization controls for RomChat.</p>
        </div>
        <nav className="mt-6 grid gap-2">
          {tabs.map((item) => (
            <button key={item} onClick={() => setTab(item)} className={`rounded-2xl px-4 py-3 text-left font-bold ${tab === item ? 'bg-[#f4717f] text-[#40000e]' : 'text-[#f0f0f3] hover:bg-white/10'}`}>
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <section className="lg:ml-72">
        <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-[#ddbfc0] bg-white/85 px-5 py-4 backdrop-blur-xl">
          <div>
            <p className="text-sm font-black uppercase text-[#a63646]">{status}</p>
            <h2 className="text-3xl font-black">{tab}</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStatus('Latest RomChat metrics loaded.')} className="inline-flex items-center gap-2 rounded-full bg-[#1a1c1e] px-4 py-2 font-bold text-white"><RefreshCw size={18} />Refresh</button>
            <button className="inline-flex items-center gap-2 rounded-full border border-[#ddbfc0] bg-white px-4 py-2 font-bold"><Download size={18} />Export</button>
          </div>
        </header>

        <div className="grid gap-4 p-5 md:grid-cols-4 xl:grid-cols-7">
          <Stat icon={<Users />} title="Members" value="248,910" />
          <Stat icon={<HeartHandshake />} title="Matches" value="64,230" />
          <Stat icon={<BadgeCheck />} title="Verified" value="81%" />
          <Stat icon={<MessageSquareWarning />} title="Open reports" value="43" />
          <Stat icon={<Video />} title="Calls today" value="1,482" />
          <Stat icon={<CalendarDays />} title="Events" value="27" />
          <Stat icon={<CreditCard />} title="Revenue" value="$92.4k" />
        </div>

        {tab === 'Command' && <Command pending={pending} setTab={setTab} />}
        {tab === 'Verification' && <Verification queue={queue} approve={approve} hold={hold} verifiedFilter={verifiedFilter} setVerifiedFilter={setVerifiedFilter} />}
        {tab === 'Moderation' && <Moderation />}
        {tab === 'Conversations' && <Conversations />}
        {tab === 'Events' && <Events />}
        {tab === 'Revenue' && <Revenue />}
        {tab === 'Safety' && <Safety />}
      </section>
    </main>
  );
}

function Stat({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return <div className="rounded-3xl border border-[#ddbfc0] bg-white p-4 shadow-sm"><div className="mb-3 text-[#a63646]">{icon}</div><p className="text-xs font-black uppercase text-[#574142]">{title}</p><p className="mt-2 text-2xl font-black">{value}</p></div>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="m-5 rounded-[32px] border border-[#ddbfc0] bg-white p-5 shadow-sm"><h3 className="mb-4 text-2xl font-black">{title}</h3>{children}</section>;
}

function Command({ pending, setTab }: { pending: number; setTab: (tab: string) => void }) {
  return (
    <div className="grid gap-5 p-5 xl:grid-cols-2">
      <Panel title="Live command center">
        <div className="grid gap-3">
          {[
            ['Verification queue', `${pending} pending`, 'Verification'],
            ['Critical reports', '3 need immediate review', 'Moderation'],
            ['Golden Hour Social', '18 seats left', 'Events'],
            ['Wallet settlement', '$18.2k ready', 'Revenue'],
          ].map(([title, detail, target]) => (
            <button key={title} onClick={() => setTab(target)} className="flex items-center justify-between rounded-3xl bg-[#f3f3f6] p-4 text-left font-bold">
              <span><span className="block text-lg font-black">{title}</span><span className="text-sm text-[#574142]">{detail}</span></span>
              <Sparkles className="text-[#a63646]" />
            </button>
          ))}
        </div>
      </Panel>
      <Panel title="Trust intelligence">
        <div className="grid gap-3">
          {conversations.map((item) => <div key={item.match} className="rounded-3xl bg-[#f9f9fc] p-4"><div className="flex justify-between gap-3"><p className="font-black">{item.match}</p><span className="font-black text-[#a63646]">{item.score}</span></div><p className="mt-2 text-sm text-[#574142]">{item.last}</p></div>)}
        </div>
      </Panel>
    </div>
  );
}

function Verification({ queue, approve, hold, verifiedFilter, setVerifiedFilter }: any) {
  const rows = verifiedFilter ? queue.filter((item: QueueItem) => item.status === 'verified') : queue;
  return (
    <Panel title="Verification review">
      <label className="mb-4 flex max-w-sm items-center justify-between rounded-2xl bg-[#f3f3f6] p-4 font-bold">
        Verified only
        <input type="checkbox" checked={verifiedFilter} onChange={(event) => setVerifiedFilter(event.target.checked)} className="h-5 w-5 accent-[#a63646]" />
      </label>
      <div className="grid gap-3">
        {rows.map((item: QueueItem) => <div key={item.id} className="grid gap-3 rounded-3xl border border-[#e2e2e5] bg-[#f9f9fc] p-4 md:grid-cols-[1fr_auto] md:items-center"><div><p className="text-lg font-black">{item.name}, {item.age}</p><p className="text-sm text-[#574142]">{item.city} - {item.status} - risk {item.risk}</p><p className="mt-2 text-sm leading-6">{item.notes}</p></div><div className="flex flex-wrap gap-2"><button className="rounded-full border border-[#ddbfc0] px-4 py-2 font-bold"><Eye size={17} /></button><button onClick={() => hold(item.id)} className="rounded-full bg-[#ffdad6] px-4 py-2 font-bold text-[#93000a]"><Ban size={17} /></button><button onClick={() => approve(item.id)} className="rounded-full bg-[#1a1c1e] px-4 py-2 font-bold text-white"><CheckCircle2 size={17} /></button></div></div>)}
      </div>
    </Panel>
  );
}

function Moderation() {
  const [cases, setCases] = useState<any[]>([]);
  const [appeals, setAppeals] = useState<any[]>([]);
  const [notice, setNotice] = useState('');
  const apiBase = APP_BACKEND_URL || 'http://localhost:4009';
  async function loadCases() {
    try {
      const res = await fetch(`${apiBase}/api/romchat/admin/moderation/cases`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Unable to load moderation queue');
      setCases(Array.isArray(data.cases) ? data.cases : []);
      setAppeals(Array.isArray(data.appeals) ? data.appeals : []);
      setNotice('');
    } catch (error: any) { setNotice(error?.message || 'Unable to reach RomChat moderation API'); }
  }
  async function decide(id: string, status: string) {
    const res = await fetch(`${apiBase}/api/romchat/admin/moderation/cases/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, adminNote: status === 'dismissed' ? 'Dismissed after evidence review.' : 'Abuse confirmed by admin.' }) });
    if (!res.ok) throw new Error('Decision failed');
    await loadCases();
  }
  async function reinstate(memberId: string, reportId: string) {
    const res = await fetch(`${apiBase}/api/romchat/admin/moderation/reinstate/${memberId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reportId, adminNote: 'Appeal approved after review.' }) });
    if (!res.ok) throw new Error('Reinstate failed');
    await loadCases();
  }
  useEffect(() => { void loadCases(); }, []);
  return <Panel title="Reports and enforcement"><div className="mb-4 flex items-center justify-between rounded-3xl bg-[#1a1c1e] p-4 text-white"><div><p className="text-sm font-black text-[#ffb3c8]">RomChat community safety</p><p className="text-2xl font-black">Abuse reports, blocks, appeals</p></div><button onClick={() => void loadCases()} className="rounded-full bg-white px-4 py-2 font-black text-[#1a1c1e]">Refresh</button></div>{notice ? <div className="mb-3 rounded-2xl bg-[#fff0f5] p-3 font-bold text-[#93000a]">{notice}</div> : null}<div className="grid gap-3">{cases.map((item) => { const evidence = item.evidence || {}; const moderation = item.moderation || {}; const reportedId = item.reportedMemberId || item.reported_member_id || item.memberId || 'unknown'; return <div key={item.id} className="rounded-3xl border border-[#e2e2e5] bg-[#f9f9fc] p-4"><p className="text-lg font-black">{item.type || 'Chat abuse report'} <span className="rounded-full bg-[#ffdad6] px-2 py-1 text-xs text-[#93000a]">{item.severity || moderation.severity || 'review'}</span></p><p className="text-sm font-bold text-[#574142]">Report {item.id} - {item.status || 'open'} - member {reportedId} - {item.autoBlocked || item.auto_blocked ? 'auto-blocked' : 'manual review'}</p><div className="mt-3 rounded-2xl bg-white p-3 text-sm leading-6"><p className="font-black">Recorded message evidence</p><p>{evidence.redactedText || evidence.text || evidence.messageText || 'No message text captured.'}</p><p className="mt-2 text-[#574142]">Flags: {(moderation.categories || []).join(', ') || 'none'}</p></div><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => void decide(item.id, 'confirmed_block')} className="rounded-full bg-[#ffdad6] px-4 py-2 font-black text-[#93000a]">Confirm block</button><button onClick={() => void decide(item.id, 'dismissed')} className="rounded-full border border-[#ddbfc0] px-4 py-2 font-black">Dismiss</button><button onClick={() => void reinstate(reportedId, item.id)} className="rounded-full bg-[#1a1c1e] px-4 py-2 font-black text-white">Reinstate</button></div></div>; })}{cases.length === 0 ? <div className="rounded-3xl bg-[#f3f3f6] p-5 font-black">No active abuse reports.</div> : null}</div><h3 className="mt-6 text-xl font-black">Appeals</h3><div className="mt-3 grid gap-3">{appeals.map((appeal) => <div key={appeal.id} className="rounded-3xl bg-[#fff8e1] p-4"><p className="font-black">Appeal from {appeal.memberId || appeal.member_id}</p><p className="text-sm leading-6 text-[#574142]">{appeal.appealText || appeal.appeal_text || 'No appeal text supplied.'}</p></div>)}</div></Panel>;
}
function Conversations() {
  return <Panel title="Conversation health"><div className="grid gap-3">{conversations.map((item) => <div key={item.match} className="rounded-3xl bg-[#f3f3f6] p-4"><div className="flex items-center justify-between gap-3"><p className="font-black">{item.match}</p><span className="rounded-full bg-white px-3 py-1 text-sm font-black">{item.score}%</span></div><p className="mt-2 text-sm text-[#574142]">{item.last}</p></div>)}</div></Panel>;
}

function Events() {
  return <Panel title="Events operations"><div className="grid gap-3 md:grid-cols-2"><Event title="Golden Hour Social" value="$12,430 gross" /><Event title="Mindful Dating Workshop" value="9 seats left" /><Event title="Architecture Walk" value="Waitlist open" /><Event title="Rooftop Music Mixer" value="18 check-ins" /></div></Panel>;
}

function Event({ title, value }: { title: string; value: string }) {
  return <div className="rounded-3xl bg-[#f3f3f6] p-5"><CalendarDays className="text-[#a63646]" /><h4 className="mt-3 text-xl font-black">{title}</h4><p className="mt-2 font-bold text-[#574142]">{value}</p></div>;
}

function Revenue() {
  return <Panel title="Wallet and premium revenue"><div className="grid gap-3 md:grid-cols-3"><Stat icon={<CreditCard />} title="Wallet volume" value="$46.8k" /><Stat icon={<Sparkles />} title="Boosts" value="$18.7k" /><Stat icon={<CalendarDays />} title="Tickets" value="$26.9k" /></div></Panel>;
}

function Safety() {
  return <Panel title="Safety rules"><div className="grid gap-3">{['Auto-hide risky phone requests until mutual trust is high', 'Escalate impersonation reports to senior review', 'Require liveness renewal every 120 days', 'Lock video calls behind consent and screenshot warnings'].map((item) => <div key={item} className="flex items-center gap-3 rounded-3xl bg-[#f3f3f6] p-4 font-bold"><ShieldCheck className="text-[#26c6c4]" />{item}</div>)}<div className="rounded-3xl bg-[#ffdad6] p-4 font-bold text-[#93000a]"><AlertTriangle className="mb-2" />Critical automation rules must be reviewed weekly.</div></div></Panel>;
}

