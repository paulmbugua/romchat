import React, { useEffect, useState } from 'react';
import { Banknote, CircleDollarSign, ClipboardList, Landmark, PiggyBank, RefreshCw, Users } from 'lucide-react';

type Summary = {
  totals: { members: number; savings: number; loans: number; dividends: number };
  members: any[];
  loans: any[];
  transactions: any[];
  tickets: any[];
};

const apiBase = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:4000';
const fmt = (value: number) => `KES ${Number(value || 0).toLocaleString('en-KE')}`;

export default function App() {
  const [summary, setSummary] = useState<Summary>({
    totals: { members: 0, savings: 0, loans: 0, dividends: 0 },
    members: [],
    loans: [],
    transactions: [],
    tickets: [],
  });
  const [status, setStatus] = useState('Loading SACCO operations...');

  async function load() {
    setStatus('Refreshing...');
    try {
      const res = await fetch(`${apiBase}/api/sacco/summary`);
      const data = await res.json();
      setSummary(data);
      setStatus('Live data from Postgres');
    } catch {
      setStatus('Backend offline. Start apps/backend on port 4000.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      <aside className="fixed hidden h-screen w-72 bg-[#0d1c32] p-6 text-[#d6e3ff] lg:block">
        <div className="flex items-center gap-3 text-white">
          <Landmark className="text-[#fd761a]" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ffb690]">Admin Console</p>
            <h1 className="text-xl font-black">Grogon SACCO</h1>
          </div>
        </div>
        <nav className="mt-10 grid gap-2">
          {['Operations', 'Members', 'Loans', 'Transactions', 'Dividends', 'Support'].map((item, index) => (
            <a
              className={`rounded-lg px-4 py-3 font-bold ${index === 0 ? 'bg-[#fd761a] text-[#341100]' : 'hover:bg-white/10'}`}
              key={item}
            >
              {item}
            </a>
          ))}
        </nav>
      </aside>
      <section className="lg:ml-72">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#c5c6cd] bg-white/95 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-sm font-bold text-[#9d4300]">{status}</p>
            <h2 className="text-2xl font-black">Credit, savings and KYC desk</h2>
          </div>
          <button onClick={load} className="flex items-center gap-2 rounded-lg bg-[#0d1c32] px-4 py-2 font-bold text-white">
            <RefreshCw size={18} />
            Refresh
          </button>
        </header>
        <div className="grid gap-5 p-5 md:grid-cols-4">
          <Stat icon={<Users />} title="Members" value={summary.totals.members.toLocaleString()} />
          <Stat icon={<PiggyBank />} title="Savings" value={fmt(summary.totals.savings)} />
          <Stat icon={<Banknote />} title="Loan Book" value={fmt(summary.totals.loans)} />
          <Stat icon={<CircleDollarSign />} title="Dividends" value={fmt(summary.totals.dividends)} />
        </div>
        <div className="grid gap-5 p-5 xl:grid-cols-2">
          <Table title="Member KYC Queue" rows={summary.members.map((m) => [m.memberNo, m.fullName, m.shopLocation, m.kycStatus])} />
          <Table title="Loan Committee" rows={summary.loans.map((l) => [l.memberNo, l.loanType, fmt(l.amount), l.status])} />
          <Table title="Recent Transactions" rows={summary.transactions.map((t) => [t.reference, t.kind, fmt(t.amount), t.status])} />
          <Table
            title="Support Tickets"
            rows={(summary.tickets.length ? summary.tickets : [{ memberName: 'No open tickets', subject: 'Support queue clear', status: 'closed' }]).map((t) => [
              t.memberName || '-',
              t.subject,
              '',
              t.status,
            ])}
          />
        </div>
      </section>
    </main>
  );
}

function Stat({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#c5c6cd] bg-white p-5 shadow-sm">
      <div className="mb-4 text-[#9d4300]">{icon}</div>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#44474d]">{title}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function Table({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <div className="rounded-xl border border-[#c5c6cd] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <ClipboardList className="text-[#9d4300]" />
        <h3 className="text-xl font-black">{title}</h3>
      </div>
      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={index} className="grid grid-cols-4 gap-2 rounded-lg bg-[#eff4ff] p-3 text-sm">
            {row.map((cell, cellIndex) => (
              <span key={cellIndex} className="truncate font-semibold">
                {cell}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
