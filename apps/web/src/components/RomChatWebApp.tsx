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
  Lock,
  Map,
  Images,
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
import CustomGoogleButtonLogin from './auth/CustomGoogleButtonLogin';

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

function resolveMediaUrl(url?: string) {
  if (!url) return '';

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${apiBase()}${url.startsWith('/') ? url : `/${url}`}`;
}

const imageFor = (profile?: Profile | null) => {
  const url = first(
    profile?.media?.find((item) => item.mediaType !== 'voice')?.url,
    profile?.photos?.[0],
    profile?.photoUrl,
    profile?.image
  );

  return url
    ? resolveMediaUrl(url)
    : '/assets/romchat/icon.png';
};

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

const intentions = [
  'Serious relationship',
  'Life partner',
  'Marriage minded',
  'Intentional connection',
  'Long-term, open to short',
  'Short-term, open to long',
  'New friends first',
  'Slow dating',
  'Christian dating',
  'Muslim dating',
  'Single parent dating',
  'Travel romance',
  'Casual dates',
  'Still figuring it out',
];

const interests = [
  'Coffee dates', 'Dinner dates', 'Brunch', 'Road trips', 'Beach weekends', 'Karura walks', 'Nairobi nightlife', 'Mombasa coast',
  'Live music', 'Afrobeats', 'Bongo', 'Amapiano', 'Sauti Sol', 'Karaoke', 'Dancing', 'Concerts',
  'Movies', 'Netflix nights', 'K-dramas', 'Comedy shows', 'Theatre', 'Photography', 'Content creation', 'Fashion',
  'Gym', 'Running', 'Hiking', 'Cycling', 'Yoga', 'Football', 'Rugby', 'Swimming', 'Wellness',
  'Cooking', 'Baking', 'Foodie', 'Street food', 'Nyama choma', 'Sushi', 'Wine tasting', 'Mocktails',
  'Travel', 'Staycations', 'Safari', 'Camping', 'Picnics', 'Sunsets', 'Lake views', 'Adventure',
  'Books', 'Poetry', 'Podcasts', 'Tech', 'Startups', 'Business', 'Investing', 'Volunteering',
  'Church', 'Mosque', 'Family time', 'Parenting', 'Pets', 'Board games', 'Gaming', 'Art galleries',
];

const profilePromptTemplates = [
  'My ideal Kenyan date is',
  'Green flags I notice fast',
  'A song that explains my vibe',
  'Two truths and a soft secret',
  'The food date I will never reject',
  'How I show care',
  'What I am ready to build',
];

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
  const [blockedProfileIds, setBlockedProfileIds] = useState<string[]>([]);
  const [reportTarget, setReportTarget] = useState<Profile | null>(null);
  const [reportReason, setReportReason] = useState('Fake profile');
  const [reportDetails, setReportDetails] = useState('');
  const [reportBusy, setReportBusy] = useState(false);

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

  const visibleProfiles = profiles.filter((profile) => !blockedProfileIds.includes(profile.id));
  const activeProfile = visibleProfiles[profileIndex] || null;
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
      setProfileIndex((value) => Math.min(value + 1, Math.max(0, visibleProfiles.length - 1)));
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

  function reportActiveProfile() {
    if (!activeProfile) {
      setToast('No profile is selected.');
      return;
    }
    if (!signedIn) {
      setSection('profile');
      setToast('Login before reporting or blocking a profile.');
      return;
    }
    setReportTarget(activeProfile);
    setReportReason('Fake profile');
    setReportDetails('');
  }

  async function submitProfileReport(blockUser = true) {
    if (!reportTarget || !token) return;
    try {
      setReportBusy(true);
      const target = reportTarget;
      await apiJson('/api/romchat/reports', {
        method: 'POST',
        body: JSON.stringify({
          profileId: target.id,
          reportedMemberId: (target as any).memberId || (target as any).member_id || target.id,
          type: reportReason,
          severity: reportReason === 'Threats or violence' || reportReason === 'Sexual harassment' ? 'high' : 'medium',
          autoBlock: blockUser,
          reporterNote: reportDetails.trim() || `Reported from RomChat web: ${reportReason}`,
          evidence: {
            source: 'web_profile',
            profileId: target.id,
            displayName: nameFor(target),
            city: target.city || null,
          },
        }),
      }, token);

      if (blockUser) {
        setBlockedProfileIds((ids) => ids.includes(target.id) ? ids : [...ids, target.id]);
        setProfiles((items) => items.filter((item) => item.id !== target.id));
        setProfileIndex(0);
        setToast(`${nameFor(target)} was blocked and reported to RomChat Safety.`);
      } else {
        setToast(`Report submitted for ${nameFor(target)}.`);
      }
      setReportTarget(null);
      setReportDetails('');
      await load(token);
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Unable to submit the safety report.');
    } finally {
      setReportBusy(false);
    }
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
          {!loading && section === 'likes' ? <LikesScreen profiles={visibleProfiles} onPick={(profile) => { setProfileIndex(Math.max(0, visibleProfiles.findIndex((item) => item.id === profile.id))); setSection('swipe'); }} /> : null}
          {!loading && section === 'chat' ? <ChatScreen messages={messages} text={messageText} setText={setMessageText} sendChat={sendChat} loadMessages={loadMessages} matchId={matchId} setMatchId={setMatchId} /> : null}
          {!loading && section === 'tokens' ? <TokenScreen token={token} setToast={setToast} /> : null}
          {!loading && section === 'safety' ? <SafetyScreen reportActiveProfile={reportActiveProfile} /> : null}
          {!loading && section === 'profile' ? <ProfileScreen token={token} setToken={setToken} session={session} reload={(authToken) => load(authToken ?? token)} /> : null}
        </section>
      </div>
      <ReportProfileModal
        profile={reportTarget}
        reason={reportReason}
        setReason={setReportReason}
        details={reportDetails}
        setDetails={setReportDetails}
        busy={reportBusy}
        onClose={() => { if (!reportBusy) setReportTarget(null); }}
        onReportOnly={() => void submitProfileReport(false)}
        onBlockAndReport={() => void submitProfileReport(true)}
      />
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
  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6">
        <h1 className="text-4xl font-black">Safety and moderation</h1>
        <p className="mt-3 max-w-3xl leading-7 text-white/65">
          Use Block & Report when a profile is fake, abusive, threatening, sexually harassing, scam-related, underage, or otherwise unsafe.
        </p>
        <div className="mt-6 grid gap-3">
          {[
            'Blocked profiles are removed from your discovery list',
            'Reports include a reason and optional details',
            'High-risk reports are marked high severity',
            'Block & Report requests backend auto-blocking',
            'Report only sends the case without blocking',
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 font-bold">
              <Check className="text-[#12c55b]" />{item}
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-[32px] border border-[#ff6f61]/30 bg-[#ff6f61]/10 p-6">
        <AlertTriangle className="text-[#ffb3aa]" />
        <h2 className="mt-4 text-2xl font-black">Block or report current profile</h2>
        <p className="mt-2 text-white/70">Choose a reason, add optional details, then report or block and report.</p>
        <button onClick={reportActiveProfile} className="mt-5 w-full rounded-full bg-[#ff6f61] px-5 py-3 font-black">Open safety report</button>
      </div>
    </section>
  );
}

function ReportProfileModal({ profile, reason, setReason, details, setDetails, busy, onClose, onReportOnly, onBlockAndReport }: {
  profile: Profile | null;
  reason: string;
  setReason: (value: string) => void;
  details: string;
  setDetails: (value: string) => void;
  busy: boolean;
  onClose: () => void;
  onReportOnly: () => void;
  onBlockAndReport: () => void;
}) {
  if (!profile) return null;
  const reasons = ['Fake profile','Scam or money request','Harassment or bullying','Sexual harassment','Threats or violence','Hate or discriminatory content','Underage user','Spam','Other safety concern'];
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-[32px] border border-[#ff6f61]/30 bg-[#160c14] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={imageFor(profile)} alt={nameFor(profile)} className="h-14 w-14 rounded-2xl object-cover" />
            <div><p className="text-xs font-black uppercase tracking-[0.15em] text-[#ff9d94]">RomChat Safety</p><h2 className="text-2xl font-black">Report {nameFor(profile)}</h2></div>
          </div>
          <button type="button" disabled={busy} onClick={onClose} className="rounded-full bg-white/10 p-2 disabled:opacity-50"><X size={20} /></button>
        </div>
        <label className="mt-6 block text-sm font-black text-white/80">Reason</label>
        <select value={reason} onChange={(e) => setReason(e.target.value)} disabled={busy} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#21121d] px-4 py-3 outline-none">
          {reasons.map((item) => <option key={item}>{item}</option>)}
        </select>
        <label className="mt-4 block text-sm font-black text-white/80">What happened? <span className="font-medium text-white/40">(optional)</span></label>
        <textarea value={details} onChange={(e) => setDetails(e.target.value)} disabled={busy} maxLength={1200} placeholder="Add details for the RomChat safety team." className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none" />
        <p className="mt-2 text-xs text-white/40">{details.length}/1200</p>
        <div className="mt-5 rounded-2xl border border-[#ffd700]/20 bg-[#ffd700]/5 p-4 text-sm leading-6 text-white/70">
          <strong className="text-[#ffd700]">Block & Report:</strong> submits the report, requests backend auto-blocking, and removes this profile from your current web discovery immediately.
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button type="button" disabled={busy} onClick={onReportOnly} className="rounded-full border border-white/15 px-5 py-3 font-black disabled:opacity-50">{busy ? 'Submitting…' : 'Report only'}</button>
          <button type="button" disabled={busy} onClick={onBlockAndReport} className="rounded-full bg-[#ff6f61] px-5 py-3 font-black disabled:opacity-50">{busy ? 'Submitting…' : 'Block & Report'}</button>
        </div>
      </div>
    </div>
  );
}

function ProfileScreen({ token, setToken, session, reload }: { token: string; setToken: (value: string) => void; session: Session | null; reload: (authToken?: string) => void }) {
  const profile = session?.profile || null;
  const account = session?.user || null;
  const signedIn = Boolean(token && account);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'otp' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState(account?.email || '');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [displayName, setDisplayName] = useState(profile?.displayName || account?.name || '');
  const [age, setAge] = useState(String(profile?.age || ''));
  const [gender, setGender] = useState(profile?.gender || 'female');
  const [city, setCity] = useState(profile?.city || '');
  const [intent, setIntent] = useState(profile?.intent || 'Serious relationship');
  const [bio, setBio] = useState(profile?.bio || '');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(profile?.interests || []);
  const [detailsNotice, setDetailsNotice] = useState('');
  const [status, setStatus] = useState('');
  const [distanceKm, setDistanceKm] = useState(Number(profile?.maxDistanceKm || 80));
  const [minAge, setMinAge] = useState(Number(profile?.minAge || 18));
  const [maxAge, setMaxAge] = useState(Number(profile?.maxAge || 80));
  const [mapEnabled, setMapEnabled] = useState(profile?.mapDiscoveryEnabled !== false);
  const [promptAnswers, setPromptAnswers] = useState<Array<{ prompt: string; answer: string }>>(
    profilePromptTemplates.map((prompt, index) => ({ prompt, answer: profile?.promptAnswers?.[index]?.answer || '' }))
  );
  const fileInput = useRef<HTMLInputElement | null>(null);
  const selfieInput = useRef<HTMLInputElement | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [busy, setBusy] = useState(false);

  const photoMedia = (Array.isArray(profile?.media) ? profile.media : [])
    .filter((item: any) => item?.mediaType === 'image' && item?.url)
    .sort((a: any, b: any) => Number(a?.position || 0) - Number(b?.position || 0));
  const imageCount = Number(profile?.imageCount ?? photoMedia.length ?? 0);
  const catalogueAccess = Math.min(6, Math.max(1, imageCount));
  const completePrompts = promptAnswers.filter((item) => item.prompt && item.answer.trim()).length;
  const computedStrength = Number(profile?.profileStrength || Math.min(100, 35 + Math.min(imageCount, 6) * 7 + selectedInterests.length * 2 + completePrompts * 3 + (bio.trim() ? 8 : 0)));
  const incognito = Boolean(profile?.incognito);

  useEffect(() => {
    if (!profile && !account) return;
    setEmail(account?.email || '');
    setDisplayName(profile?.displayName || account?.name || '');
    setAge(String(profile?.age || ''));
    setGender(profile?.gender || 'female');
    setCity(profile?.city || '');
    setIntent(profile?.intent || 'Serious relationship');
    setBio(profile?.bio || '');
    setSelectedInterests(Array.isArray(profile?.interests) ? profile.interests : []);
    setDistanceKm(Number(profile?.maxDistanceKm || 80));
    setMinAge(Number(profile?.minAge || 18));
    setMaxAge(Number(profile?.maxAge || 80));
    setMapEnabled(profile?.mapDiscoveryEnabled !== false);
    setPromptAnswers(profilePromptTemplates.map((prompt, index) => ({ prompt, answer: profile?.promptAnswers?.[index]?.answer || '' })));
  }, [account?.email, account?.name, profile?.memberId, profile?.updatedAt]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

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
        const data = await apiJson('/api/auth/google/exchange', { method: 'POST', body: JSON.stringify({ code: authCode }) });
        if (cancelled) return;
        storeToken(data.token);
        setToken(data.token);
        setStatus('Google login successful. Complete or update your profile.');
        window.history.replaceState({}, '', '/profile');
        await reload(data.token);
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
      setBusy(true);
      if (authMode === 'login') {
        const data = await apiJson('/api/romchat/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
        storeToken(data.token); setToken(data.token); setStatus('Logged in.'); await reload(data.token);
      } else if (authMode === 'signup') {
        const data = await apiJson('/api/romchat/auth/request-otp', { method: 'POST', body: JSON.stringify({ email, password, name: displayName }) });
        setStatus(data.message || 'OTP sent.'); setAuthMode('otp');
      } else if (authMode === 'otp') {
        const data = await apiJson('/api/romchat/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) });
        storeToken(data.token); setToken(data.token); setStatus('Email verified. Complete your profile.'); await reload(data.token);
      } else if (authMode === 'forgot') {
        const data = await apiJson('/api/romchat/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
        setStatus(data.message || 'Reset code sent.'); setAuthMode('reset');
      } else {
        const data = await apiJson('/api/romchat/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, code: otp, password }) });
        storeToken(data.token); setToken(data.token); setStatus('Password reset.'); await reload(data.token);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Action failed.');
    } finally {
      setBusy(false);
    }
  }

  function selectImage(file?: File) {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setStatus('Please select an image file.');
    if (file.size > 8 * 1024 * 1024) return setStatus('Image must be smaller than 8 MB.');
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setSelectedImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setStatus('Photo selected. Save profile to upload it.');
  }

  async function fileToDataUri(file: File) {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Unable to read selected image.'));
      reader.onerror = () => reject(new Error('Unable to read selected image.'));
      reader.readAsDataURL(file);
    });
  }

  async function uploadSelectedImage() {
    if (!selectedImageFile) return null;
    setUploadingImage(true);
    try {
      const dataUri = await fileToDataUri(selectedImageFile);
      return await apiJson('/api/romchat/profile/media', {
        method: 'POST',
        body: JSON.stringify({ mediaType: 'image', contentType: selectedImageFile.type, fileName: selectedImageFile.name, dataUri }),
      }, token);
    } finally {
      setUploadingImage(false);
    }
  }

  async function saveProfileDetails() {
    if (!token) return setStatus('Please login before saving your profile.');
    if (!displayName.trim()) return setDetailsNotice('Add a display name.');
    if (!gender.trim()) return setDetailsNotice('Choose your gender.');
    if (!city.trim()) return setDetailsNotice('Add your city.');
    if (!intent.trim()) return setDetailsNotice('Choose your dating intention.');
    if (!selectedInterests.length) return setDetailsNotice('Pick at least one interest.');
    if (!bio.trim()) return setDetailsNotice('Write a short bio.');
    try {
      setBusy(true);
      setDetailsNotice('');
      setStatus('Saving profile...');
      await apiJson('/api/romchat/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          displayName,
          age: Number(profile?.age || age),
          gender,
          city,
          intent,
          bio,
          interests: selectedInterests,
          promptAnswers,
          maxDistanceKm: distanceKm,
          minAge,
          maxAge,
          mapDiscoveryEnabled: mapEnabled,
        }),
      }, token);
      if (selectedImageFile) {
        setStatus('Uploading profile photo...');
        await uploadSelectedImage();
      }
      setSelectedImageFile(null);
      if (imagePreviewUrl) { URL.revokeObjectURL(imagePreviewUrl); setImagePreviewUrl(''); }
      if (fileInput.current) fileInput.current.value = '';
      setStatus('Profile saved.');
      await reload(token);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Profile save failed.');
    } finally {
      setBusy(false);
    }
  }

  async function saveDiscoverySettings() {
    if (!token) return;
    try {
      setBusy(true);
      await apiJson('/api/romchat/profile', {
        method: 'PATCH',
        body: JSON.stringify({ displayName, age: Number(profile?.age || age), gender, city, intent, bio, interests: selectedInterests, promptAnswers, maxDistanceKm: distanceKm, minAge, maxAge, mapDiscoveryEnabled: mapEnabled }),
      }, token);
      setStatus('Distance preferences applied.');
      await reload(token);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to save distance settings.');
    } finally { setBusy(false); }
  }

  async function savePrompts() {
    if (!token) return;
    try {
      setBusy(true);
      await apiJson('/api/romchat/profile', {
        method: 'PATCH',
        body: JSON.stringify({ displayName, age: Number(profile?.age || age), gender, city, intent, bio, interests: selectedInterests, promptAnswers, maxDistanceKm: distanceKm, minAge, maxAge, mapDiscoveryEnabled: mapEnabled }),
      }, token);
      setStatus('7 profile prompts saved.');
      await reload(token);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to save prompts.');
    } finally { setBusy(false); }
  }

  async function setMainPhoto(mediaId?: string) {
    if (!mediaId || !token) return;
    try {
      setBusy(true);
      await apiJson('/api/romchat/profile/media/' + encodeURIComponent(mediaId) + '/main', { method: 'PATCH' }, token);
      setStatus('Main profile photo updated.');
      await reload(token);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to update main photo.');
    } finally { setBusy(false); }
  }

  async function verifySelfie(file?: File) {
    if (!file || !token) return;
    try {
      setBusy(true);
      setStatus('Submitting selfie verification...');
      const dataUri = await fileToDataUri(file);
      await apiJson('/api/romchat/profile/selfie-verification', {
        method: 'POST',
        body: JSON.stringify({ dataUri, contentType: file.type || 'image/jpeg', fileName: file.name || 'selfie-verification.jpg' }),
      }, token);
      if (selfieInput.current) selfieInput.current.value = '';
      setStatus('Selfie verification submitted.');
      await reload(token);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to verify selfie.');
    } finally { setBusy(false); }
  }

  async function requestDeletion() {
    try {
      setBusy(true);
      await apiJson('/api/romchat/auth/account/deletion-request', { method: 'POST', body: JSON.stringify({ reason: 'Requested from RomChat web.' }) }, token);
      setStatus('Data deletion request submitted.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Unable to request deletion.'); }
    finally { setBusy(false); }
  }

  async function deleteAccount() {
    if (!confirm('Delete your RomChat account permanently?')) return;
    try {
      setBusy(true);
      await apiJson('/api/romchat/auth/account', { method: 'DELETE' }, token);
      clearStoredSession(); setToken(''); setStatus('Account deleted.'); location.href = '/login?deleted=1';
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Unable to delete account.'); }
    finally { setBusy(false); }
  }

  function signOut() {
    clearStoredSession();
    setToken('');
    location.href = '/profile';
  }

  const profileTasks = [
    [`Images uploaded: ${imageCount}`, imageCount >= 3 ? 'Fuller catalogues unlocked' : 'Add photos to unlock more galleries'],
    [`Catalogue access: ${catalogueAccess} photos`, incognito ? 'Visible after like' : 'Discovery ready'],
    ['Answer 7 prompts', completePrompts === 7 ? 'All prompts live' : `${completePrompts}/7 prompts answered`],
    ['Selfie verification', profile?.selfieVerified ? 'Verified badge active' : 'Verify with a live selfie'],
  ];

  if (!signedIn) {
    return (
      <section id="profile" className="mx-auto max-w-2xl">
        <form onSubmit={authSubmit} className="rounded-[28px] border border-[#ff1493]/20 bg-[#1E1222] p-5 sm:p-7">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-[#ff1493]">RomChat account</p>
          <h1 className="text-3xl font-black sm:text-4xl">Login or create account</h1>
          <p className="mt-2 font-bold leading-6 text-white/65">Use Google or email verification, then complete your Kenyan dating profile.</p>
          <div className="mt-5"><CustomGoogleButtonLogin className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 py-3 font-black text-[#120914] disabled:opacity-60" /></div>
          <div className="my-5 flex items-center gap-3 text-xs font-black uppercase tracking-[0.16em] text-white/35"><span className="h-px flex-1 bg-white/10" />or use email<span className="h-px flex-1 bg-white/10" /></div>
          <div className="grid gap-3">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="min-h-[52px] rounded-2xl border border-[#ff1493]/20 bg-[#170d1b] px-4 py-3 font-bold outline-none focus:border-[#ff1493]" />
            {authMode === 'signup' ? <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name" className="min-h-[52px] rounded-2xl border border-[#ff1493]/20 bg-[#170d1b] px-4 py-3 font-bold outline-none focus:border-[#ff1493]" /> : null}
            {['login','signup','reset'].includes(authMode) ? <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder={authMode === 'reset' ? 'New password' : 'Password'} className="min-h-[52px] rounded-2xl border border-[#ff1493]/20 bg-[#170d1b] px-4 py-3 font-bold outline-none focus:border-[#ff1493]" /> : null}
            {['otp','reset'].includes(authMode) ? <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="OTP / reset code" className="min-h-[52px] rounded-2xl border border-[#ff1493]/20 bg-[#170d1b] px-4 py-3 font-bold outline-none focus:border-[#ff1493]" /> : null}
            <button disabled={busy} className="rounded-2xl bg-[#ff1493] px-5 py-3 font-black disabled:opacity-50">{busy ? 'Please wait...' : authMode === 'login' ? 'Login' : authMode === 'signup' ? 'Send OTP' : authMode === 'forgot' ? 'Send reset email' : authMode === 'reset' ? 'Reset password' : 'Verify email'}</button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-sm font-bold text-white/70">{(['login','signup','forgot'] as const).map((mode) => <button type="button" key={mode} onClick={() => setAuthMode(mode)} className="rounded-full bg-white/10 px-3 py-2 capitalize">{mode === 'forgot' ? 'Forgot password' : mode}</button>)}</div>
          {status ? <p className="mt-4 rounded-2xl bg-white/10 p-3 text-sm font-bold text-white/80">{status}</p> : null}
        </form>
      </section>
    );
  }

  return (
    <section id="profile" className="mx-auto max-w-4xl space-y-4 pb-6">
      <div className="rounded-[24px] border border-[#ff1493]/20 bg-[#1E1222] p-[18px]">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-[#ff1493]">{account?.email || status || 'RomChat profile'}</p>
        <h1 className="mb-2 text-[27px] font-black leading-tight">{profile?.displayName || account?.name || 'Kenyan profile & vibe'}</h1>
        <p className="font-bold text-white/70">{profile?.city ? `${profile.city} - ${profile.intent || 'Intentional connection'}` : status}</p>
        <p className="mt-5 text-sm font-black text-[#ffd700]">{computedStrength}% complete</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#ff1493] transition-all" style={{ width: `${Math.min(100, computedStrength)}%` }} /></div>

        <div className="mt-5 rounded-[22px] border border-white/10 bg-[#170d1b] p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1"><h2 className="font-black text-white">Profile details</h2><p className="mt-1 text-xs font-bold leading-5 text-white/55">Age is locked after creation. Everything else stays editable.</p></div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#ffd700] px-3 py-2 text-sm font-black text-[#120914]"><Lock size={14} />{profile?.age || '--'}</div>
          </div>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name" className="mb-3 min-h-[52px] w-full rounded-[18px] border border-[#ff1493]/20 bg-[#1E1222] px-4 py-3 font-bold outline-none focus:border-[#ff1493]" />
          {profile?.age ? <div className="mb-3 flex items-center justify-between rounded-[18px] border border-white/10 bg-black/10 px-4 py-3"><div><p className="text-xs font-black uppercase text-white/45">Age</p><p className="mt-1 font-black">{profile.age} years</p></div><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/60">Locked</span></div> : <input value={age} onChange={(e) => setAge(e.target.value)} inputMode="numeric" placeholder="Age" className="mb-3 min-h-[52px] w-full rounded-[18px] border border-[#ff1493]/20 bg-[#1E1222] px-4 py-3 font-bold outline-none focus:border-[#ff1493]" />}
          <div className="mb-3 grid grid-cols-2 gap-2">{['female','male'].map((item) => <button type="button" key={item} disabled={busy} onClick={() => setGender(item)} className={'rounded-2xl border px-4 py-3 font-black capitalize ' + (gender === item ? 'border-[#ffd700] bg-[#ffd700] text-[#120914]' : 'border-[#ff1493]/20 bg-[#1E1222] text-white')}>{item}</button>)}</div>
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="mb-3 min-h-[52px] w-full rounded-[18px] border border-[#ff1493]/20 bg-[#1E1222] px-4 py-3 font-bold outline-none focus:border-[#ff1493]" />
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short Kenyan romance bio" className="min-h-24 w-full resize-y rounded-[18px] border border-[#ff1493]/20 bg-[#1E1222] px-4 py-3 font-bold outline-none focus:border-[#ff1493]" />
        </div>

        <div className="mt-4 rounded-[22px] border border-white/10 bg-[#170d1b] p-4">
          <div className="flex items-start justify-between gap-3"><div><h2 className="font-black">Distance preference</h2><p className="mt-1 text-xs font-bold text-white/55">{mapEnabled ? 'Map discovery on' : 'Map discovery paused'} - show people within {distanceKm} km</p></div><button type="button" disabled={busy} onClick={() => setMapEnabled((value) => !value)} className={'grid h-11 w-11 place-items-center rounded-full border ' + (mapEnabled ? 'border-[#ffd700] bg-[#ffd700] text-[#120914]' : 'border-[#ffd700]/40 bg-transparent text-[#ffd700]')}><Map size={18} /></button></div>
          <input type="range" min="5" max="500" step="5" value={distanceKm} onChange={(e) => setDistanceKm(Number(e.target.value))} className="mt-4 w-full accent-[#ff1493]" />
          <div className="flex justify-between text-xs font-black text-white/45"><span>5 km</span><span>500 km</span></div>
          <div className="mt-5 border-t border-white/10 pt-4"><div className="flex items-center justify-between"><h3 className="font-black">Age range</h3><span className="rounded-full bg-white/10 px-3 py-1 text-sm font-black text-[#ffd700]">{minAge} - {maxAge}</span></div><p className="mt-1 text-xs font-bold text-white/55">Show profiles in this age range, like Tinder discovery.</p>
            <input type="range" min="18" max="79" step="1" value={minAge} onChange={(e) => setMinAge(Math.min(Number(e.target.value), maxAge - 1))} className="mt-4 w-full accent-[#ff1493]" />
            <input type="range" min="19" max="80" step="1" value={maxAge} onChange={(e) => setMaxAge(Math.max(Number(e.target.value), minAge + 1))} className="mt-2 w-full accent-[#ff6f61]" />
            <div className="flex justify-between text-xs font-black text-white/45"><span>18</span><span>80+</span></div>
          </div>
          <button type="button" disabled={busy} onClick={() => void saveDiscoverySettings()} className="mt-4 w-full rounded-[16px] bg-[#ff1493] px-5 py-3 font-black disabled:opacity-50">Apply discovery filters</button>
        </div>

        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => selectImage(e.target.files?.[0])} />
        <input ref={selfieInput} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => void verifySelfie(e.target.files?.[0])} />
        {imagePreviewUrl ? <div className="mt-4 overflow-hidden rounded-[20px] border border-[#ffd700]/35 bg-black/20"><img src={imagePreviewUrl} alt="Selected profile preview" className="h-64 w-full object-cover" /><div className="flex items-center justify-between gap-3 p-3"><div><p className="font-black">New photo selected</p><p className="text-xs font-bold text-white/50">Save profile to upload</p></div><button type="button" onClick={() => { if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl); setImagePreviewUrl(''); setSelectedImageFile(null); if (fileInput.current) fileInput.current.value = ''; }} className="rounded-full bg-white/10 px-4 py-2 text-xs font-black">Remove</button></div></div> : null}

        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">{Array.from({ length: 6 }).map((_, index) => {
          const media = photoMedia[index];
          const uri = media?.url ? resolveMediaUrl(media.url) : '';
          const isMain = Boolean(media && index === 0);
          return <button type="button" disabled={busy} onClick={() => media?.id ? void setMainPhoto(media.id) : fileInput.current?.click()} key={media?.id || index} className={'relative aspect-[4/5] overflow-hidden rounded-[18px] border bg-[#170d1b] ' + (isMain ? 'border-[#ffd700] ring-1 ring-[#ffd700]/50' : 'border-[#ff1493]/20')}>{uri ? <img src={uri} alt={`Profile ${index + 1}`} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-center"><div><ImagePlus className="mx-auto text-[#ff1493]" size={22} /><span className="mt-1 block text-xs font-black text-white/60">Add</span></div></div>}{isMain ? <span className="absolute left-1.5 top-1.5 rounded-full bg-[#ffd700] px-2 py-1 text-[9px] font-black text-[#120914]">MAIN</span> : null}</button>;
        })}</div>

        <div className="mt-4 overflow-hidden rounded-[18px] border border-white/10">{profileTasks.map(([item, detail], index) => <div key={item} className={'px-4 py-3 ' + (index ? 'border-t border-white/10' : '')}><p className="font-black">{item}</p><p className="mt-1 text-xs font-bold text-white/55">{detail}</p></div>)}</div>
        <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" disabled={busy} onClick={() => fileInput.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-white/10 bg-[#170d1b] px-4 py-3 font-black"><Images size={18} className="text-[#ffd700]" />Add photo</button><button type="button" disabled={busy || !imageCount} onClick={() => selfieInput.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-white/10 bg-[#170d1b] px-4 py-3 font-black disabled:opacity-40"><Shield size={18} className="text-[#ffd700]" />{profile?.selfieVerified ? 'Verified' : 'Verify selfie'}</button></div>
        <button type="button" disabled={busy || uploadingImage} onClick={() => void saveProfileDetails()} className="mt-3 w-full rounded-[18px] bg-[#ff1493] px-5 py-3 font-black disabled:opacity-50">{uploadingImage ? 'Uploading photo...' : busy ? 'Saving...' : 'Save profile details'}</button>
        {detailsNotice ? <p className="mt-3 text-center text-sm font-black text-[#ffd700]">{detailsNotice}</p> : null}
        {status ? <p className="mt-3 rounded-[16px] bg-white/5 p-3 text-sm font-bold text-white/70">{status}</p> : null}
        <button type="button" onClick={signOut} className="mt-3 w-full py-2 text-center text-sm font-black text-[#ffd700]">Sign out</button>
      </div>

      <div className="rounded-[24px] border border-white/10 bg-[#1E1222] p-[18px]">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-[#ffd700]">Legal and privacy</p>
        {[['/privacy','Privacy Policy','How RomChat handles profile, chat, photo, location, and safety data.'],['/terms','Terms of Use','Account rules, subscriptions, tokens, acceptable use, and service limits.'],['/policies','Community Guidelines','Dating safety, respectful messaging, reporting, blocking, and contact-sharing guidance.']].map(([href,title,copy]) => <Link href={href} key={href} className="block border-t border-white/10 py-4 first:border-t-0"><p className="font-black">{title}</p><p className="mt-1 text-sm font-bold leading-5 text-white/55">{copy}</p></Link>)}
      </div>

      <div className="rounded-[24px] border border-[#ff1493]/20 bg-[#1E1222] p-[18px]">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-[#ff1493]">Bio assistant</p>
        <div className="rounded-[16px] bg-[#2A1A30] p-3 font-bold leading-6">{bio || profile?.bio || 'One-tap Kenyan bio: I am looking for something warm, honest, and intentional around real dates.'}</div>
        <div className="mt-2 rounded-[16px] bg-[#2A1A30] p-3 font-bold leading-6">{selectedInterests.length ? `Vibe signals: ${selectedInterests.join(', ')}` : 'Best dates: Karura walks, Java chats, lakefront sunsets, and food worth remembering.'}</div>
        <h3 className="mb-3 mt-5 font-black">Dating intention in Kenya</h3>
        <div className="flex flex-wrap gap-2">{intentions.map((item) => <button type="button" key={item} disabled={busy} onClick={() => setIntent(item)} className={'rounded-full border px-3 py-2 text-sm font-black ' + (intent === item ? 'border-[#ffd700] bg-[#ffd700] text-[#120914]' : 'border-[#ff1493]/20 bg-[#170d1b] text-white/80')}>{item}</button>)}</div>
        <h3 className="mb-3 mt-5 font-black">Interests and vibe signals</h3>
        <div className="flex flex-wrap gap-2">{interests.map((item) => { const active = selectedInterests.includes(item); return <button type="button" key={item} disabled={busy} onClick={() => setSelectedInterests((current) => active ? current.filter((x) => x !== item) : [...current, item])} className={'rounded-full border px-3 py-2 text-sm font-black ' + (active ? 'border-[#ffd700] bg-[#ffd700] text-[#120914]' : 'border-[#ff1493]/20 bg-[#170d1b] text-white/80')}>{item}</button>; })}</div>
        <button type="button" disabled={busy} onClick={() => void saveProfileDetails()} className="mt-5 w-full rounded-[16px] bg-[#ff1493] px-5 py-3 font-black disabled:opacity-50">Save profile details</button>

        <p className="mb-3 mt-7 text-xs font-black uppercase tracking-[0.12em] text-[#ff1493]">Dating prompts</p>
        <div className="space-y-3">{promptAnswers.map((item, index) => <div key={item.prompt} className="rounded-[18px] border border-white/10 bg-[#170d1b] p-3"><label className="text-sm font-black text-[#ffd700]">{item.prompt}</label><textarea value={item.answer} onChange={(e) => setPromptAnswers((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, answer: e.target.value } : row))} placeholder="Write a charming answer" className="mt-2 min-h-20 w-full resize-y rounded-[14px] border border-white/10 bg-[#1E1222] px-3 py-2 font-bold outline-none focus:border-[#ff1493]" /></div>)}</div>
        <button type="button" disabled={busy} onClick={() => void savePrompts()} className="mt-4 w-full rounded-[18px] bg-[#ff1493] px-5 py-3 font-black disabled:opacity-50">Save 7 profile prompts</button>

        <div className="mt-6 rounded-[20px] border border-[#ff6f61]/30 bg-[#ff6f61]/10 p-4">
          <p className="mb-1 text-xs font-black uppercase tracking-[0.12em] text-[#ffd700]">Account deletion</p>
          <p className="text-sm font-bold leading-5 text-white/65">Request a data deletion review or remove your RomChat account immediately.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2"><button type="button" disabled={busy} onClick={() => void requestDeletion()} className="rounded-[16px] border border-white/10 bg-white/5 px-4 py-3 font-black">Request data deletion</button><button type="button" disabled={busy} onClick={() => void deleteAccount()} className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-[#ff6f61] px-4 py-3 font-black"><Trash2 size={18} />Delete account</button></div>
        </div>
      </div>
    </section>
  );
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
