import React, { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Banknote,
  Download,
  FileText,
  ClipboardCheck,
  ClipboardList,
  KeyRound,
  Landmark,
  LogOut,
  PiggyBank,
  RefreshCw,
  ShieldCheck,
  TicketCheck,
  UserPlus,
  Users,
} from 'lucide-react';

type Admin = { id: string; fullName: string; email: string; role: 'super_admin' | 'admin'; rights: string[]; mustChangePassword?: boolean };
type Ops = {
  totals: { members: number; savings: number; loans: number; dividends: number; pendingKyc: number; openTickets: number; loanQueue: number };
  members: any[];
  loans: any[];
  transactions: any[];
  tickets: any[];
  admins: any[];
  tasks: any[];
  audits: any[];
};

const apiBase = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:4000';
const fmt = (value: number) => `KES ${Number(value || 0).toLocaleString('en-KE')}`;
const emptyOps: Ops = { totals: { members: 0, savings: 0, loans: 0, dividends: 0, pendingKyc: 0, openTickets: 0, loanQueue: 0 }, members: [], loans: [], transactions: [], tickets: [], admins: [], tasks: [], audits: [] };

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('grogon-admin-token') || '');
  const [admin, setAdmin] = useState<Admin | null>(() => {
    const raw = localStorage.getItem('grogon-admin-user');
    return raw ? JSON.parse(raw) : null;
  });
  const [ops, setOps] = useState<Ops>(emptyOps);
  const [status, setStatus] = useState('Ready');
  const [tab, setTab] = useState('Command');
  const [login, setLogin] = useState({ email: 'superadmin@grogonsacco.co.ke', password: 'GrogonSuper2026!' });
  const [memberForm, setMemberForm] = useState({ fullName: '', email: '', phone: '', shopLocation: 'Kirinyaga Road', membershipTier: 'Jua Kali', tradeCategory: 'Mechanic', idNumber: '', kraPin: '', nextOfKin: '' });
  const [txn, setTxn] = useState({ memberId: '', kind: 'savings_deposit', amount: '5000', channel: 'M-Pesa', reference: '' });
  const [newAdmin, setNewAdmin] = useState({ fullName: '', email: '', password: 'GrogonAdmin2026!', role: 'admin' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: 'GrogonAdmin2026!', newPassword: '', confirmPassword: '' });
  const [busyAction, setBusyAction] = useState('');

  const headers = useMemo(() => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }), [token]);
  const can = (right: string) => Boolean(admin?.rights?.includes(right));

  async function request(path: string, options: RequestInit = {}) {
    const res = await fetch(`${apiBase}${path}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  }

  async function signIn(event?: React.FormEvent) {
    event?.preventDefault();
    setStatus('Signing in...');
    try {
      const data = await fetch(`${apiBase}/api/admin/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(login) }).then(async (res) => {
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.message);
        return payload;
      });
      setToken(data.token);
      setAdmin(data.admin);
      localStorage.setItem('grogon-admin-token', data.token);
      localStorage.setItem('grogon-admin-user', JSON.stringify(data.admin));
      setPasswordForm((current) => ({ ...current, currentPassword: login.password }));
      setStatus(data.admin.mustChangePassword ? 'Temporary password accepted. Set your private password to continue.' : `Signed in as ${data.admin.role.replace('_', ' ')}`);
    } catch (error: any) {
      setStatus(error.message || 'Login failed');
    }
  }

  async function load() {
    if (!token || admin?.mustChangePassword) return;
    setStatus('Refreshing operations...');
    try {
      const data = await request('/api/admin/operations');
      setOps(data);
      if (!txn.memberId && data.members[0]) setTxn((current) => ({ ...current, memberId: data.members[0].id }));
      setStatus('Live SACCO operations');
    } catch (error: any) {
      setStatus(error.message || 'Unable to load operations');
      if (String(error.message).toLowerCase().includes('session')) logout();
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  function logout() {
    localStorage.removeItem('grogon-admin-token');
    localStorage.removeItem('grogon-admin-user');
    setToken('');
    setAdmin(null);
    setOps(emptyOps);
  }

  async function submitMember(event: React.FormEvent) {
    event.preventDefault();
    setStatus('Onboarding member...');
    try {
      const data = await request('/api/admin/members/onboard', { method: 'POST', body: JSON.stringify(memberForm) });
      setStatus(data.message);
      setMemberForm({ fullName: '', email: '', phone: '', shopLocation: 'Kirinyaga Road', membershipTier: 'Jua Kali', tradeCategory: 'Mechanic', idNumber: '', kraPin: '', nextOfKin: '' });
      await load();
    } catch (error: any) {
      setStatus(error.message);
    }
  }

  async function postTransaction(event: React.FormEvent) {
    event.preventDefault();
    setStatus('Posting transaction...');
    try {
      const data = await request('/api/admin/transactions', { method: 'POST', body: JSON.stringify({ ...txn, amount: Number(txn.amount) }) });
      setStatus(data.message);
      await load();
    } catch (error: any) {
      setStatus(error.message);
    }
  }

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setStatus('New password and confirmation do not match.');
      return;
    }
    setStatus('Securing admin account...');
    try {
      const data = await request('/api/admin/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }) });
      setAdmin(data.admin);
      localStorage.setItem('grogon-admin-user', JSON.stringify(data.admin));
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setStatus(data.message);
      await load();
    } catch (error: any) {
      setStatus(error.message);
    }
  }

  async function createAdmin(event: React.FormEvent) {
    event.preventDefault();
    setStatus('Creating admin...');
    try {
      const data = await request('/api/admin/admins', { method: 'POST', body: JSON.stringify(newAdmin) });
      setStatus(data.message);
      setNewAdmin({ fullName: '', email: '', password: 'GrogonAdmin2026!', role: 'admin' });
      await load();
    } catch (error: any) {
      setStatus(error.message);
    }
  }

  async function quick(path: string, body: any, label: string, method = 'PATCH') {
    setStatus(label);
    try {
      const data = await request(path, { method, body: JSON.stringify(body) });
      setStatus(data.message);
      await load();
    } catch (error: any) {
      setStatus(error.message);
    }
  }

  async function downloadPdf(path: string, filename: string, print = false) {
    setStatus(print ? 'Preparing printable PDF...' : 'Preparing PDF download...');
    try {
      const res = await fetch(`${apiBase}${path}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'PDF request failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (print) {
        const win = window.open(url, '_blank');
        setTimeout(() => win?.print(), 700);
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
      }
      setStatus(print ? 'Printable PDF opened.' : 'PDF downloaded.');
    } catch (error: any) {
      setStatus(error.message || 'Could not prepare PDF.');
    }
  }

  async function approveKyc(member: any) {
    if (!member?.id || busyAction) return;
    setBusyAction(member.id);
    setStatus(`Approving KYC for ${member.memberNo}...`);
    try {
      const data = await request(`/api/admin/members/${member.id}/approve-kyc`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setStatus(data.message);
      await load();
    } catch (error: any) {
      setStatus(error.message || 'KYC approval failed.');
    } finally {
      setBusyAction('');
    }
  }

  if (!token || !admin) {
    return (
      <main className="grid min-h-screen bg-[#f8f9ff] text-[#0b1c30] md:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden bg-[#0d1c32] p-10 text-white md:flex md:flex-col md:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-[#fd761a] text-[#351000]"><Landmark /></div>
            <div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#ffb690]">Back Office</p><h1 className="text-2xl font-black">Grogon SACCO Admin</h1></div>
          </div>
          <div>
            <h2 className="max-w-xl text-5xl font-black leading-tight">Run onboarding, credit, savings and member support from one desk.</h2>
            <p className="mt-5 max-w-lg leading-8 text-[#d6e3ff]">Super admins control roles and oversight. Admins receive a temporary password, then must set a private password on first login before handling member operations.</p>
          </div>
          <p className="text-sm text-[#d6e3ff]">Demo super admin: superadmin@grogonsacco.co.ke / GrogonSuper2026!</p>
        </section>
        <section className="grid place-items-center px-4 py-10">
          <form onSubmit={signIn} className="w-full max-w-md rounded-2xl border border-[#c5c6cd] bg-white p-6 shadow-xl">
            <KeyRound className="text-[#9d4300]" />
            <h1 className="mt-4 text-4xl font-black">Admin login</h1>
            <p className="mt-3 leading-7 text-[#44474d]">Use a super-admin or admin account to access SACCO operations.</p>
            <Input label="Email" value={login.email} onChange={(value) => setLogin({ ...login, email: value })} />
            <Input label="Password" value={login.password} type="password" onChange={(value) => setLogin({ ...login, password: value })} />
            <button className="mt-6 w-full rounded-lg bg-[#fd761a] px-5 py-3 font-black text-[#351000]">Login</button>
            <p className="mt-4 rounded-lg bg-[#eff4ff] p-3 text-sm font-bold text-[#39475f]">{status}</p>
          </form>
        </section>
      </main>
    );
  }

  if (admin.mustChangePassword) {
    return (
      <main className="grid min-h-screen bg-[#f8f9ff] px-4 py-10 text-[#0b1c30]">
        <section className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-2xl border border-[#c5c6cd] bg-white shadow-xl md:grid-cols-[0.9fr_1.1fr]">
          <div className="bg-[#0d1c32] p-8 text-white">
            <ShieldCheck className="text-[#fd761a]" size={34} />
            <h1 className="mt-5 text-4xl font-black">Set your private admin password.</h1>
            <p className="mt-4 leading-8 text-[#d6e3ff]">
              This account was issued a temporary password by the super admin. Before accessing member records,
              loan approvals or transaction posting, create a private password known only to you.
            </p>
            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-[#d6e3ff]">
              <p className="font-black text-white">{admin.fullName}</p>
              <p>{admin.email}</p>
              <p className="mt-2 capitalize text-[#ffb690]">{admin.role.replace('_', ' ')}</p>
            </div>
          </div>
          <form onSubmit={changePassword} className="p-6 md:p-8">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#9d4300]">First login security</p>
            <h2 className="mt-2 text-3xl font-black">Replace issued password</h2>
            <Input label="Current temporary password" value={passwordForm.currentPassword} type="password" onChange={(value) => setPasswordForm({ ...passwordForm, currentPassword: value })} />
            <Input label="New private password" value={passwordForm.newPassword} type="password" onChange={(value) => setPasswordForm({ ...passwordForm, newPassword: value })} />
            <Input label="Confirm new password" value={passwordForm.confirmPassword} type="password" onChange={(value) => setPasswordForm({ ...passwordForm, confirmPassword: value })} />
            <button className="mt-6 w-full rounded-lg bg-[#fd761a] px-5 py-3 font-black text-[#351000]">Secure account and continue</button>
            <button type="button" onClick={logout} className="mt-3 w-full rounded-lg border border-[#c5c6cd] px-5 py-3 font-black">Logout</button>
            <p className="mt-4 rounded-lg bg-[#eff4ff] p-3 text-sm font-bold text-[#39475f]">{status}</p>
          </form>
        </section>
      </main>
    );
  }

  const tabs = ['Command', 'Onboarding', 'KYC', 'Loans', 'Transactions', 'Support', 'Admins', 'Audit'];

  return (
    <main className="min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      <aside className="fixed hidden h-screen w-72 bg-[#0d1c32] p-6 text-[#d6e3ff] lg:block">
        <div className="flex items-center gap-3 text-white">
          <Landmark className="text-[#fd761a]" />
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ffb690]">Admin Console</p><h1 className="text-xl font-black">Grogon SACCO</h1></div>
        </div>
        <div className="mt-7 rounded-xl bg-white/5 p-4">
          <p className="font-black text-white">{admin.fullName}</p>
          <p className="mt-1 text-sm capitalize text-[#ffb690]">{admin.role.replace('_', ' ')}</p>
        </div>
        <nav className="mt-6 grid gap-2">
          {tabs.filter((item) => item !== 'Admins' || can('admins.manage')).map((item) => (
            <button key={item} onClick={() => setTab(item)} className={`rounded-lg px-4 py-3 text-left font-bold ${tab === item ? 'bg-[#fd761a] text-[#351000]' : 'hover:bg-white/10'}`}>{item}</button>
          ))}
        </nav>
      </aside>

      <section className="lg:ml-72">
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-[#c5c6cd] bg-white/95 px-5 py-4 backdrop-blur">
          <div><p className="text-sm font-bold text-[#9d4300]">{status}</p><h2 className="text-2xl font-black">SACCO operations desk</h2></div>
          <div className="flex gap-2"><button onClick={load} className="flex items-center gap-2 rounded-lg bg-[#0d1c32] px-4 py-2 font-bold text-white"><RefreshCw size={18} />Refresh</button><button onClick={logout} className="flex items-center gap-2 rounded-lg border border-[#c5c6cd] px-4 py-2 font-bold"><LogOut size={18} />Logout</button></div>
        </header>

        <div className="grid gap-5 p-5 md:grid-cols-4 xl:grid-cols-7">
          <Stat icon={<Users />} title="Members" value={ops.totals.members.toLocaleString()} />
          <Stat icon={<PiggyBank />} title="Savings" value={fmt(ops.totals.savings)} />
          <Stat icon={<Banknote />} title="Loan Book" value={fmt(ops.totals.loans)} />
          <Stat icon={<BadgeCheck />} title="Pending KYC" value={String(ops.totals.pendingKyc)} />
          <Stat icon={<ClipboardList />} title="Loan Queue" value={String(ops.totals.loanQueue)} />
          <Stat icon={<TicketCheck />} title="Open Tickets" value={String(ops.totals.openTickets)} />
          <Stat icon={<ShieldCheck />} title="Role" value={admin.role === 'super_admin' ? 'Super' : 'Admin'} />
        </div>

        <ReportBar onPdf={downloadPdf} />

        {tab === 'Command' && <Dashboard ops={ops} onPdf={downloadPdf} />}
        {tab === 'Onboarding' && <Onboarding form={memberForm} setForm={setMemberForm} onSubmit={submitMember} canCreate={can('members.create')} tasks={ops.tasks} />}
        {tab === 'KYC' && <Kyc members={ops.members} busyId={busyAction} onApprove={approveKyc} onPdf={downloadPdf} />}
        {tab === 'Loans' && <Loans loans={ops.loans} canApprove={can('loans.approve')} onPdf={downloadPdf} onDecision={(id, status, notes) => quick(`/api/admin/loans/${id}/decision`, { status, notes: notes || `Marked ${status} from admin console` }, 'Updating loan...')} />}
        {tab === 'Transactions' && <Transactions members={ops.members} transactions={ops.transactions} txn={txn} setTxn={setTxn} onSubmit={postTransaction} onPdf={downloadPdf} />}
        {tab === 'Support' && <Support tickets={ops.tickets} onUpdate={(id, status) => quick(`/api/admin/tickets/${id}`, { status, resolution: status === 'closed' ? 'Resolved by SACCO desk' : 'Assigned for follow up' }, 'Updating ticket...')} />}
        {tab === 'Admins' && can('admins.manage') && <Admins admins={ops.admins} form={newAdmin} setForm={setNewAdmin} onSubmit={createAdmin} />}
        {tab === 'Audit' && <Audit audits={ops.audits} onPdf={downloadPdf} />}
      </section>
    </main>
  );
}

function Stat({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) { return <div className="rounded-xl border border-[#c5c6cd] bg-white p-4 shadow-sm"><div className="mb-3 text-[#9d4300]">{icon}</div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#44474d]">{title}</p><p className="mt-2 text-xl font-black">{value}</p></div>; }
function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="mt-4 block text-sm font-black text-[#44474d]">{label}<input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-lg border border-[#c5c6cd] bg-[#f8f9ff] p-3 text-[#0b1c30]" /></label>; }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="m-5 rounded-xl border border-[#c5c6cd] bg-white p-5 shadow-sm"><h3 className="mb-4 text-2xl font-black">{title}</h3>{children}</section>; }
function ReportBar({ onPdf }: any) {
  const reports = [
    ['operations', 'Operations'],
    ['members', 'Members'],
    ['savings', 'Savings'],
    ['loans', 'Loans'],
    ['dividends', 'Dividends'],
    ['audit', 'Audit'],
  ];
  return (
    <section className="mx-5 rounded-xl border border-[#c5c6cd] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#9d4300]">PDF reports</p>
          <p className="mt-1 text-sm text-[#44474d]">Download or print member savings, loans, dividends, audit and whole SACCO operations.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {reports.map(([key, label]) => (
            <button key={key} onClick={() => onPdf(`/api/admin/reports/${key}.pdf`, `grogon-${key}.pdf`)} className="inline-flex items-center gap-2 rounded-lg border border-[#c5c6cd] px-3 py-2 text-sm font-black">
              <Download size={16} /> {label}
            </button>
          ))}
          <button onClick={() => onPdf('/api/admin/reports/operations.pdf', 'grogon-operations.pdf', true)} className="inline-flex items-center gap-2 rounded-lg bg-[#0d1c32] px-3 py-2 text-sm font-black text-white">
            <FileText size={16} /> Print pack
          </button>
        </div>
      </div>
    </section>
  );
}
function Dashboard({ ops, onPdf }: { ops: Ops; onPdf: any }) { return <div className="grid gap-5 p-5 xl:grid-cols-2"><MiniTable title="Latest Members" rows={ops.members.map((m) => [m.memberNo, m.fullName, m.shopLocation, m.onboardingStage])} /><MiniTable title="Onboarding Tasks" rows={ops.tasks.map((t) => [t.memberNo, t.memberName, t.task, t.status])} /><MiniTable title="Recent M-Pesa and Admin Transactions" rows={ops.transactions.map((t) => [t.reference, t.memberName, t.kind, fmt(t.amount)])} /><MiniTable title="Credit Queue" rows={ops.loans.map((l) => [l.memberNo, l.loanType, fmt(l.amount), l.status])} /><Panel title="Member statement downloads"><div className="grid gap-2">{ops.members.slice(0, 8).map((m: any) => <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#eff4ff] p-3"><span className="font-bold">{m.memberNo} - {m.fullName}</span><button onClick={() => onPdf(`/api/admin/members/${m.id}/statement.pdf`, `${m.memberNo}-statement.pdf`)} className="rounded-lg bg-[#0d1c32] px-3 py-2 text-sm font-black text-white">PDF statement</button></div>)}</div></Panel></div>; }
function MiniTable({ title, rows }: { title: string; rows: string[][] }) { return <Panel title={title}><div className="space-y-2">{rows.slice(0, 8).map((row, i) => <div key={i} className="grid grid-cols-4 gap-2 rounded-lg bg-[#eff4ff] p-3 text-sm">{row.map((cell, j) => <span key={j} className="truncate font-semibold">{cell || '-'}</span>)}</div>)}</div></Panel>; }
function Onboarding({ form, setForm, onSubmit, canCreate, tasks }: any) { return <div className="grid gap-5 p-5 xl:grid-cols-[0.9fr_1.1fr]"><Panel title="Onboard member on behalf of SACCO">{canCreate ? <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">{Object.keys(form).map((key) => <Input key={key} label={key.replace(/([A-Z])/g, ' $1')} value={form[key]} onChange={(value) => setForm({ ...form, [key]: value })} />)}<button className="rounded-lg bg-[#fd761a] px-5 py-3 font-black text-[#351000] md:col-span-2">Create member and KYC task</button></form> : <p>You do not have member creation rights.</p>}</Panel><MiniTable title="Open onboarding tasks" rows={tasks.map((t: any) => [t.memberNo, t.memberName, t.task, t.status])} /></div>; }
function Kyc({ members, onApprove, busyId, onPdf }: any) {
  const queue = [...members].sort((a: any, b: any) => {
    const rank = (item: any) => item.kycStatus === 'approved' ? 1 : 0;
    return rank(a) - rank(b);
  });
  return (
    <Panel title="KYC and activation queue">
      <div className="mb-4 rounded-xl border border-[#c5c6cd] bg-[#f8f9ff] p-4">
        <p className="font-black">Approval checklist</p>
        <p className="mt-1 text-sm leading-6 text-[#44474d]">
          Confirm ID, KRA PIN, next of kin, trade category and workshop location before activation.
          Approved members move to savings active and their onboarding tasks are closed automatically.
        </p>
      </div>
      <div className="grid gap-3">
        {queue.map((m: any) => {
          const approved = m.kycStatus === 'approved';
          const busy = busyId === m.id;
          return (
            <div key={m.id} className={`grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_auto] md:items-center ${approved ? 'border-[#4edea3] bg-[#eefcf6]' : 'border-[#c5c6cd] bg-[#eff4ff]'}`}>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black">{m.memberNo} - {m.fullName}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${approved ? 'bg-[#d8f8e8] text-[#005236]' : 'bg-[#ffdbca] text-[#783200]'}`}>
                    {approved ? 'Approved' : 'Needs review'}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[#44474d]">{m.tradeCategory || 'Auto trade'} - {m.shopLocation}</p>
                <p className="mt-1 text-sm text-[#44474d]">Stage: {m.onboardingStage} - Status: {m.status}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => onPdf(`/api/admin/members/${m.id}/statement.pdf`, `${m.memberNo}-statement.pdf`)} className="rounded-lg border border-[#c5c6cd] px-4 py-2 font-black">PDF</button>
                <button
                  disabled={approved || busy}
                  onClick={() => onApprove(m)}
                  className={`rounded-lg px-4 py-2 font-black transition ${approved ? 'cursor-not-allowed bg-[#d8f8e8] text-[#005236]' : busy ? 'cursor-wait bg-[#fd761a] text-[#351000]' : 'bg-[#0d1c32] text-white hover:bg-[#172a49]'}`}
                >
                  {approved ? 'KYC Approved' : busy ? 'Approving...' : 'Approve KYC'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
function Loans({ loans, canApprove, onDecision, onPdf }: any) {
  const [selected, setSelected] = useState<any>(null);
  const [status, setStatus] = useState('under_review');
  const [notes, setNotes] = useState('');
  function review(loan: any) {
    setSelected(loan);
    setStatus(loan.status === 'submitted' ? 'under_review' : loan.status);
    setNotes(loan.decisionNotes || `Reviewed ${loan.memberNo} ${loan.loanType} request against savings, repayment capacity and workshop purpose.`);
  }
  return (
    <Panel title="Loan committee desk">
      <div className="mb-4 rounded-xl border border-[#c5c6cd] bg-[#f8f9ff] p-4">
        <p className="font-black">Credit review workflow</p>
        <p className="mt-1 text-sm text-[#44474d]">Click Review to open notes, status selection and decision actions. Super admins can approve and disburse.</p>
      </div>
      <div className="grid gap-3">
        {loans.map((l: any) => <div key={l.id} className="rounded-lg bg-[#eff4ff] p-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-black">{l.memberNo} - {l.loanType} - {fmt(l.amount)}</p><p className="text-sm text-[#44474d]">{l.purpose}</p><p className="mt-1 text-xs font-bold uppercase text-[#9d4300]">Status: {l.status}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => review(l)} className="rounded-lg border border-[#0d1c32] px-3 py-2 font-bold">Review</button><button onClick={() => onDecision(l.id, 'rejected', 'Rejected from committee desk after review.')} className="rounded-lg border px-3 py-2 font-bold">Reject</button>{canApprove && <><button onClick={() => onDecision(l.id, 'approved', 'Approved by credit committee.')} className="rounded-lg bg-[#fd761a] px-3 py-2 font-black text-[#351000]">Approve</button><button onClick={() => onDecision(l.id, 'disbursed', 'Disbursed after approval and member confirmation.')} className="rounded-lg bg-[#0d1c32] px-3 py-2 font-black text-white">Disburse</button></>}<button onClick={() => onPdf('/api/admin/reports/loans.pdf', 'grogon-loans.pdf')} className="rounded-lg border px-3 py-2 font-bold">PDF</button></div></div></div>)}
      </div>
      {selected && (
        <div className="mt-5 rounded-xl border border-[#c5c6cd] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#9d4300]">Committee review</p>
              <h4 className="mt-1 text-2xl font-black">{selected.memberNo} - {selected.loanType}</h4>
              <p className="mt-1 text-sm text-[#44474d]">{fmt(selected.amount)} over {selected.termMonths} months. Monthly repayment {fmt(selected.monthlyRepayment)}.</p>
            </div>
            <button onClick={() => setSelected(null)} className="rounded-lg border px-3 py-2 font-bold">Close</button>
          </div>
          <label className="mt-4 block text-sm font-black text-[#44474d]">Decision status<select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-2 w-full rounded-lg border border-[#c5c6cd] bg-[#f8f9ff] p-3"><option value="under_review">Under review</option><option value="rejected">Rejected</option>{canApprove && <option value="approved">Approved</option>}{canApprove && <option value="disbursed">Disbursed</option>}</select></label>
          <label className="mt-4 block text-sm font-black text-[#44474d]">Committee notes<textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-2 min-h-28 w-full rounded-lg border border-[#c5c6cd] bg-[#f8f9ff] p-3" /></label>
          <button onClick={() => onDecision(selected.id, status, notes)} className="mt-4 rounded-lg bg-[#fd761a] px-5 py-3 font-black text-[#351000]">Save review decision</button>
        </div>
      )}
    </Panel>
  );
}
function Transactions({ members, transactions, txn, setTxn, onSubmit, onPdf }: any) { return <div className="grid gap-5 p-5 xl:grid-cols-[0.85fr_1.15fr]"><Panel title="Back-office adjustment"><form onSubmit={onSubmit} className="grid gap-3"><p className="rounded-lg bg-[#fff2e6] p-3 text-sm font-bold text-[#783200]">Normal member savings are posted automatically from M-Pesa PayBill callbacks. Use this only for corrections, dividends, loan repayments received outside PayBill, or admin-approved adjustments.</p><label className="text-sm font-black text-[#44474d]">Member<select value={txn.memberId} onChange={(e) => setTxn({ ...txn, memberId: e.target.value })} className="mt-2 w-full rounded-lg border border-[#c5c6cd] bg-[#f8f9ff] p-3">{members.map((m: any) => <option key={m.id} value={m.id}>{m.memberNo} - {m.fullName}</option>)}</select></label>{['kind','amount','channel','reference'].map((key) => <Input key={key} label={key} value={txn[key]} onChange={(value) => setTxn({ ...txn, [key]: value })} />)}<button className="rounded-lg bg-[#fd761a] px-5 py-3 font-black text-[#351000]">Post adjustment</button></form></Panel><Panel title="Recent posted transactions"><div className="mb-3 flex flex-wrap gap-2"><button onClick={() => onPdf('/api/admin/reports/savings.pdf', 'grogon-savings.pdf')} className="rounded-lg border px-3 py-2 font-bold">Savings PDF</button><button onClick={() => onPdf('/api/admin/reports/operations.pdf', 'grogon-operations.pdf', true)} className="rounded-lg bg-[#0d1c32] px-3 py-2 font-bold text-white">Print operations</button></div><MiniTable title="M-Pesa and admin activity" rows={transactions.map((t: any) => [t.reference, t.memberName, t.kind, fmt(t.amount)])} /></Panel></div>; }
function Support({ tickets, onUpdate }: any) { return <Panel title="Member support desk"><div className="grid gap-3">{tickets.map((t: any) => <div key={t.id} className="rounded-lg bg-[#eff4ff] p-4"><p className="font-black">{t.memberNo || '-'} - {t.memberName || 'Member'} - {t.subject}</p><p className="mt-1 text-sm text-[#44474d]">{t.message}</p><div className="mt-3 flex gap-2"><button onClick={() => onUpdate(t.id, 'in_progress')} className="rounded-lg border px-3 py-2 font-bold">Assign</button><button onClick={() => onUpdate(t.id, 'closed')} className="rounded-lg bg-[#0d1c32] px-3 py-2 font-bold text-white">Close</button></div></div>)}</div></Panel>; }
function Admins({ admins, form, setForm, onSubmit }: any) { return <div className="grid gap-5 p-5 xl:grid-cols-[0.8fr_1.2fr]"><Panel title="Create admin user"><form onSubmit={onSubmit} className="grid gap-3"><p className="rounded-lg bg-[#eff4ff] p-3 text-sm font-bold text-[#39475f]">Issued passwords are temporary. The admin will be forced to create a private password on first login.</p>{['fullName','email','password'].map((key) => <Input key={key} label={key === 'password' ? 'Temporary issued password' : key} value={form[key]} type={key === 'password' ? 'password' : 'text'} onChange={(value) => setForm({ ...form, [key]: value })} />)}<label className="text-sm font-black text-[#44474d]">Role<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="mt-2 w-full rounded-lg border border-[#c5c6cd] bg-[#f8f9ff] p-3"><option value="admin">Admin</option><option value="super_admin">Super Admin</option></select></label><button className="rounded-lg bg-[#fd761a] px-5 py-3 font-black text-[#351000]">Create admin</button></form></Panel><MiniTable title="Admin users and rights" rows={admins.map((a: any) => [a.fullName, a.email, a.role, a.mustChangePassword ? 'Password reset due' : a.status])} /></div>; }
function Audit({ audits, onPdf }: any) { return <Panel title="Audit trail"><div className="mb-3"><button onClick={() => onPdf('/api/admin/reports/audit.pdf', 'grogon-audit.pdf')} className="rounded-lg bg-[#0d1c32] px-3 py-2 font-bold text-white">Download audit PDF</button></div><div className="space-y-2">{audits.map((a: any) => <div key={a.id} className="grid grid-cols-4 gap-2 rounded-lg bg-[#eff4ff] p-3 text-sm"><span className="font-bold">{a.adminName || 'System'}</span><span>{a.action}</span><span>{a.entityType}</span><span>{new Date(a.createdAt).toLocaleString()}</span></div>)}</div></Panel>; }
