import crypto from 'crypto';
import { queryWithRetry } from '../config/db.js';

const now = () => new Date().toISOString();
const id = (prefix) => `${prefix}_${crypto.randomBytes(6).toString('hex')}`;

export const premiumPlans = [
  { id: 'free', name: 'Free', priceUsd: 0, billing: 'monthly', perks: ['Verified browsing', 'Limited likes', 'Safety hub'] },
  { id: 'gold', name: 'Gold', priceUsd: 19, billing: 'monthly', perks: ['Unlimited likes', 'See admirers', 'Undo swipes', 'Read receipts'], priorityLikes: 5 },
  { id: 'platinum', name: 'Platinum', priceUsd: 39, billing: 'monthly', perks: ['Priority likes', 'Passport mode', 'Weekly boost', 'Incognito included'], spotlightMinutes: 30, priorityLikes: 20 },
];

export const gifts = [
  { id: 'rose', name: 'Rose', tokenCost: 12, redeemableUsd: 0.4, animation: 'petal_burst' },
  { id: 'coffee', name: 'Digital coffee', tokenCost: 30, redeemableUsd: 1.2, animation: 'steam_heart' },
  { id: 'spotlight', name: 'Spotlight note', tokenCost: 80, redeemableUsd: 3.5, animation: 'golden_ribbon' },
];

export const boosts = [
  { id: 'local_peak_30', name: 'Peak-hour spotlight', priceUsd: 6, durationMinutes: 30, multiplier: 8 },
  { id: 'passport_weekend', name: 'Passport weekend', priceUsd: 12, durationMinutes: 4320, multiplier: 3 },
];

export const addOns = [
  { id: 'unblur_one', name: 'Unblur one admirer', priceUsd: 1.99, description: 'Reveal one blurred like without a subscription.' },
  { id: 'undo_swipe', name: 'Undo swipe', priceUsd: 0.99, description: 'Reverse the latest accidental pass.' },
  { id: 'priority_like', name: 'Priority like', priceUsd: 2.49, description: 'Move a like to the top of the inbox.' },
  { id: 'single_read_receipt', name: 'Single read receipt', priceUsd: 0.49, description: 'See whether one message was read.' },
];

const fallbackProfiles = [
  {
    id: 'elena',
    name: 'Elena',
    age: 26,
    city: 'New York',
    match: 94,
    intent: 'Long-term, slow burn',
    prompt: 'Coffee, galleries, and dinner where phones stay away.',
    voiceNote: 'Saturday jazz, morning markets, quiet confidence.',
    videoPrompt: 'Golden-hour walk through a design district.',
    quote: 'Green flags are consistency, curiosity, and calm effort.',
    song: 'Currently replaying: Sweet Disposition',
    gallery: 9,
    tags: ['Architecture', 'Jazz', 'Travel'],
    answers: ['Quiet confidence', 'Dinner first', 'Texts with substance'],
    poll: { id: 'poll_elena_pizza', question: 'Pineapple on pizza?', yes: 62, no: 38 },
    color: '#ff4f88',
    verified: true,
    online: true,
  },
  {
    id: 'amara',
    name: 'Amara',
    age: 29,
    city: 'Brooklyn',
    match: 91,
    intent: 'Ready for partnership',
    prompt: 'Thoughtful dinners, film nights, and tiny rituals.',
    voiceNote: 'I will remember your coffee order.',
    videoPrompt: 'Candlelit pasta night with a film queue.',
    quote: 'A good date feels like the conversation had somewhere to go.',
    song: 'Currently replaying: Golden Hour',
    gallery: 10,
    tags: ['Cooking', 'Design', 'Film'],
    answers: ['Plan the date', 'Acts of service', 'Sunday market'],
    poll: { id: 'poll_amara_plans', question: 'Plan the date or freestyle?', yes: 74, no: 26 },
    color: '#ff6a3d',
    verified: true,
    online: false,
  },
  {
    id: 'noah',
    name: 'Noah',
    age: 31,
    city: 'Jersey City',
    match: 88,
    intent: 'Intentional connection',
    prompt: 'Runner, builder, and the friend who books the table.',
    voiceNote: 'Sunday run, bookstore, rooftop sunset.',
    videoPrompt: 'City run ending at a skyline cafe.',
    quote: 'The best relationships are playful and deeply reliable.',
    song: 'Currently replaying: Lost in Yesterday',
    gallery: 8,
    tags: ['Books', 'Rooftops', 'Running'],
    answers: ['Early flight', 'Rooftop view', 'Calls over voice notes'],
    poll: { id: 'poll_noah_travel', question: 'Early flight or late checkout?', yes: 57, no: 43 },
    color: '#8a3ffc',
    verified: true,
    online: true,
  },
];

const fallbackMessages = [
  { id: 'msg_1', matchId: 'match_elena', senderId: 'elena', from: 'elena', text: 'Your answer about building a life with room for quiet days was rare.', createdAt: now(), risk: 'clear' },
  { id: 'msg_2', matchId: 'match_elena', senderId: 'me', from: 'me', text: 'I meant it. The best connection feels calm before it feels exciting.', createdAt: now(), risk: 'clear' },
  { id: 'msg_3', matchId: 'match_elena', senderId: 'elena', from: 'elena', text: 'That deserves a golden-hour walk. Saturday?', createdAt: now(), risk: 'clear' },
];

const schemaSql = "\nCREATE TABLE IF NOT EXISTS romchat_profiles (\n  id TEXT PRIMARY KEY,\n  name TEXT NOT NULL,\n  age INTEGER NOT NULL,\n  city TEXT NOT NULL,\n  match_score INTEGER NOT NULL DEFAULT 80,\n  intent TEXT NOT NULL DEFAULT '',\n  prompt TEXT NOT NULL DEFAULT '',\n  voice_note TEXT NOT NULL DEFAULT '',\n  video_prompt TEXT NOT NULL DEFAULT '',\n  quote TEXT NOT NULL DEFAULT '',\n  song TEXT NOT NULL DEFAULT '',\n  gallery_count INTEGER NOT NULL DEFAULT 0,\n  tags TEXT[] NOT NULL DEFAULT '{}',\n  answers TEXT[] NOT NULL DEFAULT '{}',\n  poll JSONB NOT NULL DEFAULT '{}'::jsonb,\n  color TEXT NOT NULL DEFAULT '#ff2f73',\n  photo_key TEXT,\n  verified BOOLEAN NOT NULL DEFAULT false,\n  online BOOLEAN NOT NULL DEFAULT false,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS romchat_swipes (\n  id TEXT PRIMARY KEY,\n  actor_id TEXT NOT NULL DEFAULT 'me',\n  profile_id TEXT NOT NULL REFERENCES romchat_profiles(id) ON DELETE CASCADE,\n  action TEXT NOT NULL CHECK (action IN ('pass', 'like', 'super_like')),\n  matched BOOLEAN NOT NULL DEFAULT false,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS romchat_matches (\n  id TEXT PRIMARY KEY,\n  actor_id TEXT NOT NULL DEFAULT 'me',\n  profile_id TEXT NOT NULL REFERENCES romchat_profiles(id) ON DELETE CASCADE,\n  status TEXT NOT NULL DEFAULT 'active',\n  expires_at TIMESTAMPTZ,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  UNIQUE(actor_id, profile_id)\n);\n\nCREATE TABLE IF NOT EXISTS romchat_messages (\n  id TEXT PRIMARY KEY,\n  match_id TEXT NOT NULL,\n  sender_id TEXT NOT NULL,\n  text TEXT NOT NULL DEFAULT '',\n  media_url TEXT,\n  gift_id TEXT,\n  priority BOOLEAN NOT NULL DEFAULT false,\n  view_once BOOLEAN NOT NULL DEFAULT false,\n  expires_at TIMESTAMPTZ,\n  read_at TIMESTAMPTZ,\n  risk TEXT NOT NULL DEFAULT 'clear',\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS romchat_privacy_settings (\n  member_id TEXT PRIMARY KEY DEFAULT 'me',\n  incognito BOOLEAN NOT NULL DEFAULT true,\n  screenshots_blocked BOOLEAN NOT NULL DEFAULT true,\n  visible_to_liked_only BOOLEAN NOT NULL DEFAULT true,\n  disappearing_default_seconds INTEGER NOT NULL DEFAULT 86400,\n  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS romchat_wallet_ledger (\n  id TEXT PRIMARY KEY,\n  member_id TEXT NOT NULL DEFAULT 'me',\n  title TEXT NOT NULL,\n  amount NUMERIC(12,2) NOT NULL,\n  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS romchat_subscriptions (\n  id TEXT PRIMARY KEY,\n  member_id TEXT NOT NULL DEFAULT 'me',\n  plan_id TEXT NOT NULL,\n  status TEXT NOT NULL DEFAULT 'active',\n  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  renews_at TIMESTAMPTZ\n);\n\nCREATE TABLE IF NOT EXISTS romchat_boosts (\n  id TEXT PRIMARY KEY,\n  member_id TEXT NOT NULL DEFAULT 'me',\n  boost_id TEXT NOT NULL,\n  profile_id TEXT NOT NULL DEFAULT 'me',\n  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  ends_at TIMESTAMPTZ NOT NULL\n);\n\nCREATE TABLE IF NOT EXISTS romchat_gifts (\n  id TEXT PRIMARY KEY,\n  gift_id TEXT NOT NULL,\n  match_id TEXT NOT NULL,\n  sender_id TEXT NOT NULL DEFAULT 'me',\n  note TEXT NOT NULL DEFAULT '',\n  token_cost INTEGER NOT NULL DEFAULT 0,\n  redeemable_usd NUMERIC(12,2) NOT NULL DEFAULT 0,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS romchat_reports (\n  id TEXT PRIMARY KEY,\n  reporter_id TEXT NOT NULL DEFAULT 'me',\n  profile_id TEXT,\n  type TEXT NOT NULL,\n  severity TEXT NOT NULL DEFAULT 'medium',\n  status TEXT NOT NULL DEFAULT 'open',\n  details TEXT,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS romchat_verification_requests (\n  id TEXT PRIMARY KEY,\n  member_id TEXT NOT NULL DEFAULT 'me',\n  name TEXT NOT NULL,\n  status TEXT NOT NULL DEFAULT 'manual_review',\n  risk TEXT NOT NULL DEFAULT 'low',\n  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE INDEX IF NOT EXISTS idx_romchat_messages_match_created ON romchat_messages(match_id, created_at);\nCREATE INDEX IF NOT EXISTS idx_romchat_swipes_actor_created ON romchat_swipes(actor_id, created_at);\nCREATE INDEX IF NOT EXISTS idx_romchat_reports_status ON romchat_reports(status);\n";
let schemaReady = false;

async function ensureSchema() {
  if (schemaReady) return;
  await queryWithRetry(schemaSql);
  await seedProfiles();
  schemaReady = true;
}

async function withDb(work, fallback) {
  try {
    await ensureSchema();
    return await work();
  } catch (error) {
    console.warn('[romchat:db-fallback]', error.code || error.message);
    return typeof fallback === 'function' ? fallback(error) : fallback;
  }
}

function fromProfileRow(row) {
  return {
    id: row.id,
    name: row.name,
    age: Number(row.age),
    city: row.city,
    match: Number(row.match_score),
    intent: row.intent,
    prompt: row.prompt,
    voiceNote: row.voice_note,
    videoPrompt: row.video_prompt,
    quote: row.quote,
    song: row.song,
    gallery: Number(row.gallery_count),
    tags: row.tags || [],
    answers: row.answers || [],
    poll: row.poll || {},
    color: row.color,
    verified: Boolean(row.verified),
    online: Boolean(row.online),
  };
}

function fromMessageRow(row) {
  return {
    id: row.id,
    matchId: row.match_id,
    senderId: row.sender_id,
    from: row.sender_id,
    text: row.text,
    mediaUrl: row.media_url,
    giftId: row.gift_id,
    priority: Boolean(row.priority),
    viewOnce: Boolean(row.view_once),
    expiresAt: row.expires_at,
    readAt: row.read_at,
    risk: row.risk,
    createdAt: row.created_at,
  };
}

async function seedProfiles() {
  for (const profile of fallbackProfiles) {
    await queryWithRetry(
      `INSERT INTO romchat_profiles
        (id, name, age, city, match_score, intent, prompt, voice_note, video_prompt, quote, song, gallery_count, tags, answers, poll, color, verified, online)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       ON CONFLICT (id) DO NOTHING`,
      [
        profile.id,
        profile.name,
        profile.age,
        profile.city,
        profile.match,
        profile.intent,
        profile.prompt,
        profile.voiceNote,
        profile.videoPrompt,
        profile.quote,
        profile.song,
        profile.gallery,
        profile.tags,
        profile.answers,
        profile.poll,
        profile.color,
        profile.verified,
        profile.online,
      ]
    );
  }
  await queryWithRetry(
    `INSERT INTO romchat_privacy_settings (member_id, incognito, screenshots_blocked, visible_to_liked_only, disappearing_default_seconds)
     VALUES ('me', true, true, true, 86400)
     ON CONFLICT (member_id) DO NOTHING`
  );
  await queryWithRetry(
    `INSERT INTO romchat_wallet_ledger (id, member_id, title, amount)
     VALUES ('wl_seed_topup', 'me', 'Starter wallet', 146)
     ON CONFLICT (id) DO NOTHING`
  );
}

export async function getProfiles({ verifiedOnly = true } = {}) {
  return withDb(async () => {
    const result = await queryWithRetry(
      `SELECT * FROM romchat_profiles
       WHERE ($1::boolean = false OR verified = true)
       ORDER BY match_score DESC, created_at ASC`,
      [Boolean(verifiedOnly)]
    );
    return result.rows.map(fromProfileRow);
  }, () => fallbackProfiles.filter((profile) => !verifiedOnly || profile.verified));
}

export async function getMessages(matchId = 'match_elena') {
  return withDb(async () => {
    const result = await queryWithRetry(
      `SELECT * FROM romchat_messages WHERE match_id = $1 ORDER BY created_at ASC`,
      [matchId]
    );
    return result.rows.map(fromMessageRow);
  }, () => fallbackMessages.filter((message) => message.matchId === matchId));
}

export async function getPrivacy() {
  return withDb(async () => {
    const result = await queryWithRetry('SELECT * FROM romchat_privacy_settings WHERE member_id = $1', ['me']);
    const row = result.rows[0];
    return {
      incognito: row?.incognito ?? true,
      screenshotsBlocked: row?.screenshots_blocked ?? true,
      visibleToLikedOnly: row?.visible_to_liked_only ?? true,
      disappearingDefaultSeconds: row?.disappearing_default_seconds ?? 86400,
    };
  }, () => ({ incognito: true, screenshotsBlocked: true, visibleToLikedOnly: true, disappearingDefaultSeconds: 86400 }));
}

export async function getWallet() {
  return withDb(async () => {
    const balance = await queryWithRetry('SELECT COALESCE(SUM(amount), 0) AS balance FROM romchat_wallet_ledger WHERE member_id = $1', ['me']);
    const ledger = await queryWithRetry('SELECT * FROM romchat_wallet_ledger WHERE member_id = $1 ORDER BY created_at DESC LIMIT 20', ['me']);
    return {
      balance: Number(balance.rows[0]?.balance || 0),
      currency: 'USD',
      ledger: ledger.rows.map((row) => ({ id: row.id, title: row.title, amount: Number(row.amount), metadata: row.metadata, createdAt: row.created_at })),
    };
  }, () => ({ balance: 146, currency: 'USD', ledger: [] }));
}

export async function getBootstrap() {
  const [profiles, messages, privacy, wallet] = await Promise.all([
    getProfiles({ verifiedOnly: true }),
    getMessages('match_elena'),
    getPrivacy(),
    getWallet(),
  ]);
  return {
    app: { name: 'RomChat', tagline: 'Swipe. Match. Chat.', mode: process.env.ROMCHAT_MODE || 'demo' },
    me: { id: 'me', name: 'Mia', profileStrength: 94, verification: 'verified', safetyScore: 97 },
    profiles,
    messages,
    wallet,
    safety: {
      verifiedOnlyDefault: true,
      screenshotWarnings: privacy.screenshotsBlocked,
      consentRequiredForCalls: true,
      mandatorySelfieVerification: true,
      antiScreengrab: privacy.screenshotsBlocked,
    },
    premium: { activeTier: 'gold', plans: premiumPlans },
    privacy,
  };
}

export async function createSwipe({ profileId, action }) {
  if (!profileId || !['pass', 'like', 'super_like'].includes(action)) {
    const error = new Error('profileId and a valid action are required.');
    error.status = 400;
    throw error;
  }
  const profiles = await getProfiles({ verifiedOnly: false });
  const profile = profiles.find((item) => item.id === profileId);
  const matched = action !== 'pass' && Number(profile?.match || 0) >= 88;
  const swipeId = id('swipe');
  const matchId = matched ? `match_${profileId}` : null;

  return withDb(async () => {
    await queryWithRetry('INSERT INTO romchat_swipes (id, actor_id, profile_id, action, matched) VALUES ($1,$2,$3,$4,$5)', [swipeId, 'me', profileId, action, matched]);
    if (matched) {
      await queryWithRetry(
        `INSERT INTO romchat_matches (id, actor_id, profile_id, expires_at)
         VALUES ($1, 'me', $2, now() + interval '24 hours')
         ON CONFLICT (actor_id, profile_id) DO UPDATE SET status = 'active'`,
        [matchId, profileId]
      );
    }
    return { id: swipeId, matched, matchId, message: matched ? 'It is a match.' : 'Preference saved.' };
  }, () => ({ id: swipeId, matched, matchId, message: matched ? 'It is a match.' : 'Preference saved.' }));
}

export async function sendMessage({ matchId = 'match_elena', text, expiresInSeconds = null, viewOnce = false, mediaUrl = null, giftId = null, priority = false }) {
  if (!String(text || '').trim() && !mediaUrl) {
    const error = new Error('Message text or mediaUrl is required.');
    error.status = 400;
    throw error;
  }
  const message = {
    id: id('msg'),
    matchId,
    senderId: 'me',
    from: 'me',
    text: String(text || '').trim(),
    mediaUrl,
    giftId,
    priority: Boolean(priority),
    viewOnce: Boolean(viewOnce),
    expiresAt: expiresInSeconds ? new Date(Date.now() + Number(expiresInSeconds) * 1000).toISOString() : null,
    readAt: null,
    risk: /money|wire|crypto|password/i.test(String(text || '')) ? 'review' : 'clear',
    createdAt: now(),
  };
  return withDb(async () => {
    await queryWithRetry(
      `INSERT INTO romchat_messages (id, match_id, sender_id, text, media_url, gift_id, priority, view_once, expires_at, risk)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [message.id, message.matchId, message.senderId, message.text, message.mediaUrl, message.giftId, message.priority, message.viewOnce, message.expiresAt, message.risk]
    );
    return message;
  }, () => message);
}

export async function updatePrivacy(payload = {}) {
  return withDb(async () => {
    await queryWithRetry(
      `INSERT INTO romchat_privacy_settings (member_id, incognito, screenshots_blocked, visible_to_liked_only, disappearing_default_seconds, updated_at)
       VALUES ('me', $1, $2, $3, $4, now())
       ON CONFLICT (member_id) DO UPDATE SET
         incognito = EXCLUDED.incognito,
         screenshots_blocked = EXCLUDED.screenshots_blocked,
         visible_to_liked_only = EXCLUDED.visible_to_liked_only,
         disappearing_default_seconds = EXCLUDED.disappearing_default_seconds,
         updated_at = now()`,
      [
        payload.incognito ?? true,
        payload.screenshotsBlocked ?? payload.screenshots_blocked ?? true,
        payload.visibleToLikedOnly ?? payload.visible_to_liked_only ?? true,
        payload.disappearingDefaultSeconds ?? payload.disappearing_default_seconds ?? 86400,
      ]
    );
    return getPrivacy();
  }, () => ({
    incognito: payload.incognito ?? true,
    screenshotsBlocked: payload.screenshotsBlocked ?? true,
    visibleToLikedOnly: payload.visibleToLikedOnly ?? true,
    disappearingDefaultSeconds: payload.disappearingDefaultSeconds ?? 86400,
  }));
}

export async function createReport(payload = {}) {
  const report = {
    id: id('rp'),
    reporterId: 'me',
    profileId: payload.profileId || null,
    type: payload.type || 'Safety report',
    severity: payload.severity || 'medium',
    status: 'open',
    details: payload.details || '',
    createdAt: now(),
  };
  return withDb(async () => {
    await queryWithRetry(
      'INSERT INTO romchat_reports (id, reporter_id, profile_id, type, severity, status, details) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [report.id, report.reporterId, report.profileId, report.type, report.severity, report.status, report.details]
    );
    return report;
  }, () => report);
}

export async function createVerification(payload = {}) {
  const request = { id: id('rv'), memberId: payload.memberId || 'me', name: payload.name || 'RomChat member', status: 'manual_review', risk: 'low', updatedAt: now() };
  return withDb(async () => {
    await queryWithRetry(
      'INSERT INTO romchat_verification_requests (id, member_id, name, status, risk) VALUES ($1,$2,$3,$4,$5)',
      [request.id, request.memberId, request.name, request.status, request.risk]
    );
    return request;
  }, () => request);
}

export async function activateBoost(payload = {}) {
  const boost = boosts.find((item) => item.id === payload.boostId) || boosts[0];
  const activation = { id: id('boost'), boostId: boost.id, profileId: payload.profileId || 'me', startsAt: now(), endsAt: new Date(Date.now() + boost.durationMinutes * 60000).toISOString() };
  return withDb(async () => {
    await queryWithRetry(
      'INSERT INTO romchat_boosts (id, member_id, boost_id, profile_id, starts_at, ends_at) VALUES ($1,$2,$3,$4,$5,$6)',
      [activation.id, 'me', activation.boostId, activation.profileId, activation.startsAt, activation.endsAt]
    );
    await queryWithRetry('INSERT INTO romchat_wallet_ledger (id, member_id, title, amount, metadata) VALUES ($1,$2,$3,$4,$5)', [id('wl'), 'me', 'Profile boost', -Number(boost.priceUsd || 0), { boostId: boost.id }]);
    return { boost: activation, catalog: boost, wallet: await getWallet() };
  }, () => ({ boost: activation, catalog: boost, wallet: { balance: 146, currency: 'USD', ledger: [] } }));
}

export async function sendGift(payload = {}) {
  const gift = gifts.find((item) => item.id === payload.giftId);
  if (!gift) {
    const error = new Error('Valid giftId is required.');
    error.status = 400;
    throw error;
  }
  const entry = { id: id('gift'), giftId: gift.id, matchId: payload.matchId || 'match_elena', note: payload.note || '', tokenCost: gift.tokenCost, redeemableUsd: gift.redeemableUsd, createdAt: now() };
  return withDb(async () => {
    await queryWithRetry(
      'INSERT INTO romchat_gifts (id, gift_id, match_id, sender_id, note, token_cost, redeemable_usd) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [entry.id, entry.giftId, entry.matchId, 'me', entry.note, entry.tokenCost, entry.redeemableUsd]
    );
    await queryWithRetry('INSERT INTO romchat_wallet_ledger (id, member_id, title, amount, metadata) VALUES ($1,$2,$3,$4,$5)', [id('wl'), 'me', `Gift: ${gift.name}`, -gift.tokenCost, { giftId: gift.id }]);
    return { gift: entry, wallet: await getWallet() };
  }, () => ({ gift: entry, wallet: { balance: Math.max(0, 146 - gift.tokenCost), currency: 'USD', ledger: [] } }));
}

export async function topUpWallet(amount) {
  const value = Number(amount || 0);
  if (value <= 0) {
    const error = new Error('A positive amount is required.');
    error.status = 400;
    throw error;
  }
  return withDb(async () => {
    const entry = { id: id('wl'), title: 'Wallet top-up', amount: value, createdAt: now() };
    await queryWithRetry('INSERT INTO romchat_wallet_ledger (id, member_id, title, amount) VALUES ($1,$2,$3,$4)', [entry.id, 'me', entry.title, entry.amount]);
    return { wallet: await getWallet(), entry };
  }, () => ({ wallet: { balance: 146 + value, currency: 'USD', ledger: [] }, entry: { id: id('wl'), title: 'Wallet top-up', amount: value, createdAt: now() } }));
}
