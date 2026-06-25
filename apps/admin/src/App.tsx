import React, { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Banknote,
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

  async function quick(path: string, body: any, label: string) {
    setStatus(label);
    try {
      const data = await request(path, { method: 'PATCH', body: JSON.stringify(body) });
      setStatus(data.message);
      await load();
    } catch (error: any) {
      setStatus(error.message);
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

        {tab === 'Command' && <Dashboard ops={ops} />}
        {tab === 'Onboarding' && <Onboarding form={memberForm} setForm={setMemberForm} onSubmit={submitMember} canCreate={can('members.create')} tasks={ops.tasks} />}
        {tab === 'KYC' && <Kyc members={ops.members} onApprove={(id) => quick(`/api/admin/members/${id}/approve-kyc`, {}, 'Approving KYC...')} />}
        {tab === 'Loans' && <Loans loans={ops.loans} canApprove={can('loans.approve')} onDecision={(id, status) => quick(`/api/admin/loans/${id}/decision`, { status, notes: `Marked ${status} from admin console` }, 'Updating loan...')} />}
        {tab === 'Transactions' && <Transactions members={ops.members} transactions={ops.transactions} txn={txn} setTxn={setTxn} onSubmit={postTransaction} />}
        {tab === 'Support' && <Support tickets={ops.tickets} onUpdate={(id, status) => quick(`/api/admin/tickets/${id}`, { status, resolution: status === 'closed' ? 'Resolved by SACCO desk' : 'Assigned for follow up' }, 'Updating ticket...')} />}
        {tab === 'Admins' && can('admins.manage') && <Admins admins={ops.admins} form={newAdmin} setForm={setNewAdmin} onSubmit={createAdmin} />}
        {tab === 'Audit' && <Audit audits={ops.audits} />}
      </section>
    </main>
  );
}

function Stat({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) { return <div className="rounded-xl border border-[#c5c6cd] bg-white p-4 shadow-sm"><div className="mb-3 text-[#9d4300]">{icon}</div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#44474d]">{title}</p><p className="mt-2 text-xl font-black">{value}</p></div>; }
function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="mt-4 block text-sm font-black text-[#44474d]">{label}<input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-lg border border-[#c5c6cd] bg-[#f8f9ff] p-3 text-[#0b1c30]" /></label>; }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="m-5 rounded-xl border border-[#c5c6cd] bg-white p-5 shadow-sm"><h3 className="mb-4 text-2xl font-black">{title}</h3>{children}</section>; }
function Dashboard({ ops }: { ops: Ops }) { return <div className="grid gap-5 p-5 xl:grid-cols-2"><MiniTable title="Latest Members" rows={ops.members.map((m) => [m.memberNo, m.fullName, m.shopLocation, m.onboardingStage])} /><MiniTable title="Onboarding Tasks" rows={ops.tasks.map((t) => [t.memberNo, t.memberName, t.task, t.status])} /><MiniTable title="Recent Transactions" rows={ops.transactions.map((t) => [t.reference, t.memberName, t.kind, fmt(t.amount)])} /><MiniTable title="Credit Queue" rows={ops.loans.map((l) => [l.memberNo, l.loanType, fmt(l.amount), l.status])} /></div>; }
function MiniTable({ title, rows }: { title: string; rows: string[][] }) { return <Panel title={title}><div className="space-y-2">{rows.slice(0, 8).map((row, i) => <div key={i} className="grid grid-cols-4 gap-2 rounded-lg bg-[#eff4ff] p-3 text-sm">{row.map((cell, j) => <span key={j} className="truncate font-semibold">{cell || '-'}</span>)}</div>)}</div></Panel>; }
function Onboarding({ form, setForm, onSubmit, canCreate, tasks }: any) { return <div className="grid gap-5 p-5 xl:grid-cols-[0.9fr_1.1fr]"><Panel title="Onboard member on behalf of SACCO">{canCreate ? <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">{Object.keys(form).map((key) => <Input key={key} label={key.replace(/([A-Z])/g, ' $1')} value={form[key]} onChange={(value) => setForm({ ...form, [key]: value })} />)}<button className="rounded-lg bg-[#fd761a] px-5 py-3 font-black text-[#351000] md:col-span-2">Create member and KYC task</button></form> : <p>You do not have member creation rights.</p>}</Panel><MiniTable title="Open onboarding tasks" rows={tasks.map((t: any) => [t.memberNo, t.memberName, t.task, t.status])} /></div>; }
function Kyc({ members, onApprove }: any) { return <Panel title="KYC and activation queue"><div className="grid gap-3">{members.map((m: any) => <div key={m.id} className="grid gap-3 rounded-lg bg-[#eff4ff] p-4 md:grid-cols-[1fr_auto] md:items-center"><div><p className="font-black">{m.memberNo} - {m.fullName}</p><p className="text-sm text-[#44474d]">{m.tradeCategory || 'Auto trade'} - {m.shopLocation} - {m.kycStatus} - {m.onboardingStage}</p></div><button onClick={() => onApprove(m.id)} className="rounded-lg bg-[#0d1c32] px-4 py-2 font-bold text-white">Approve KYC</button></div>)}</div></Panel>; }
function Loans({ loans, canApprove, onDecision }: any) { return <Panel title="Loan committee desk"><div className="grid gap-3">{loans.map((l: any) => <div key={l.id} className="rounded-lg bg-[#eff4ff] p-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-black">{l.memberNo} - {l.loanType} - {fmt(l.amount)}</p><p className="text-sm text-[#44474d]">{l.purpose}</p></div><div className="flex gap-2"><button onClick={() => onDecision(l.id, 'under_review')} className="rounded-lg border px-3 py-2 font-bold">Review</button><button onClick={() => onDecision(l.id, 'rejected')} className="rounded-lg border px-3 py-2 font-bold">Reject</button>{canApprove && <><button onClick={() => onDecision(l.id, 'approved')} className="rounded-lg bg-[#fd761a] px-3 py-2 font-black text-[#351000]">Approve</button><button onClick={() => onDecision(l.id, 'disbursed')} className="rounded-lg bg-[#0d1c32] px-3 py-2 font-black text-white">Disburse</button></>}</div></div></div>)}</div></Panel>; }
function Transactions({ members, transactions, txn, setTxn, onSubmit }: any) { return <div className="grid gap-5 p-5 xl:grid-cols-[0.85fr_1.15fr]"><Panel title="Post transaction for member"><form onSubmit={onSubmit} className="grid gap-3"><label className="text-sm font-black text-[#44474d]">Member<select value={txn.memberId} onChange={(e) => setTxn({ ...txn, memberId: e.target.value })} className="mt-2 w-full rounded-lg border border-[#c5c6cd] bg-[#f8f9ff] p-3">{members.map((m: any) => <option key={m.id} value={m.id}>{m.memberNo} - {m.fullName}</option>)}</select></label>{['kind','amount','channel','reference'].map((key) => <Input key={key} label={key} value={txn[key]} onChange={(value) => setTxn({ ...txn, [key]: value })} />)}<button className="rounded-lg bg-[#fd761a] px-5 py-3 font-black text-[#351000]">Post transaction</button></form></Panel><MiniTable title="Recent posted transactions" rows={transactions.map((t: any) => [t.reference, t.memberName, t.kind, fmt(t.amount)])} /></div>; }
function Support({ tickets, onUpdate }: any) { return <Panel title="Member support desk"><div className="grid gap-3">{tickets.map((t: any) => <div key={t.id} className="rounded-lg bg-[#eff4ff] p-4"><p className="font-black">{t.memberNo || '-'} - {t.memberName || 'Member'} - {t.subject}</p><p className="mt-1 text-sm text-[#44474d]">{t.message}</p><div className="mt-3 flex gap-2"><button onClick={() => onUpdate(t.id, 'in_progress')} className="rounded-lg border px-3 py-2 font-bold">Assign</button><button onClick={() => onUpdate(t.id, 'closed')} className="rounded-lg bg-[#0d1c32] px-3 py-2 font-bold text-white">Close</button></div></div>)}</div></Panel>; }
function Admins({ admins, form, setForm, onSubmit }: any) { return <div className="grid gap-5 p-5 xl:grid-cols-[0.8fr_1.2fr]"><Panel title="Create admin user"><form onSubmit={onSubmit} className="grid gap-3"><p className="rounded-lg bg-[#eff4ff] p-3 text-sm font-bold text-[#39475f]">Issued passwords are temporary. The admin will be forced to create a private password on first login.</p>{['fullName','email','password'].map((key) => <Input key={key} label={key === 'password' ? 'Temporary issued password' : key} value={form[key]} type={key === 'password' ? 'password' : 'text'} onChange={(value) => setForm({ ...form, [key]: value })} />)}<label className="text-sm font-black text-[#44474d]">Role<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="mt-2 w-full rounded-lg border border-[#c5c6cd] bg-[#f8f9ff] p-3"><option value="admin">Admin</option><option value="super_admin">Super Admin</option></select></label><button className="rounded-lg bg-[#fd761a] px-5 py-3 font-black text-[#351000]">Create admin</button></form></Panel><MiniTable title="Admin users and rights" rows={admins.map((a: any) => [a.fullName, a.email, a.role, a.mustChangePassword ? 'Password reset due' : a.status])} /></div>; }
function Audit({ audits }: any) { return <Panel title="Audit trail"><div className="space-y-2">{audits.map((a: any) => <div key={a.id} className="grid grid-cols-4 gap-2 rounded-lg bg-[#eff4ff] p-3 text-sm"><span className="font-bold">{a.adminName || 'System'}</span><span>{a.action}</span><span>{a.entityType}</span><span>{new Date(a.createdAt).toLocaleString()}</span></div>)}</div></Panel>; }
