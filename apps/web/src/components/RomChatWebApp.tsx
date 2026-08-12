'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  Camera,
  Check,
  CreditCard,
  Flag,
  Heart,
  ImagePlus,
  LogOut,
  MessageCircle,
  Shield,
  Sparkles,
  Star,
  Trash2,
  Upload,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react';
import { resolveBackendUrl } from '../lib/backendUrl';
import CustomGoogleButtonLogin from './auth/CustomGoogleButtonLogin.web';

type AppSection = 'swipe' | 'likes' | 'chat' | 'tokens' | 'safety' | 'profile';
type Mode = 'app' | 'profile' | 'messages';

type Session = {
  user?: { id?: string; email?: string; name?: string; displayName?: string };
  profile?: Record<string, any> | null;
  onboarding?: { catalogueAccess?: number };
};

type Profile = {
  id: string;
  name?: string;
  displayName?: string;
  age?: number;
  city?: string;
  intent?: string;
  bio?: string;
  prompt?: string;
  verified?: boolean;
  online?: boolean;
  matchScore?: number;
  match_score?: number;
  interests?: string[];
  tags?: string[];
  media?: Array<{ id?: string; url?: string; mediaType?: string }>;
  photos?: string[];
  image?: string;
  photoUrl?: string;
};

const TOKEN_KEYS = ['romchat-web-token', 'romchat:auth:token', 'grogon-member-token'];
const apiBase = () => resolveBackendUrl(process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL);
const first = (...values: Array<unknown>) => values.find((value) => typeof value === 'string' && value.trim()) as string | undefined;
const imageFor = (profile?: Profile | null) =>
  first(profile?.media?.find((item) => item.mediaType !== 'voice')?.url, profile?.photos?.[0], profile?.photoUrl, profile?.image) || '/assets/romchat/icon.png';
const nameFor = (profile?: Profile | null) => first(profile?.displayName, profile?.name) || 'RomChat member';
const interestsFor = (profile?: Profile | null) => (profile?.interests?.length ? profile.interests : profile?.tags || []).slice(0, 5);

async function apiJson(path: string, init: RequestInit = {}, token = '') {
  const response = await fetch(apiBase() + path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(init.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || 'Request failed with status ' + response.status);
  return data;
}

function getStoredToken() {
  if (typeof window === 'undefined') return '';
  return TOKEN_KEYS.map((key) => localStorage.getItem(key)).find(Boolean) || '';
}

function storeToken(token: string) {
  if (!token) return;
  localStorage.setItem('romchat-web-token', token);
  localStorage.setItem('romchat:auth:token', token);
}

function clearStoredSession() {
  TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem('romchat-session');
  localStorage.removeItem('romchat:user');
}

const intentions = ['Serious relationship', 'Long-term partner', 'Marriage minded', 'Intentional dating', 'Coffee dates first', 'New friends and vibes'];
const interests = ['Coffee dates', 'Live music', 'Travel', 'Church', 'Football', 'Cooking', 'Gym', 'Movies', 'Art', 'Hiking', 'Beach weekends', 'Comedy', 'Books', 'Dancing'];

export default function RomChatWebApp({ mode = 'app' }: { mode?: Mode }) {
  const [section, setSection] = useState<AppSection>(mode === 'profile' ? 'profile' : mode === 'messages' ? 'chat' : 'swipe');
  const [token, setToken] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileIndex, setProfileIndex] = useState(0);
  const [messages, setMessages] = useState<any[]>([]);
  const [matchId, setMatchId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const existing = getStoredToken();
    setToken(existing);
    void load(existing);
  }, []);

  async function load(authToken = token) {
    setLoading(true);
    try {
      const [bootstrap, discovery, me] = await Promise.all([
        apiJson('/api/romchat/bootstrap', {}, authToken).catch(() => ({})),
        apiJson('/api/romchat/discovery', {}, authToken).catch(() => ({ profiles: [] })),
        authToken ? apiJson('/api/romchat/auth/me', {}, authToken).catch(() => null) : Promise.resolve(null),
      ]);
      setSession((me || bootstrap) as Session);
      setProfiles((discovery?.profiles || bootstrap?.profiles || []).filter(Boolean));
      const firstMatch = bootstrap?.matches?.[0]?.id || discovery?.matches?.[0]?.id || '';
      if (firstMatch) setMatchId(firstMatch);
    } finally {
      setLoading(false);
    }
  }

  const activeProfile = profiles[profileIndex] || null;
  const signedIn = Boolean(token && session?.user);

  async function handleSwipe(action: 'pass' | 'like' | 'super_like') {
    if (!activeProfile) return;
    if (!signedIn) {
      setSection('profile');
      setToast('Create or login to your RomChat account before swiping.');
      return;
    }
    try {
      const result = await apiJson('/api/romchat/swipes', {
        method: 'POST',
        body: JSON.stringify({ profileId: activeProfile.id, action }),
      }, token);
      if (result?.matched || result?.matchId) {
        setToast('It is a match. You can message now.');
        setMatchId(result.matchId || result.match?.id || matchId);
        setSection('chat');
      } else {
        setToast(action === 'pass' ? 'Passed. Showing the next profile.' : 'Like sent.');
      }
      setProfileIndex((value) => Math.min(value + 1, Math.max(0, profiles.length - 1)));
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Swipe failed.');
    }
  }

  async function loadMessages(id = matchId) {
    if (!id) return;
    try {
      const data = await apiJson('/api/romchat/messages/' + encodeURIComponent(id), {}, token);
      setMessages(data?.messages || []);
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Unable to load messages.');
    }
  }

  async function sendChat(sample?: string) {
    const text = (sample || messageText).trim();
    if (!text || !matchId) return;
    try {
      const data = await apiJson('/api/romchat/messages', {
        method: 'POST',
        body: JSON.stringify({ matchId, text }),
      }, token);
      setMessages((items) => [...items, data.message]);
      setMessageText('');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Message not sent.');
    }
  }

  async function reportActiveProfile() {
    if (!activeProfile) return;
    await apiJson('/api/romchat/reports', {
      method: 'POST',
      body: JSON.stringify({
        profileId: activeProfile.id,
        type: 'abuse_or_suspicious_behavior',
        details: 'Reported from RomChat web safety action.',
      }),
    }, token);
    setToast('Report received. We also blocked this profile from your experience.');
  }

  return (
    <main className="min-h-screen bg-[#09050b] text-white">
      <AppHeader signedIn={signedIn} onLogin={() => setSection('profile')} onLogout={() => { clearStoredSession(); setToken(''); setSession(null); setSection('profile'); }} />
      <div className="mx-auto grid max-w-7xl gap-5 px-4 pb-28 pt-5 lg:grid-cols-[230px_1fr] lg:px-6">
        <SideNav section={section} setSection={setSection} />
        <section className="min-w-0">
          {toast ? <button onClick={() => setToast('')} className="mb-4 w-full rounded-3xl border border-[#ff1493]/30 bg-[#210d1d] px-5 py-3 text-left text-sm font-bold text-[#ffd7eb]">{toast}</button> : null}
          {loading ? <LoadingCard /> : null}
          {!loading && section === 'swipe' ? <SwipeScreen profile={activeProfile} onSwipe={handleSwipe} onReport={reportActiveProfile} /> : null}
          {!loading && section === 'likes' ? <LikesScreen profiles={profiles} onPick={(profile) => { setProfileIndex(Math.max(0, profiles.findIndex((item) => item.id === profile.id))); setSection('swipe'); }} /> : null}
          {!loading && section === 'chat' ? <ChatScreen messages={messages} text={messageText} setText={setMessageText} sendChat={sendChat} loadMessages={loadMessages} matchId={matchId} setMatchId={setMatchId} /> : null}
          {!loading && section === 'tokens' ? <TokenScreen token={token} setToast={setToast} /> : null}
          {!loading && section === 'safety' ? <SafetyScreen reportActiveProfile={reportActiveProfile} /> : null}
          {!loading && section === 'profile' ? <ProfileScreen token={token} setToken={setToken} session={session} reload={() => load(token)} /> : null}
        </section>
      </div>
      <FooterNav section={section} setSection={setSection} />
      <PolicyFooter />
    </main>
  );
}

function AppHeader({ signedIn, onLogin, onLogout }: { signedIn: boolean; onLogin: () => void; onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-black/70 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img src="/assets/romchat/icon.png" alt="RomChat" className="h-11 w-11 rounded-2xl object-cover" />
          <div>
            <p className="text-2xl font-black text-[#ff1493]">RomChat</p>
            <p className="text-xs font-bold text-white/60">Kenyan dating. Real chats.</p>
          </div>
        </Link>
        {signedIn ? <button onClick={onLogout} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-black"><LogOut size={16} /> Log out</button> : <button type="button" onClick={onLogin} className="inline-flex items-center gap-2 rounded-full bg-[#ff1493] px-4 py-2 text-sm font-black"><UserRound size={16} /> Login</button>}
      </div>
    </header>
  );
}

function SideNav({ section, setSection }: { section: AppSection; setSection: (value: AppSection) => void }) {
  const items: Array<[AppSection, any, string]> = [
    ['swipe', Heart, 'Swipe'],
    ['likes', Star, 'Likes'],
    ['chat', MessageCircle, 'Chat'],
    ['tokens', WalletCards, 'Tokens'],
    ['safety', Shield, 'Safety'],
    ['profile', UserRound, 'Profile'],
  ];
  return <aside className="hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-3 lg:block">{items.map(([key, Icon, label]) => <button key={key} onClick={() => setSection(key)} className={'mb-2 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-black ' + (section === key ? 'bg-[#ff1493] text-white' : 'text-white/70 hover:bg-white/10')}><Icon size={19} />{label}</button>)}</aside>;
}

function FooterNav({ section, setSection }: { section: AppSection; setSection: (value: AppSection) => void }) {
  const items: Array<[AppSection, any, string]> = [['swipe', Heart, 'Swipe'], ['likes', Star, 'Likes'], ['chat', MessageCircle, 'Chat'], ['tokens', WalletCards, 'Tokens'], ['profile', UserRound, 'Me']];
  return <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/90 px-2 pb-4 pt-2 backdrop-blur-xl lg:hidden"><div className="mx-auto flex max-w-xl justify-between">{items.map(([key, Icon, label]) => <button key={key} onClick={() => setSection(key)} className={'grid min-w-14 place-items-center rounded-2xl px-2 py-2 text-xs font-black ' + (section === key ? 'text-white' : 'text-white/50')}><Icon fill={section === key ? 'currentColor' : 'none'} size={22} />{label}</button>)}</div></nav>;
}

function SwipeScreen({ profile, onSwipe, onReport }: { profile: Profile | null; onSwipe: (action: 'pass' | 'like' | 'super_like') => void; onReport: () => void }) {
  if (!profile) return <EmptyState title="No live profiles yet" body="Complete your profile and refresh to load real RomChat members from the backend." />;
  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_320px]">
      <article className="relative min-h-[720px] overflow-hidden rounded-[36px] border border-[#ff1493]/20 bg-[#180a16]">
        <img src={imageFor(profile)} alt={nameFor(profile)} className="absolute inset-0 h-full w-full object-cover brightness-110 contrast-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <button onClick={onReport} className="absolute right-4 top-4 rounded-full bg-black/45 p-3 text-white backdrop-blur"><Flag size={20} /></button>
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black text-[#141016]">{profile.online ? 'Online now' : 'Recently active'} {profile.verified ? <BadgeCheck className="text-[#13caa8]" size={16} /> : null}</div>
          <h1 className="text-5xl font-black sm:text-7xl">{nameFor(profile)} {profile.age ? <span className="font-medium">{profile.age}</span> : null}</h1>
          <p className="mt-2 max-w-2xl text-lg font-bold text-white/85">{profile.city || 'Kenya'} · {profile.intent || profile.prompt || 'Ready to connect'}</p>
          {profile.bio ? <p className="mt-4 max-w-2xl text-base leading-7 text-white/80">{profile.bio}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">{interestsFor(profile).map((item) => <span key={item} className="rounded-full bg-[#ff1493] px-3 py-1 text-sm font-black">{item}</span>)}</div>
          <div className="mt-7 flex justify-center gap-4">
            <button onClick={() => onSwipe('pass')} className="grid h-16 w-16 place-items-center rounded-full bg-white/12 text-white ring-1 ring-white/15"><X size={30} /></button>
            <button onClick={() => onSwipe('super_like')} className="grid h-16 w-16 place-items-center rounded-full bg-[#152342] text-[#8fbbff] ring-1 ring-[#8fbbff]/25"><Star fill="currentColor" size={28} /></button>
            <button onClick={() => onSwipe('like')} className="grid h-20 w-20 place-items-center rounded-full bg-[#ff1493] text-white shadow-[0_20px_60px_rgba(255,20,147,.36)]"><Heart fill="currentColor" size={36} /></button>
          </div>
        </div>
      </article>
      <aside className="grid gap-4">
        <InfoCard icon={Sparkles} title="Real Kenyan profiles" body="Discovery is driven by saved backend profiles, gender preference, distance, age range, verification, and swipe history." />
        <InfoCard icon={Shield} title="Safer romance" body="Report or block suspicious members, and abusive chat is filtered before it damages the community." />
        <InfoCard icon={WalletCards} title="Tokens and premium" body="Buy KES token bundles for Super Likes, profile boosts, and premium discovery perks." />
      </aside>
    </section>
  );
}

function LikesScreen({ profiles, onPick }: { profiles: Profile[]; onPick: (profile: Profile) => void }) {
  return <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-5"><h1 className="text-4xl font-black">Likes and Top Picks</h1><p className="mt-2 text-white/60">Reveal one free like daily, review likes sent, and browse curated Top Picks.</p><div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{profiles.slice(0, 9).map((profile) => <button key={profile.id} onClick={() => onPick(profile)} className="group overflow-hidden rounded-[28px] border border-white/10 bg-black text-left"><img src={imageFor(profile)} alt={nameFor(profile)} className="h-72 w-full object-cover brightness-110 transition group-hover:scale-105" /><div className="p-4"><p className="text-xl font-black">{nameFor(profile)}, {profile.age || '?'}</p><p className="mt-1 text-sm text-white/60">{profile.city || 'Kenya'} · Top Pick</p></div></button>)}</div></section>;
}

function ChatScreen({ messages, text, setText, sendChat, loadMessages, matchId, setMatchId }: any) {
  return <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[#100a12]"><header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4"><div><h1 className="text-3xl font-black">Messages</h1><p className="text-sm text-white/60">Only mutual matches can chat.</p></div><div className="flex gap-2"><input value={matchId} onChange={(e) => setMatchId(e.target.value)} placeholder="match id" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm outline-none" /><button onClick={() => loadMessages()} className="rounded-full bg-white px-4 py-2 text-sm font-black text-black">Load</button></div></header><div className="min-h-[520px] p-4">{messages.length ? messages.map((message: any) => <div key={message.id || message.createdAt || message.text} className={'mb-3 flex ' + ((message.from === 'me' || message.senderId === 'me') ? 'justify-end' : 'justify-start')}><div className={'max-w-[78%] rounded-3xl px-4 py-3 leading-7 ' + ((message.from === 'me' || message.senderId === 'me') ? 'bg-[#ff1493]' : 'bg-white/10')}>{message.text}</div></div>) : <EmptyState title="Open a match" body="Accept a like or create a match from Swipe, then load the match to start chatting." />}</div><footer className="border-t border-white/10 p-4"><div className="mb-3 flex flex-wrap gap-2">{['Ask about coffee dates', 'Send a rose', 'Suggest Saturday coffee'].map((sample) => <button key={sample} onClick={() => sendChat(sample)} className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-white/75">{sample}</button>)}</div><div className="flex gap-3"><input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void sendChat(); }} placeholder="Write a respectful message" className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-5 py-3 outline-none focus:border-[#ff1493]" /><button onClick={() => sendChat()} className="rounded-full bg-[#ff1493] px-5 py-3 font-black">Send</button></div><p className="mt-3 text-xs text-white/45">If someone pressures you to share contacts or money, block and report them immediately.</p></footer></section>;
}

function TokenScreen({ token, setToast }: { token: string; setToast: (value: string) => void }) {
  const [provider, setProvider] = useState<'mpesa' | 'paystack'>('mpesa');
  const [phone, setPhone] = useState('');
  async function buy(packageId: string, purpose = 'tokens', planId: string | null = null) {
    try {
      const payment = await apiJson('/api/romchat/payments', { method: 'POST', body: JSON.stringify({ provider, phone, packageId, purpose, planId }) }, token);
      if (payment?.payment?.checkoutUrl) window.open(payment.payment.checkoutUrl, '_blank', 'noopener,noreferrer');
      setToast(payment?.payment?.instructions || 'Payment started.');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Payment failed.');
    }
  }
  return <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-5"><h1 className="text-4xl font-black">Buy tokens</h1><p className="mt-2 text-white/60">KES payments via M-Pesa or card checkout.</p><div className="mt-5 flex flex-wrap gap-3"><button onClick={() => setProvider('mpesa')} className={'rounded-full px-5 py-3 font-black ' + (provider === 'mpesa' ? 'bg-[#12c55b] text-black' : 'bg-white/10')}>M-Pesa</button><button onClick={() => setProvider('paystack')} className={'inline-flex items-center gap-2 rounded-full px-5 py-3 font-black ' + (provider === 'paystack' ? 'bg-white text-black' : 'bg-white/10')}><CreditCard size={18} /> Card</button><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="M-Pesa phone" className="rounded-full border border-white/10 bg-white/5 px-5 py-3 outline-none" /></div><div className="mt-6 grid gap-4 md:grid-cols-3">{[['tokens_100','100 tokens','KES 250'],['superlikes_15','15 Super Likes','KES 3,000'],['superlikes_30','30 Super Likes','KES 4,500']].map(([id,title,price]) => <div key={id} className="rounded-[28px] border border-white/10 bg-black/30 p-5"><p className="text-2xl font-black">{title}</p><p className="mt-2 text-[#ffd700]">{price}</p><button onClick={() => buy(id)} className="mt-5 w-full rounded-full bg-[#ff1493] px-5 py-3 font-black">Select</button></div>)}</div><div className="mt-4 rounded-[28px] border border-[#ffd700]/30 bg-[#ffd700]/10 p-5"><h2 className="text-2xl font-black text-[#ffd700]">RomChat Platinum</h2><p className="mt-2 text-white/70">KES 2,400/month for unlimited likes, priority discovery, Top Picks, and premium visibility.</p><button onClick={() => buy('tokens_100', 'subscription', 'platinum')} className="mt-5 rounded-full bg-white px-6 py-3 font-black text-black">Choose Platinum</button></div></section>;
}

function SafetyScreen({ reportActiveProfile }: { reportActiveProfile: () => void }) {
  return <section className="grid gap-5 xl:grid-cols-[1fr_360px]"><div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6"><h1 className="text-4xl font-black">Safety and moderation</h1><p className="mt-3 max-w-3xl leading-7 text-white/65">RomChat blocks abusive, sexual harassment, racial slurs, threats, spam, and suspicious money requests. Reports include message evidence for admin review, and blocked users can appeal.</p><div className="mt-6 grid gap-3">{['Block abusive users', 'Report suspicious messages', 'Appeals reviewed by admins', 'Keep early chats inside RomChat', 'Never send money to a match'].map((item) => <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 font-bold"><Check className="text-[#12c55b]" />{item}</div>)}</div></div><div className="rounded-[32px] border border-[#ff6f61]/30 bg-[#ff6f61]/10 p-6"><AlertTriangle className="text-[#ffb3aa]" /><h2 className="mt-4 text-2xl font-black">Report current profile</h2><p className="mt-2 text-white/70">Use this if the active profile is abusive, fake, spammy, or unsafe.</p><button onClick={reportActiveProfile} className="mt-5 rounded-full bg-[#ff6f61] px-5 py-3 font-black">Block and report</button></div></section>;
}

function ProfileScreen({ token, setToken, session, reload }: { token: string; setToken: (value: string) => void; session: Session | null; reload: () => void }) {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'otp' | 'forgot' | 'reset'>(token ? 'login' : 'login');
  const [email, setEmail] = useState(session?.user?.email || '');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [displayName, setDisplayName] = useState(session?.profile?.displayName || session?.user?.name || '');
  const [age, setAge] = useState(String(session?.profile?.age || ''));
  const [gender, setGender] = useState(session?.profile?.gender || 'male');
  const [city, setCity] = useState(session?.profile?.city || 'Nairobi');
  const [intent, setIntent] = useState(session?.profile?.intent || intentions[0]);
  const [bio, setBio] = useState(session?.profile?.bio || '');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(session?.profile?.interests || []);
  const [status, setStatus] = useState('');
  const fileInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authCode = params.get('authCode') || params.get('code');
    const authError = params.get('authError');
    if (authError) {
      setStatus('Google sign-in failed: ' + authError);
      return;
    }
    if (!authCode || token) return;
    let cancelled = false;
    async function exchangeGoogleCode() {
      try {
        console.info('[romchat-google-web] exchange:start');
        const data = await apiJson('/api/auth/google/exchange', {
          method: 'POST',
          body: JSON.stringify({ code: authCode }),
        });
        if (cancelled) return;
        storeToken(data.token);
        setToken(data.token);
        setStatus('Google login successful. Complete or update your profile.');
        window.history.replaceState({}, '', '/profile');
        await reload();
      } catch (error) {
        if (!cancelled) setStatus(error instanceof Error ? error.message : 'Google login failed.');
      }
    }
    void exchangeGoogleCode();
    return () => { cancelled = true; };
  }, [reload, setToken, token]);

  async function authSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      if (authMode === 'login') {
        const data = await apiJson('/api/romchat/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
        storeToken(data.token); setToken(data.token); setStatus('Logged in.'); await reload();
      } else if (authMode === 'signup') {
        const data = await apiJson('/api/romchat/auth/request-otp', { method: 'POST', body: JSON.stringify({ email, password, name: displayName }) });
        setStatus(data.message || 'OTP sent.'); setAuthMode('otp');
      } else if (authMode === 'otp') {
        const data = await apiJson('/api/romchat/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) });
        storeToken(data.token); setToken(data.token); setStatus('Email verified. Complete your profile.'); await reload();
      } else if (authMode === 'forgot') {
        const data = await apiJson('/api/romchat/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
        setStatus(data.message || 'Reset code sent.'); setAuthMode('reset');
      } else {
        const data = await apiJson('/api/romchat/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, code: otp, password }) });
        storeToken(data.token); setToken(data.token); setStatus('Password reset.'); await reload();
      }
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Action failed.'); }
  }

  async function saveProfile() {
    try {
      await apiJson('/api/romchat/profile', { method: 'PATCH', body: JSON.stringify({ displayName, age: Number(age), gender, city, intent, bio, interests: selectedInterests }) }, token);
      setStatus('Profile saved.'); await reload();
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Profile save failed.'); }
  }

  async function uploadImage(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await apiJson('/api/romchat/profile/media', { method: 'POST', body: JSON.stringify({ mediaType: 'image', contentType: file.type, fileName: file.name, dataUri: reader.result }) }, token);
        setStatus('Image uploaded.'); await reload();
      } catch (error) { setStatus(error instanceof Error ? error.message : 'Upload failed.'); }
    };
    reader.readAsDataURL(file);
  }

  async function requestDeletion() {
    await apiJson('/api/romchat/auth/account/deletion-request', { method: 'POST', body: JSON.stringify({ reason: 'Requested from RomChat web.' }) }, token);
    setStatus('Data deletion request submitted.');
  }

  async function deleteAccount() {
    if (!confirm('Delete your RomChat account permanently?')) return;
    await apiJson('/api/romchat/auth/account', { method: 'DELETE' }, token);
    clearStoredSession(); setToken(''); setStatus('Account deleted.'); location.href = '/login?deleted=1';
  }

  return <section id="profile" className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]"><form onSubmit={authSubmit} className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6"><h1 className="text-4xl font-black">Login or create account</h1><p className="mt-2 text-white/60">Use Google or email verification, then complete your Kenyan dating profile.</p><div className="mt-5"><CustomGoogleButtonLogin returnTo="/login" className="inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white px-5 py-3 font-black text-[#120914] shadow-lg transition hover:scale-[1.01] disabled:opacity-60" /></div><div className="my-5 flex items-center gap-3 text-xs font-black uppercase tracking-[0.16em] text-white/35"><span className="h-px flex-1 bg-white/10" />or use email<span className="h-px flex-1 bg-white/10" /></div><div className="mt-5 grid gap-3"><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none" /><input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none" /><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none" />{['otp','reset'].includes(authMode) ? <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="OTP / reset code" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none" /> : null}<button className="rounded-2xl bg-[#ff1493] px-5 py-3 font-black">{authMode === 'login' ? 'Login' : authMode === 'signup' ? 'Send OTP' : authMode === 'forgot' ? 'Send reset email' : authMode === 'reset' ? 'Reset password' : 'Verify email'}</button></div><div className="mt-4 flex flex-wrap gap-2 text-sm font-bold text-white/70">{(['login','signup','forgot'] as const).map((mode) => <button type="button" key={mode} onClick={() => setAuthMode(mode)} className="rounded-full bg-white/10 px-3 py-2 capitalize">{mode === 'forgot' ? 'Forgot password' : mode}</button>)}</div>{status ? <p className="mt-4 rounded-2xl bg-white/10 p-3 text-sm text-white/80">{status}</p> : null}</form><div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6"><h2 className="text-3xl font-black">Profile builder</h2><div className="mt-5 grid gap-3 md:grid-cols-2"><input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none" /><input value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none" /><select value={gender} onChange={(e) => setGender(e.target.value)} className="rounded-2xl border border-white/10 bg-[#170b15] px-4 py-3 outline-none"><option value="male">Male</option><option value="female">Female</option></select><input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none" /></div><select value={intent} onChange={(e) => setIntent(e.target.value)} className="mt-3 w-full rounded-2xl border border-white/10 bg-[#170b15] px-4 py-3 outline-none">{intentions.map((item) => <option key={item}>{item}</option>)}</select><textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short Kenyan romance bio" className="mt-3 min-h-28 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none" /><div className="mt-3 flex flex-wrap gap-2">{interests.map((item) => <button type="button" key={item} onClick={() => setSelectedInterests((items) => items.includes(item) ? items.filter((x) => x !== item) : [...items, item].slice(0, 8))} className={'rounded-full px-3 py-2 text-sm font-bold ' + (selectedInterests.includes(item) ? 'bg-[#ff1493]' : 'bg-white/10')}>{item}</button>)}</div><div className="mt-5 rounded-[24px] border border-dashed border-[#ff1493]/40 p-5"><input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e.target.files?.[0])} /><button onClick={() => fileInput.current?.click()} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-black text-black"><ImagePlus /> Upload profile image</button><p className="mt-2 text-sm text-white/55">Upload at least one photo to appear in discovery.</p></div><div className="mt-5 flex flex-wrap gap-3"><button onClick={saveProfile} className="rounded-full bg-[#ff1493] px-6 py-3 font-black">Save profile</button><button onClick={requestDeletion} className="rounded-full border border-white/10 px-6 py-3 font-black">Request data deletion</button><button onClick={deleteAccount} className="inline-flex items-center gap-2 rounded-full bg-[#ff6f61] px-6 py-3 font-black"><Trash2 size={18} /> Delete account</button></div></div></section>;
}

function LoadingCard() { return <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-8 text-center"><div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-[#ff1493]" /><p className="mt-4 font-black">Loading RomChat web...</p></div>; }
function EmptyState({ title, body }: { title: string; body: string }) { return <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-8 text-center"><Heart className="mx-auto text-[#ff1493]" /><h2 className="mt-3 text-3xl font-black">{title}</h2><p className="mx-auto mt-2 max-w-lg text-white/60">{body}</p></div>; }
function InfoCard({ icon: Icon, title, body }: any) { return <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5"><Icon className="text-[#ff1493]" /><h3 className="mt-3 text-2xl font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-white/60">{body}</p></div>; }

function PolicyFooter() {
  const links = [
    ['/privacy', 'Privacy Policy'],
    ['/terms', 'Terms of Use'],
    ['/anti-spam-policy', 'Anti-Spam Policy'],
    ['/complaints-feedback', 'Complaints & Feedback'],
    ['/refunds', 'Refund & Cancellation Policy'],
    ['/fulfillment', 'Fulfillment & Delivery Policy'],
    ['/payment-flow', 'How Payments Work'],
    ['/delete-account', 'Delete Account'],
  ];
  return <footer className="border-t border-white/10 bg-black px-4 py-8 pb-28 text-white/60 lg:pb-8"><div className="mx-auto max-w-7xl"><p className="text-lg font-black text-white">RomChat</p><p className="mt-2 max-w-2xl text-sm">Kenyan dating and chatting with privacy-first profiles, paid tokens, community safety, and clear account controls.</p><div className="mt-5 flex flex-wrap gap-4 text-sm font-bold">{links.map(([href,label]) => <Link key={href} href={href} className="hover:text-[#ff1493]">{label}</Link>)}</div></div></footer>;
}
