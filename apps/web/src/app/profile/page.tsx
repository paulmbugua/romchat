'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Session = {
  user?: {
    id?: string;
    email?: string;
    name?: string;
    displayName?: string;
    phone?: string;
  };
  profile?: {
    bio?: string;
    age?: number;
    city?: string;
    verified?: boolean;
    online?: boolean;
    interestTags?: string[];
  };
  privacy?: Record<string, unknown>;
};

const TOKEN_KEYS = ['romchat-web-token', 'romchat:auth:token', 'grogon-member-token'];

function resolveApiBase() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
}

async function apiJson(path: string, init: RequestInit = {}, token?: string) {
  const response = await fetch(`${resolveApiBase()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || `Request failed with status ${response.status}`);
  }
  return data;
}

export default function Page() {
  const [token, setToken] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const displayName = useMemo(() => {
    return session?.user?.displayName || session?.user?.name || session?.user?.email?.split('@')[0] || 'RomChat member';
  }, [session]);

  useEffect(() => {
    const storedToken = TOKEN_KEYS.map((key) => (typeof window !== 'undefined' ? localStorage.getItem(key) : null)).find(Boolean) || '';
    if (!storedToken) {
      window.location.replace('/login');
      return;
    }
    setToken(storedToken);
    void loadProfile(storedToken);
  }, []);

  async function loadProfile(authToken: string) {
    try {
      setLoading(true);
      setError('');
      const data = await apiJson('/api/romchat/auth/me', {}, authToken);
      setSession(data as Session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your RomChat profile.');
    } finally {
      setLoading(false);
    }
  }

  function clearSession() {
    for (const key of TOKEN_KEYS) {
      localStorage.removeItem(key);
    }
    localStorage.removeItem('romchat-session');
    localStorage.removeItem('romchat:user');
  }

  async function handleDelete() {
    if (!token || busy) return;
    const confirmed = window.confirm('Delete your RomChat account now? This removes your access and profile data from the backend.');
    if (!confirmed) return;
    try {
      setBusy(true);
      setError('');
      await apiJson('/api/romchat/auth/account', {
        method: 'DELETE',
        body: JSON.stringify({ reason: 'Requested from RomChat web profile.' }),
      }, token);
      clearSession();
      window.location.replace('/login?deleted=1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete your RomChat account.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeletionRequest() {
    if (!token || busy) return;
    try {
      setBusy(true);
      setError('');
      const payload = await apiJson('/api/romchat/auth/account/deletion-request', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Requested from RomChat web profile.' }),
      }, token);
      window.alert(payload?.message || 'Deletion request submitted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit deletion request.');
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    clearSession();
    window.location.replace('/login');
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#120914] px-6 py-16 text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-center rounded-[28px] border border-white/10 bg-white/5 p-10 text-center">
          <div>
            <div className="mx-auto mb-4 h-14 w-14 animate-pulse rounded-full bg-[#ff1493]/30" />
            <p className="text-2xl font-black">Opening your RomChat profile</p>
            <p className="mt-2 text-white/70">Loading your live account controls.</p>
          </div>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-[#120914] px-6 py-16 text-white">
        <div className="mx-auto max-w-4xl rounded-[28px] border border-white/10 bg-white/5 p-8">
          <p className="text-3xl font-black">RomChat profile unavailable</p>
          <p className="mt-3 max-w-2xl text-white/70">{error || 'Please sign in again to continue.'}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/login" className="rounded-full bg-[#ff1493] px-6 py-3 font-black text-white">
              Go to login
            </Link>
            <Link href="/privacy" className="rounded-full border border-white/10 px-6 py-3 font-black text-white/80">
              Privacy
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,20,147,0.22),_transparent_35%),linear-gradient(180deg,#120914_0%,#1e1222_100%)] px-4 py-6 text-white sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <section className="rounded-[28px] border border-white/10 bg-black/30 p-6 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ffb3d4]">RomChat profile hub</p>
              <h1 className="mt-2 text-4xl font-black sm:text-5xl">{displayName}</h1>
              <p className="mt-2 max-w-2xl text-white/70">Manage your romance profile, privacy, and account actions from one web screen.</p>
            </div>
            <div className="rounded-full border border-[#ff1493]/30 bg-[#ff1493]/10 px-4 py-2 text-sm font-bold text-[#ffd0e5]">
              {session.profile?.online ? 'Online now' : 'Offline'}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-white/60">Email</p>
              <p className="mt-2 text-lg font-bold">{session.user?.email || 'Not set'}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-white/60">Profile city</p>
              <p className="mt-2 text-lg font-bold">{session.profile?.city || 'Add your city'}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-white/60">Profile status</p>
              <p className="mt-2 text-lg font-bold">{session.profile?.verified ? 'Verified' : 'Needs verification'}</p>
            </div>
          </div>

          {error ? <p className="mt-4 rounded-2xl border border-[#ff6f61]/30 bg-[#ff6f61]/10 p-4 text-sm text-[#ffd7d2]">{error}</p> : null}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-black">Account controls</h2>
            <p className="mt-2 text-white/70">Use the same account actions available on mobile.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link href="/messages" className="rounded-2xl bg-white px-5 py-4 text-center font-black text-[#120914] transition hover:scale-[1.01]">
                Open messages
              </Link>
              <Link href="/privacy" className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center font-black text-white transition hover:bg-white/10">
                Privacy controls
              </Link>
              <Link href="/terms" className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center font-black text-white transition hover:bg-white/10">
                Terms of use
              </Link>
              <Link href="/delete-account" className="rounded-2xl border border-[#ff6f61]/30 bg-[#ff6f61]/10 px-5 py-4 text-center font-black text-[#ffd7d2] transition hover:bg-[#ff6f61]/15">
                Deletion policy
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-black">Session actions</h2>
            <div className="mt-5 flex flex-col gap-3">
              <button disabled={busy} onClick={signOut} className="rounded-2xl bg-[#ffd700] px-5 py-4 font-black text-[#120914] transition hover:scale-[1.01] disabled:opacity-60">
                Log out
              </button>
              <button disabled={busy} onClick={() => void handleDeletionRequest()} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-black text-white transition hover:bg-white/10 disabled:opacity-60">
                Request data deletion
              </button>
              <button disabled={busy} onClick={() => void handleDelete()} className="rounded-2xl bg-[#ff6f61] px-5 py-4 font-black text-white transition hover:scale-[1.01] disabled:opacity-60">
                Delete account
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-black/20 p-6">
          <h2 className="text-2xl font-black">RomChat account status</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Matches', session.profile?.verified ? 'Priority access' : 'Complete verification'],
              ['Messages', 'Open from the web chat screen'],
              ['Safety', 'Manage privacy and blocks'],
              ['Deletion', 'Request or remove account anytime'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/60">{label}</p>
                <p className="mt-2 font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
