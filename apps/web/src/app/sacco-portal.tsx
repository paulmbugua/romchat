'use client';

import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CircleDollarSign,
  ClipboardList,
  Download,
  FileText,
  Headphones,
  Landmark,
  LockKeyhole,
  LogOut,
  Menu,
  PiggyBank,
  ReceiptText,
  ShieldCheck,
  Trash2,
  TrendingUp,
  WalletCards,
  Wrench,
  X,
} from 'lucide-react';

type Member = {
  id: string;
  memberNo: string;
  fullName: string;
  phone: string;
  email?: string;
  shopLocation: string;
  membershipTier: string;
  savingsBalance: number;
  loanBalance: number;
  dividendBalance: number;
  kycStatus: string;
  onboardingStage?: string;
  mustSetPassword?: boolean;
};

type Dashboard = {
  member: Member;
  savings: { balance: number; monthlyTarget: number; deposits: Transaction[] };
  loans: Loan[];
  dividends: { balance: number; lastDeclared: string; payoutStatus: string };
  transactions: Transaction[];
  support: Ticket[];
};

type Transaction = {
  id: string;
  kind: string;
  channel?: string;
  amount: number;
  reference: string;
  status: string;
  createdAt?: string;
};

type Loan = {
  id: string;
  loanType: string;
  amount: number;
  termMonths: number;
  purpose: string;
  status: string;
  monthlyRepayment: number;
  createdAt?: string;
};

type Ticket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  resolution?: string;
  createdAt?: string;
};

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const fmt = (value: number) => `KES ${Number(value || 0).toLocaleString('en-KE')}`;
const tabs = ['Overview', 'Savings', 'Loans', 'Dividends', 'Support', 'Statement', 'Account'];
const supportPhone = '0114330356';

export default function GrogonSaccoPortal() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [active, setActive] = useState('Overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState(false);
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState({ next: '', confirm: '' });
  const [loan, setLoan] = useState({
    loanType: 'Working Capital',
    amount: '250000',
    termMonths: '12',
    purpose: 'Spare parts stock and garage cash flow',
  });
  const [ticket, setTicket] = useState({ subject: 'Account support', message: 'Please assist me with my SACCO account.' });
  const [deleteAccount, setDeleteAccount] = useState({ password: '', confirmation: '', reason: '' });

  const token = typeof window === 'undefined' ? '' : localStorage.getItem('grogon-member-token') || '';
  const member = dashboard?.member;
  const mustSetPassword = Boolean(setupMode || member?.mustSetPassword);

  async function loadDashboard() {
    const saved = localStorage.getItem('grogon-member-dashboard');
    if (saved) {
      try {
        setDashboard(JSON.parse(saved));
      } catch {}
    }
    try {
      const res = await fetch(`${apiBase}/api/member/dashboard`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${localStorage.getItem('grogon-member-token') || ''}` },
      });
      if (res.status === 401) {
        logout();
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setDashboard(data);
        localStorage.setItem('grogon-member-dashboard', JSON.stringify(data));
      } else {
        setMessage(data.message || 'Could not load your dashboard.');
      }
    } catch {
      setMessage('Could not reach the SACCO server. Showing the last saved dashboard if available.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSetupMode(new URLSearchParams(window.location.search).has('setup'));
    loadDashboard();
  }, []);

  const nextPayment = useMemo(() => {
    const activeLoan = dashboard?.loans.find((item) => ['approved', 'disbursed'].includes(item.status));
    return activeLoan?.monthlyRepayment || 0;
  }, [dashboard?.loans]);

  function logout() {
    localStorage.removeItem('grogon-member-token');
    localStorage.removeItem('grogon-member-dashboard');
    localStorage.removeItem('grogon-sacco-session');
    router.replace('/login');
  }

  async function setFirstPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    if (password.next.length < 8) {
      setMessage('Use at least 8 characters for your password.');
      return;
    }
    if (password.next !== password.confirm) {
      setMessage('The two passwords do not match.');
      return;
    }
    const res = await fetch(`${apiBase}/api/member/auth/set-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ password: password.next }),
    });
    const data = await res.json().catch(() => ({}));
    setMessage(data.message || (res.ok ? 'Password created.' : 'Password update failed.'));
    if (res.ok) {
      setDashboard(data.dashboard);
      setSetupMode(false);
      setPassword({ next: '', confirm: '' });
      localStorage.setItem('grogon-member-dashboard', JSON.stringify(data.dashboard));
      router.replace('/portal');
    }
  }

  async function submit(path: string, body: unknown, successTab?: string) {
    if (!member) return;
    setMessage('Submitting...');
    const res = await fetch(`${apiBase}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setMessage(res.ok ? data.message || 'Posted successfully.' : data.message || 'Request failed.');
    if (res.ok) {
      if (successTab) setActive(successTab);
      await loadDashboard();
    }
  }

  async function downloadStatement(type: 'full' | 'savings' | 'loans' | 'dividends' | 'transactions', print = false) {
    setMessage(print ? 'Preparing printable statement...' : 'Preparing PDF statement...');
    try {
      const res = await fetch(`${apiBase}/api/member/statements/${type}.pdf`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('grogon-member-token') || ''}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Could not prepare statement.');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (print) {
        const win = window.open(url, '_blank');
        setTimeout(() => win?.print(), 700);
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = `grogon-${type}-statement.pdf`;
        link.click();
      }
      setMessage(print ? 'Printable statement opened.' : 'Statement downloaded.');
    } catch (error: any) {
      setMessage(error.message || 'Statement download failed.');
    }
  }

  async function deleteDigitalAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (deleteAccount.confirmation.trim().toUpperCase() !== 'DELETE MY ACCOUNT') {
      setMessage('Type DELETE MY ACCOUNT to confirm.');
      return;
    }
    setMessage('Deleting your digital account access...');
    try {
      const res = await fetch(`${apiBase}/api/member/account`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('grogon-member-token') || ''}` },
        body: JSON.stringify(deleteAccount),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Account deletion failed.');
      localStorage.removeItem('grogon-member-token');
      localStorage.removeItem('grogon-member-dashboard');
      localStorage.removeItem('grogon-sacco-session');
      setMessage(data.message || 'Your digital account has been deleted.');
      router.replace('/login?deleted=1');
    } catch (error: any) {
      setMessage(error.message || 'Account deletion failed.');
    }
  }

  if (loading && !dashboard) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0d1c32] px-6 text-white">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
          <p className="font-mont text-2xl font-black">Loading your SACCO account...</p>
          <p className="mt-2 text-[#d6e3ff]">Savings, loans, dividends and support are being prepared.</p>
        </div>
      </main>
    );
  }

  if (!dashboard || !member) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f8f9ff] px-6 text-[#0b1c30]">
        <div className="max-w-md rounded-xl border border-[#c5c6cd] bg-white p-6 text-center shadow-sm">
          <h1 className="font-mont text-2xl font-black">Member dashboard unavailable</h1>
          <p className="mt-2 text-[#44474d]">{message || 'Please login again to refresh your session.'}</p>
          <button onClick={logout} className="mt-5 rounded-lg bg-[#0d1c32] px-5 py-3 font-bold text-white">
            Return to login
          </button>
        </div>
      </main>
    );
  }

  if (mustSetPassword) {
    return (
      <main className="grid min-h-screen bg-[#f8f9ff] text-[#0b1c30] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="bg-[#0d1c32] px-6 py-10 text-white lg:px-14">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-[#fd761a] text-[#351000]">
              <Wrench />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ffb690]">First login</p>
              <h1 className="font-mont text-2xl font-black">Secure your SACCO account</h1>
            </div>
          </div>
          <div className="mt-14 max-w-xl">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#ffb690]">{member.memberNo}</p>
            <h2 className="font-mont mt-3 text-4xl font-black leading-tight">
              Welcome {member.fullName}. Create the password you will use going forward.
            </h2>
            <p className="mt-5 leading-8 text-[#d6e3ff]">
              Your member number and phone verified this first entry. From the next login, you will
              use member number, phone number and this private password.
            </p>
          </div>
        </section>
        <section className="grid place-items-center px-4 py-10">
          <form onSubmit={setFirstPassword} className="w-full max-w-lg rounded-2xl border border-[#c5c6cd] bg-white p-6 shadow-xl">
            <div className="mb-6 grid gap-3 rounded-xl bg-[#eff4ff] p-4 text-sm font-bold text-[#44474d]">
              <span>{member.fullName}</span>
              <span>{member.shopLocation} workshop</span>
              <span>KYC: {member.kycStatus}</span>
            </div>
            <label className="block text-sm font-black text-[#44474d]">
              New password
              <input
                type="password"
                className="mt-2 w-full rounded-lg border border-[#c5c6cd] bg-[#f8f9ff] p-3 outline-none"
                value={password.next}
                onChange={(event) => setPassword({ ...password, next: event.target.value })}
              />
            </label>
            <label className="mt-4 block text-sm font-black text-[#44474d]">
              Confirm password
              <input
                type="password"
                className="mt-2 w-full rounded-lg border border-[#c5c6cd] bg-[#f8f9ff] p-3 outline-none"
                value={password.confirm}
                onChange={(event) => setPassword({ ...password, confirm: event.target.value })}
              />
            </label>
            {message && <p className="mt-4 rounded-lg bg-[#fff2e6] p-3 text-sm font-bold text-[#8f4b00]">{message}</p>}
            <button className="mt-6 w-full rounded-lg bg-[#fd761a] px-5 py-3 font-black text-[#351000]">
              Create Password and Open Dashboard
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      <header className="sticky top-0 z-40 border-b border-[#c5c6cd] bg-white/95 px-4 py-3 backdrop-blur md:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#0d1c32] text-[#fd761a]">
              <Wrench size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9d4300]">{member.memberNo}</p>
              <h1 className="font-mont text-lg font-bold md:text-xl">Grogon Member Dashboard</h1>
            </div>
          </div>
          <nav className="hidden items-center gap-2 rounded-lg border border-[#c5c6cd] bg-[#f8f9ff] p-1 md:flex">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActive(tab)}
                className={`rounded-md px-3 py-2 text-sm font-bold ${active === tab ? 'bg-[#0d1c32] text-white' : 'text-[#44474d]'}`}
              >
                {tab}
              </button>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Bell size={19} />
            <button onClick={logout} className="inline-flex items-center gap-2 rounded-lg border border-[#75777e] px-3 py-2 text-sm font-bold">
              <LogOut size={17} />
              Logout
            </button>
          </div>
          <button className="md:hidden" onClick={() => setMenuOpen(true)} aria-label="Open dashboard menu">
            <Menu />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-[#0d1c32] p-6 text-white md:hidden">
          <button className="ml-auto block" onClick={() => setMenuOpen(false)} aria-label="Close dashboard menu">
            <X />
          </button>
          <div className="mt-10 grid gap-3">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActive(tab);
                  setMenuOpen(false);
                }}
                className="rounded-lg bg-white/10 px-4 py-3 text-left font-bold"
              >
                {tab}
              </button>
            ))}
            <button onClick={logout} className="rounded-lg bg-[#fd761a] px-4 py-3 text-left font-bold text-[#351000]">
              Logout
            </button>
          </div>
        </div>
      )}

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:grid-cols-[260px_1fr] md:px-10">
        <aside className="hidden self-start rounded-xl bg-[#0d1c32] p-5 text-[#d6e3ff] md:block">
          <p className="font-mont text-xl font-bold text-white">{member.fullName}</p>
          <p className="mt-1 text-sm">{member.shopLocation}</p>
          <div className="mt-5 grid gap-2">
            <Badge label={member.membershipTier} />
            <Badge label={`KYC ${member.kycStatus}`} />
          </div>
          <div className="mt-6 grid gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActive(tab)}
                className={`rounded-lg px-4 py-3 text-left text-sm font-bold ${active === tab ? 'bg-[#fd761a] text-[#351000]' : 'hover:bg-white/10'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-4">
            <Metric title="Savings" value={fmt(member.savingsBalance)} icon={<PiggyBank />} />
            <Metric title="Loan Balance" value={fmt(member.loanBalance)} icon={<WalletCards />} />
            <Metric title="Dividends" value={fmt(member.dividendBalance)} icon={<CircleDollarSign />} />
            <Metric title="Next Repayment" value={nextPayment ? fmt(nextPayment) : 'None due'} icon={<ReceiptText />} />
          </section>

          {message && <p className="rounded-lg border border-[#c5c6cd] bg-white p-4 text-sm font-bold text-[#44474d]">{message}</p>}

          {active === 'Overview' && (
            <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-xl border border-[#c5c6cd] bg-white p-6 shadow-sm">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#9d4300]">Account overview</p>
                <h2 className="font-mont mt-3 text-3xl font-black md:text-5xl">
                  Practical money tools for your garage and parts business.
                </h2>
                <p className="mt-4 leading-7 text-[#44474d]">
                  Track your savings discipline, credit position, dividends and support requests
                  without seeing any other member account.
                </p>
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <Quick label="Monthly target" value={fmt(dashboard.savings.monthlyTarget)} />
                  <Quick label="Loan requests" value={String(dashboard.loans.length)} />
                  <Quick label="Open tickets" value={String(dashboard.support.filter((item) => item.status !== 'resolved').length)} />
                </div>
              </div>
              <div className="rounded-xl border border-[#c5c6cd] bg-[#e5eeff] p-6">
                <SectionTitle icon={<ShieldCheck />} title="Member profile" />
                <Info label="Member number" value={member.memberNo} />
                <Info label="Phone" value={member.phone} />
                <Info label="Email" value={member.email || 'Not recorded'} />
                <Info label="Onboarding" value={member.onboardingStage || 'Active'} />
              </div>
            </section>
          )}

          {active === 'Savings' && (
            <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-xl border border-[#c5c6cd] bg-white p-6 shadow-sm">
                <SectionTitle icon={<PiggyBank />} title="M-Pesa PayBill savings" />
                <p className="text-sm leading-7 text-[#44474d]">
                  Do not post deposits manually. Pay through M-Pesa and the SACCO system updates your savings automatically when the PayBill callback is received.
                </p>
                <div className="mt-5 grid gap-3 rounded-xl bg-[#eff4ff] p-4">
                  <Info label="PayBill" value="522522" />
                  <Info label="Account number" value={`GROGON-${member.memberNo}`} />
                  <Info label="Posting" value="Automatic savings deposit after M-Pesa confirmation" />
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button onClick={() => downloadStatement('savings')} className="inline-flex items-center gap-2 rounded-lg bg-[#fd761a] px-4 py-3 font-black text-[#351000]"><Download size={18} /> Savings PDF</button>
                  <button onClick={() => downloadStatement('savings', true)} className="inline-flex items-center gap-2 rounded-lg border border-[#75777e] px-4 py-3 font-black"><FileText size={18} /> Print</button>
                </div>
              </div>
              <Panel title="Auto-posted savings" rows={dashboard.savings.deposits.map((item) => [item.reference, fmt(item.amount), item.channel || 'M-Pesa PayBill', item.status])} />
            </section>
          )}

          {active === 'Loans' && (
            <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <form
                className="rounded-xl border border-[#c5c6cd] bg-white p-6 shadow-sm"
                onSubmit={(event) => {
                  event.preventDefault();
                  submit('/api/loans/apply', { ...loan, memberId: member.id, amount: Number(loan.amount), termMonths: Number(loan.termMonths) }, 'Loans');
                }}
              >
                <SectionTitle icon={<ClipboardList />} title="Apply for credit" />
                <Input label="Loan type" value={loan.loanType} onChange={(value) => setLoan({ ...loan, loanType: value })} />
                <Input label="Amount" value={loan.amount} onChange={(value) => setLoan({ ...loan, amount: value })} />
                <Input label="Term months" value={loan.termMonths} onChange={(value) => setLoan({ ...loan, termMonths: value })} />
                <Input label="Purpose" value={loan.purpose} onChange={(value) => setLoan({ ...loan, purpose: value })} />
                <button className="mt-4 rounded-lg bg-[#0d1c32] px-5 py-3 font-bold text-white">Send to Credit Committee</button>
              </form>
              <div className="space-y-4">
                <div className="rounded-xl border border-[#c5c6cd] bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => downloadStatement('loans')} className="inline-flex items-center gap-2 rounded-lg bg-[#fd761a] px-4 py-3 font-black text-[#351000]"><Download size={18} /> Loan PDF</button>
                    <button onClick={() => downloadStatement('loans', true)} className="inline-flex items-center gap-2 rounded-lg border border-[#75777e] px-4 py-3 font-black"><FileText size={18} /> Print loans</button>
                  </div>
                </div>
                <Panel title="Loan activity" rows={dashboard.loans.map((item) => [item.loanType, fmt(item.amount), item.status, fmt(item.monthlyRepayment)])} />
              </div>
            </section>
          )}

          {active === 'Dividends' && (
            <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-xl border border-[#c5c6cd] bg-white p-6 shadow-sm">
                <SectionTitle icon={<TrendingUp />} title="Dividend position" />
                <p className="font-mont text-5xl font-black">{fmt(dashboard.dividends.balance)}</p>
                <p className="mt-3 text-[#44474d]">{dashboard.dividends.payoutStatus}</p>
                <div className="mt-5 rounded-lg bg-[#eff4ff] p-4 font-bold text-[#44474d]">
                  Last declared pool: {dashboard.dividends.lastDeclared}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button onClick={() => downloadStatement('dividends')} className="inline-flex items-center gap-2 rounded-lg bg-[#fd761a] px-4 py-3 font-black text-[#351000]"><Download size={18} /> Dividend PDF</button>
                  <button onClick={() => downloadStatement('dividends', true)} className="inline-flex items-center gap-2 rounded-lg border border-[#75777e] px-4 py-3 font-black"><FileText size={18} /> Print</button>
                </div>
              </div>
              <div className="rounded-xl border border-[#c5c6cd] bg-[#0d1c32] p-6 text-white">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#ffb690]">What this means</p>
                <p className="mt-4 leading-8 text-[#d6e3ff]">
                  Dividends reflect your participation in the SACCO pool. Admins can process payout
                  instructions after board declaration and member verification.
                </p>
              </div>
            </section>
          )}

          {active === 'Support' && (
            <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <form
                className="rounded-xl border border-[#c5c6cd] bg-white p-6 shadow-sm"
                onSubmit={(event) => {
                  event.preventDefault();
                  submit('/api/support/tickets', { memberId: member.id, subject: ticket.subject, message: ticket.message }, 'Support');
                }}
              >
                <SectionTitle icon={<Headphones />} title="Open support ticket" />
                <Input label="Subject" value={ticket.subject} onChange={(value) => setTicket({ ...ticket, subject: value })} />
                <label className="mt-3 block text-sm font-bold text-[#44474d]">
                  Message
                  <textarea
                    className="mt-1 min-h-28 w-full rounded-lg border border-[#c5c6cd] bg-white p-3 text-[#0b1c30]"
                    value={ticket.message}
                    onChange={(event) => setTicket({ ...ticket, message: event.target.value })}
                    required
                  />
                </label>
                <button className="mt-4 rounded-lg bg-[#fd761a] px-5 py-3 font-bold text-[#351000]">Send to SACCO Desk</button>
              </form>
              <Panel title="Support history" rows={dashboard.support.map((item) => [item.subject, item.status, item.resolution || 'In review', dateLabel(item.createdAt)])} />
            </section>
          )}

          {active === 'Statement' && (
            <section className="space-y-4">
              <div className="rounded-xl border border-[#c5c6cd] bg-white p-4 shadow-sm">
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => downloadStatement('full')} className="inline-flex items-center gap-2 rounded-lg bg-[#fd761a] px-4 py-3 font-black text-[#351000]"><Download size={18} /> Full PDF</button>
                  <button onClick={() => downloadStatement('transactions')} className="inline-flex items-center gap-2 rounded-lg border border-[#75777e] px-4 py-3 font-black"><Download size={18} /> Transactions PDF</button>
                  <button onClick={() => downloadStatement('full', true)} className="inline-flex items-center gap-2 rounded-lg bg-[#0d1c32] px-4 py-3 font-black text-white"><FileText size={18} /> Print statement</button>
                </div>
              </div>
              <Panel title="Account statement" rows={dashboard.transactions.map((item) => [item.kind.replace(/_/g, ' '), fmt(item.amount), item.reference, item.status])} />
            </section>
          )}

          {active === 'Account' && (
            <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-xl border border-[#c5c6cd] bg-white p-6 shadow-sm">
                <SectionTitle icon={<Trash2 />} title="Delete digital account" />
                <p className="leading-7 text-[#44474d]">
                  You can delete your web and mobile app access directly. This revokes login sessions and removes your portal password.
                  SACCO membership, savings, loan, dividend, KYC and audit records are retained where required by law and SACCO operations.
                </p>
                <div className="mt-5 rounded-lg bg-[#fff2e6] p-4 text-sm font-bold text-[#8f4b00]">
                  For full membership closure, unresolved loans, guarantor issues or payment disputes, call {supportPhone}.
                </div>
              </div>
              <form onSubmit={deleteDigitalAccount} className="rounded-xl border border-[#c5c6cd] bg-white p-6 shadow-sm">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#9d4300]">Final confirmation</p>
                <Input label="Current password" type="password" value={deleteAccount.password} onChange={(value) => setDeleteAccount({ ...deleteAccount, password: value })} />
                <Input label="Reason optional" value={deleteAccount.reason} onChange={(value) => setDeleteAccount({ ...deleteAccount, reason: value })} />
                <Input label="Type DELETE MY ACCOUNT" value={deleteAccount.confirmation} onChange={(value) => setDeleteAccount({ ...deleteAccount, confirmation: value })} />
                <button className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#8f1d1d] px-5 py-3 font-black text-white">
                  <Trash2 size={18} />
                  Delete my digital account
                </button>
              </form>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

function Badge({ label }: { label: string }) {
  return <span className="rounded-lg bg-white/10 px-3 py-2 text-sm font-bold">{label}</span>;
}

function Metric({ title, value, icon }: { title: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-xl border border-[#c5c6cd] bg-white p-5 shadow-sm">
      <div className="mb-3 text-[#9d4300]">{icon}</div>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#44474d]">{title}</p>
      <p className="font-mont mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function Quick({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#eff4ff] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#44474d]">{label}</p>
      <p className="font-mont mt-2 text-xl font-black">{value}</p>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="text-[#9d4300]">{icon}</span>
      <h3 className="font-mont text-2xl font-bold">{title}</h3>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3 rounded-lg bg-white p-3">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#44474d]">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="mt-3 block text-sm font-bold text-[#44474d]">
      {label}
      <input
        type={type}
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
      <div className="mb-4 flex items-center gap-3">
        <Landmark className="text-[#9d4300]" size={20} />
        <h3 className="font-mont text-2xl font-bold">{title}</h3>
      </div>
      <div className="space-y-3">
        {rows.length === 0 && <p className="rounded-lg bg-[#eff4ff] p-4 text-sm font-bold text-[#44474d]">No records yet.</p>}
        {rows.map((row, index) => (
          <div key={index} className="grid gap-2 rounded-lg bg-[#eff4ff] p-3 text-sm md:grid-cols-4">
            {row.map((cell, cellIndex) => (
              <span key={`${cell}-${cellIndex}`} className="break-words font-semibold text-[#44474d]">
                {cell}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function dateLabel(value?: string) {
  if (!value) return 'Recent';
  return new Date(value).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' });
}
