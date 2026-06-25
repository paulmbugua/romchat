'use client';

import { type FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, KeyRound, LockKeyhole, Phone, ShieldCheck, Wrench } from 'lucide-react';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function Page() {
  const router = useRouter();
  const [memberNo, setMemberNo] = useState('GS-0001');
  const [phone, setPhone] = useState('+254711204480');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!memberNo.trim() || !phone.trim()) {
      setError('Enter your member number and registered phone number.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/member/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberNo, phone, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || 'Login failed. Confirm your member number, phone and password.');
        return;
      }
      localStorage.setItem('grogon-member-token', data.token);
      localStorage.setItem('grogon-member-dashboard', JSON.stringify(data.dashboard));
      localStorage.removeItem('grogon-sacco-session');
      router.push(data.mustSetPassword ? '/portal?setup=1' : '/portal');
    } catch {
      setError('Could not reach the SACCO server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#f8f9ff] text-[#0b1c30] md:grid-cols-[0.95fr_1.05fr]">
      <section className="relative hidden overflow-hidden bg-[#0d1c32] p-10 text-white md:block">
        <div className="absolute inset-0 hex-pattern opacity-20" />
        <div className="relative flex h-full flex-col justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-[#fd761a] text-[#351000]">
              <Wrench />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ffb690]">Grogon SACCO</p>
              <p className="font-mont text-2xl font-black">Member Access</p>
            </div>
          </a>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#ffb690]">Private member services</p>
            <h1 className="font-mont mt-3 max-w-xl text-5xl font-black leading-tight">
              Your savings, credit, dividends and support desk in one place.
            </h1>
            <p className="mt-5 max-w-lg leading-8 text-[#d6e3ff]">
              First-time members verify with their member number and registered phone, then create a
              private password for future access.
            </p>
          </div>
          <div className="grid gap-3 text-sm font-bold text-[#d6e3ff]">
            <span className="flex items-center gap-2"><ShieldCheck size={18} /> KYC-protected member records</span>
            <span className="flex items-center gap-2"><LockKeyhole size={18} /> Password setup after first verified login</span>
          </div>
        </div>
      </section>

      <section className="grid place-items-center px-4 py-10">
        <form onSubmit={login} className="w-full max-w-md rounded-2xl border border-[#c5c6cd] bg-white p-6 shadow-xl">
          <a href="/" className="mb-7 inline-flex items-center gap-2 text-sm font-black text-[#9d4300]">
            <Wrench size={18} />
            Grogon SACCO
          </a>
          <h1 className="font-mont text-4xl font-black">Member login</h1>
          <p className="mt-3 leading-7 text-[#44474d]">
            Use your SACCO member number and registered phone. If this is your first login, leave
            password blank and you will create one before entering the dashboard.
          </p>
          <label className="mt-6 block text-sm font-black text-[#44474d]">
            Member number
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#c5c6cd] bg-[#f8f9ff] px-3">
              <KeyRound className="text-[#9d4300]" size={19} />
              <input className="w-full bg-transparent py-3 outline-none" value={memberNo} onChange={(event) => setMemberNo(event.target.value)} />
            </div>
          </label>
          <label className="mt-4 block text-sm font-black text-[#44474d]">
            Registered phone
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#c5c6cd] bg-[#f8f9ff] px-3">
              <Phone className="text-[#9d4300]" size={19} />
              <input className="w-full bg-transparent py-3 outline-none" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </div>
          </label>
          <label className="mt-4 block text-sm font-black text-[#44474d]">
            Password
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#c5c6cd] bg-[#f8f9ff] px-3">
              <LockKeyhole className="text-[#9d4300]" size={19} />
              <input
                className="w-full bg-transparent py-3 outline-none"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Leave blank on first login"
              />
              <button type="button" className="text-[#44474d]" onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password visibility">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          {error && <p className="mt-4 rounded-lg bg-[#ffdad6] p-3 text-sm font-bold text-[#93000a]">{error}</p>}
          <button disabled={loading} className="mt-6 w-full rounded-lg bg-[#fd761a] px-5 py-3 font-black text-[#351000] disabled:opacity-60">
            {loading ? 'Checking access...' : 'Login to Member Dashboard'}
          </button>
          <p className="mt-5 text-sm leading-6 text-[#44474d]">
            New member onboarding is handled by SACCO admins after KYC at the Kirinyaga Road service
            desk.
          </p>
        </form>
      </section>
    </main>
  );
}
