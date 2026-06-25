'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CircleDollarSign,
  ClipboardList,
  Download,
  Gauge,
  HandCoins,
  Menu,
  PiggyBank,
  ShieldCheck,
  Wrench,
  X,
} from 'lucide-react';

type Summary = {
  totals: { members: number; savings: number; loans: number; dividends: number };
  members: Array<{
    id: string;
    memberNo: string;
    fullName: string;
    phone: string;
    shopLocation: string;
    membershipTier: string;
    savingsBalance: number;
    loanBalance: number;
    dividendBalance: number;
    kycStatus: string;
  }>;
  loans: Array<{
    id: string;
    memberName: string;
    memberNo: string;
    loanType: string;
    amount: number;
    status: string;
    monthlyRepayment: number;
    purpose: string;
  }>;
  transactions: Array<{
    id: string;
    memberName: string;
    memberNo: string;
    kind: string;
    amount: number;
    reference: string;
    status: string;
  }>;
  tickets: Array<{ id: string; memberName: string; subject: string; status: string }>;
};

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const fmt = (value: number) => `KES ${Number(value || 0).toLocaleString('en-KE')}`;
const nav = ['Dashboard', 'Savings', 'Loans', 'KYC', 'Dividends', 'Support'];
const sample: Summary = {
  totals: { members: 4, savings: 9210750, loans: 3634000, dividends: 614000 },
  members: [
    {
      id: 'seed',
      memberNo: 'GS-0001',
      fullName: 'James K. Mwangi',
      phone: '+254711204480',
      shopLocation: 'Kirinyaga Road',
      membershipTier: 'Premium',
      savingsBalance: 4829450,
      loanBalance: 1864000,
      dividendBalance: 250000,
      kycStatus: 'approved',
    },
  ],
  loans: [
    {
      id: 'loan',
      memberName: 'James K. Mwangi',
      memberNo: 'GS-0001',
      loanType: 'Equipment Financing',
      amount: 1200000,
      status: 'approved',
      monthlyRepayment: 58800,
      purpose: 'Two-post lift and diagnostics scanner',
    },
  ],
  transactions: [
    {
      id: 'txn',
      memberName: 'James K. Mwangi',
      memberNo: 'GS-0001',
      kind: 'savings_deposit',
      amount: 45000,
      reference: 'MPESA-GS001',
      status: 'posted',
    },
  ],
  tickets: [],
};

export default function GrogonSaccoPortal() {
  const [summary, setSummary] = useState<Summary>(sample);
  const [menuOpen, setMenuOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [memberId, setMemberId] = useState('');
  const [loan, setLoan] = useState({
    loanType: 'Equipment Financing',
    amount: '350000',
    termMonths: '12',
    purpose: 'Garage equipment and spare-parts float',
  });
  const [member, setMember] = useState({
    fullName: '',
    email: '',
    phone: '',
    shopLocation: 'Kirinyaga Road',
    membershipTier: 'Jua Kali',
  });

  async function load() {
    try {
      const res = await fetch(`${apiBase}/api/sacco/summary`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
        setMemberId(data.members?.[0]?.id || '');
      }
    } catch {}
  }

  useEffect(() => {
    load();
  }, []);

  const activeMember = useMemo(
    () => summary.members.find((item) => item.id === memberId) || summary.members[0],
    [memberId, summary.members],
  );

  async function submit(path: string, body: unknown) {
    setMessage('Submitting...');
    const res = await fetch(`${apiBase}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setMessage(res.ok ? data.message || 'Posted successfully' : data.message || 'Request failed');
    await load();
  }

  return (
    <main className="hex-pattern min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      <header className="sticky top-0 z-40 border-b border-[#c5c6cd] bg-white/95 px-4 py-3 backdrop-blur md:px-16">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#0d1c32] text-[#fd761a]">
              <Wrench size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9d4300]">
                Kirinyaga Road
              </p>
              <h1 className="font-mont text-xl font-bold">Grogon SACCO</h1>
            </div>
          </div>
          <nav className="hidden items-center gap-7 text-sm font-semibold md:flex">
            {nav.map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-[#9d4300]">
                {item}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Bell size={20} />
            <a href="#register" className="rounded-lg bg-[#fd761a] px-4 py-2 text-sm font-bold text-[#341100]">
              Join SACCO
            </a>
          </div>
          <button className="md:hidden" onClick={() => setMenuOpen(true)}>
            <Menu />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-[#0d1c32] p-6 text-white md:hidden">
          <button className="ml-auto block" onClick={() => setMenuOpen(false)}>
            <X />
          </button>
          <div className="mt-10 grid gap-5">
            {nav.map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMenuOpen(false)}>
                {item}
              </a>
            ))}
          </div>
        </div>
      )}

      <section id="dashboard" className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[260px_1fr] md:px-16">
        <aside className="hidden rounded-xl bg-[#0d1c32] p-5 text-[#d6e3ff] md:block">
          <p className="mb-6 font-mont text-xl font-bold text-white">Member Portal</p>
          {nav.map((item, index) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className={`mb-2 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold ${
                index === 0 ? 'bg-[#fd761a] text-[#341100]' : 'hover:bg-white/10'
              }`}
            >
              <Gauge size={18} />
              {item}
            </a>
          ))}
        </aside>

        <div className="space-y-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-xl border border-[#c5c6cd] bg-white p-6 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#9d4300]">
                Built for mechanics and auto shops
              </p>
              <h2 className="font-mont mt-4 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
                Member services for the Grogon auto trade.
              </h2>
              <p className="mt-5 max-w-2xl text-lg text-[#44474d]">
                Register members, collect deposits, process equipment finance, track repayments and
                support SACCO members operating around Grogon, Kirinyaga Road and Kamukunji.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#loans" className="rounded-lg bg-[#0d1c32] px-5 py-3 font-bold text-white">
                  Apply for Loan
                </a>
                <a href="#statement" className="rounded-lg border border-[#75777e] px-5 py-3 font-bold">
                  View Statement
                </a>
              </div>
            </div>
            <div className="rounded-xl border border-[#c5c6cd] bg-[#e5eeff] p-6">
              <p className="font-bold text-[#44474d]">Active member</p>
              <h3 className="font-mont mt-2 text-2xl font-bold">{activeMember?.fullName || 'Grogon Member'}</h3>
              <p className="text-sm text-[#44474d]">
                {activeMember?.memberNo} - {activeMember?.shopLocation}
              </p>
              <div className="mt-6 grid gap-3">
                <Metric label="Savings" value={fmt(activeMember?.savingsBalance || 0)} icon={<PiggyBank />} />
                <Metric label="Loan Balance" value={fmt(activeMember?.loanBalance || 0)} icon={<HandCoins />} />
                <Metric label="Dividends" value={fmt(activeMember?.dividendBalance || 0)} icon={<CircleDollarSign />} />
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <Stat title="Members" value={summary.totals.members.toLocaleString()} />
            <Stat title="Savings" value={fmt(summary.totals.savings)} />
            <Stat title="Loan book" value={fmt(summary.totals.loans)} />
            <Stat title="Dividends" value={fmt(summary.totals.dividends)} />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-12 md:grid-cols-2 md:px-16">
        <form
          id="register"
          className="rounded-xl border border-[#c5c6cd] bg-white p-6 shadow-sm"
          onSubmit={(event) => {
            event.preventDefault();
            submit('/api/members/register', member);
          }}
        >
          <SectionTitle icon={<ShieldCheck />} title="Member registration and KYC" />
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="Full name" value={member.fullName} onChange={(value) => setMember({ ...member, fullName: value })} />
            <Input label="Email" value={member.email} onChange={(value) => setMember({ ...member, email: value })} />
            <Input label="Phone" value={member.phone} onChange={(value) => setMember({ ...member, phone: value })} />
            <Input
              label="Shop location"
              value={member.shopLocation}
              onChange={(value) => setMember({ ...member, shopLocation: value })}
            />
          </div>
          <button className="mt-4 rounded-lg bg-[#fd761a] px-5 py-3 font-bold text-[#341100]">Submit KYC</button>
        </form>

        <form
          id="loans"
          className="rounded-xl border border-[#c5c6cd] bg-white p-6 shadow-sm"
          onSubmit={(event) => {
            event.preventDefault();
            submit('/api/loans/apply', {
              ...loan,
              amount: Number(loan.amount),
              termMonths: Number(loan.termMonths),
              memberId,
            });
          }}
        >
          <SectionTitle icon={<ClipboardList />} title="Loan application" />
          <select className="mb-3 w-full rounded-lg border border-[#c5c6cd] p-3" value={memberId} onChange={(event) => setMemberId(event.target.value)}>
            {summary.members.map((item) => (
              <option key={item.id} value={item.id}>
                {item.memberNo} - {item.fullName}
              </option>
            ))}
          </select>
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="Loan type" value={loan.loanType} onChange={(value) => setLoan({ ...loan, loanType: value })} />
            <Input label="Amount" value={loan.amount} onChange={(value) => setLoan({ ...loan, amount: value })} />
            <Input label="Term months" value={loan.termMonths} onChange={(value) => setLoan({ ...loan, termMonths: value })} />
            <Input label="Purpose" value={loan.purpose} onChange={(value) => setLoan({ ...loan, purpose: value })} />
          </div>
          <button className="mt-4 rounded-lg bg-[#0d1c32] px-5 py-3 font-bold text-white">
            Send to Credit Committee
          </button>
        </form>
      </section>

      <section id="statement" className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 md:grid-cols-[1fr_0.9fr] md:px-16">
        <Panel title="Loan pipeline" rows={summary.loans.map((item) => [item.memberName, item.loanType, fmt(item.amount), item.status])} />
        <Panel title="Transaction history" rows={summary.transactions.map((item) => [item.memberName, item.kind.replace('_', ' '), fmt(item.amount), item.reference])} />
      </section>

      <section id="support" className="mx-auto max-w-7xl px-4 pb-16 md:px-16">
        <div className="rounded-xl bg-[#0d1c32] p-6 text-white md:flex md:items-center md:justify-between">
          <div>
            <p className="font-bold uppercase tracking-[0.16em] text-[#ffb690]">Live SACCO desk</p>
            <h3 className="font-mont mt-2 text-3xl font-bold">Support for savings, loans and KYC verification.</h3>
            <p className="mt-2 text-[#d6e3ff]">Call +254 711 204 480 or visit the Kirinyaga Road service desk.</p>
          </div>
          <button
            onClick={() =>
              submit('/api/support/tickets', {
                memberId,
                subject: 'Member portal support',
                message: 'Please call me about my SACCO account.',
              })
            }
            className="mt-5 rounded-lg bg-[#fd761a] px-5 py-3 font-bold text-[#341100] md:mt-0"
          >
            Open Ticket
          </button>
        </div>
        {message && <p className="mt-4 rounded-lg border border-[#c5c6cd] bg-white p-4 font-semibold">{message}</p>}
      </section>
    </main>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#c5c6cd] bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#44474d]">{title}</p>
      <p className="font-mont mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-white p-3">
      <span className="text-[#9d4300]">{icon}</span>
      <div>
        <p className="text-xs font-bold uppercase text-[#44474d]">{label}</p>
        <p className="font-bold">{value}</p>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="text-[#9d4300]">{icon}</span>
      <h3 className="font-mont text-2xl font-bold">{title}</h3>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-bold text-[#44474d]">
      {label}
      <input
        className="mt-1 w-full rounded-lg border border-[#c5c6cd] bg-white p-3 text-[#0b1c30]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </label>
  );
}

function Panel({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <div className="rounded-xl border border-[#c5c6cd] bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-mont text-2xl font-bold">{title}</h3>
        <Download size={18} />
      </div>
      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={index} className="grid grid-cols-2 gap-2 rounded-lg bg-[#eff4ff] p-3 text-sm md:grid-cols-4">
            {row.map((cell) => (
              <span key={cell} className="truncate">
                {cell}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

