import crypto from 'crypto';
import { queryWithRetry } from '../config/db.js';

const now = () => new Date().toISOString();
const id = (prefix) => `${prefix}_${crypto.randomBytes(6).toString('hex')}`;

export const premiumPlans = [
  { id: 'free', name: 'Free', priceUsd: 0, billing: 'monthly', perks: ['Verified browsing', 'Limited likes', 'Safety hub'] },
  { id: 'gold', name: 'Gold', priceUsd: 19.99, billing: 'monthly', perks: ['Unlimited likes', 'See admirers', 'Undo swipes', 'Read receipts'], priorityLikes: 5 },
  { id: 'platinum', name: 'Platinum', priceUsd: 34.99, billing: 'monthly', perks: ['Priority likes', 'Passport mode', 'Weekly boost', 'Incognito included'], spotlightMinutes: 30, priorityLikes: 20 },
];

export const gifts = [
  { id: 'rose', name: 'Rose', tokenCost: 5, redeemableUsd: 0.4, animation: 'petal_burst' },
  { id: 'chai', name: 'Chai date', tokenCost: 12, redeemableUsd: 1.2, animation: 'steam_heart' },
  { id: 'spotlight', name: 'Spotlight note', tokenCost: 30, redeemableUsd: 3.5, animation: 'golden_ribbon' },
];

export const tokenPackages = [
  { id: 'tokens_100', amount: 100, priceUsd: 4.99, unitPriceUsd: 0.05, badge: null, productIds: { android: 'romchat_tokens_100', ios: 'romchat.tokens.100' } },
  { id: 'tokens_350', amount: 350, priceUsd: 12.99, unitPriceUsd: 0.03, badge: 'MOST POPULAR', productIds: { android: 'romchat_tokens_350', ios: 'romchat.tokens.350' } },
  { id: 'tokens_1000', amount: 1000, priceUsd: 29.99, unitPriceUsd: 0.02, badge: 'BEST VALUE', productIds: { android: 'romchat_tokens_1000', ios: 'romchat.tokens.1000' } },
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

const kenyaCityCoordinates = new Map([
  ['nairobi', { latitude: -1.286389, longitude: 36.817223 }],
  ['mombasa', { latitude: -4.043477, longitude: 39.668206 }],
  ['kisumu', { latitude: -0.091702, longitude: 34.767956 }],
  ['nakuru', { latitude: -0.303099, longitude: 36.080025 }],
  ['eldoret', { latitude: 0.514277, longitude: 35.269779 }],
  ['thika', { latitude: -1.03326, longitude: 37.06933 }],
  ['malindi', { latitude: -3.219186, longitude: 40.11689 }],
  ['kitale', { latitude: 1.01572, longitude: 35.00622 }],
  ['naivasha', { latitude: -0.716667, longitude: 36.433333 }],
  ['machakos', { latitude: -1.517684, longitude: 37.263414 }],
]);

function clampDistanceKm(value) {
  const next = Number(value || 80);
  if (!Number.isFinite(next)) return 80;
  return Math.max(5, Math.min(500, Math.round(next / 5) * 5));
}

function coordinatesForCity(city) {
  const key = String(city || '').trim().toLowerCase();
  return kenyaCityCoordinates.get(key) || kenyaCityCoordinates.get('nairobi');
}

function rowCoordinates(row) {
  const latitude = Number(row?.latitude);
  const longitude = Number(row?.longitude);
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) return { latitude, longitude };
  return coordinatesForCity(row?.city);
}

function haversineKm(from, to) {
  if (!from || !to) return 0;
  const rad = (value) => (value * Math.PI) / 180;
  const earthKm = 6371;
  const dLat = rad(to.latitude - from.latitude);
  const dLon = rad(to.longitude - from.longitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(from.latitude)) * Math.cos(rad(to.latitude)) * Math.sin(dLon / 2) ** 2;
  return Math.round(earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
const fallbackProfiles = [
  {
    id: 'elena',
    name: 'Aisha',
    age: 26,
    city: 'Nairobi',
    match: 94,
    intent: 'Serious Kenyan love, slow burn',
    prompt: 'Java dates, Karura walks, and dinners where phones stay away.',
    voiceNote: 'Saturday brunch, Nairobi sunsets, quiet confidence.',
    videoPrompt: 'Golden-hour walk through Westlands.',
    quote: 'Green flags are consistency, respect, and showing up even when Nairobi traffic wins.',
    song: 'Currently replaying: Sauti Sol - Suzanna',
    gallery: 9,
    tags: ['Karura', 'Afrobeats', 'Travel'],
    answers: ['Intentional effort', 'Dinner first', 'Texts with substance'],
    poll: { id: 'poll_aisha_mutura', question: 'Mutura date after sunset?', yes: 68, no: 32 },
    color: '#ff4f88',
    verified: true,
    online: true,
  },
  {
    id: 'amara',
    name: 'Wanjiku',
    age: 29,
    city: 'Mombasa',
    match: 91,
    intent: 'Ready for partnership',
    prompt: 'Coast weekends, Swahili food, film nights, and tiny rituals.',
    voiceNote: 'I will remember your chai order.',
    videoPrompt: 'Beach dinner in Nyali with a film queue.',
    quote: 'A good Kenyan date feels easy, respectful, and worth crossing town for.',
    song: 'Currently replaying: Bien - Inauma',
    gallery: 10,
    tags: ['Swahili food', 'Design', 'Film'],
    answers: ['Plan the date', 'Acts of service', 'Sunday market'],
    poll: { id: 'poll_wanjiku_weekend', question: 'Diani weekend or Nairobi rooftop?', yes: 74, no: 26 },
    color: '#ff6a3d',
    verified: true,
    online: false,
  },
  {
    id: 'noah',
    name: 'Brian',
    age: 31,
    city: 'Kisumu',
    match: 88,
    intent: 'Intentional connection',
    prompt: 'Runner, builder, and the guy who books the table before traffic starts.',
    voiceNote: 'Sunday run, Java stop, rooftop sunset.',
    videoPrompt: 'City run ending at a Kisumu lakefront cafe.',
    quote: 'The best relationships are playful, prayerful if that is your lane, and deeply reliable.',
    song: 'Currently replaying: Bensoul - Favorite Song',
    gallery: 8,
    tags: ['Books', 'Rooftops', 'Running'],
    answers: ['Early flight', 'Rooftop view', 'Calls over voice notes'],
    poll: { id: 'poll_brian_ride', question: 'Matatu adventure or Bolt comfort?', yes: 57, no: 43 },
    color: '#8a3ffc',
    verified: true,
    online: true,
  },
];

const fallbackVideoRequests = [
  { id: 'vr_elena_1', matchId: 'match_elena', senderProfileId: 'elena', title: 'Aisha invited you to a 2-minute video vibe check', teaser: 'She is online in Kenya now. Unlock to accept before it expires.', unlockCostTokens: 25, status: 'locked', createdAt: now() },
  { id: 'vr_amara_1', matchId: 'match_amara', senderProfileId: 'amara', title: 'Wanjiku wants to send a private hello video', teaser: 'A soft intro before planning that Kenyan date.', unlockCostTokens: 28, status: 'locked', createdAt: now() },
];

const fallbackMessages = [
  { id: 'msg_1', matchId: 'match_elena', senderId: 'elena', from: 'elena', text: 'Your answer about building a life with room for quiet days was rare.', createdAt: now(), risk: 'clear' },
  { id: 'msg_2', matchId: 'match_elena', senderId: 'me', from: 'me', text: 'I meant it. The best connection feels calm before it feels exciting.', createdAt: now(), risk: 'clear' },
  { id: 'msg_3', matchId: 'match_elena', senderId: 'elena', from: 'elena', text: 'That deserves a golden-hour walk. Saturday?', createdAt: now(), risk: 'clear' },
  { id: 'media_locked_1', matchId: 'match_elena', senderId: 'elena', from: 'elena', text: 'I sent a private voice note preview. Basic text stays free; unlock this optional media when the vibe feels right.', mediaUrl: 'romchat://demo/voice/aisha-saturday-note', mediaType: 'voice', locked: true, unlockCostTokens: 10, unlockedByActor: false, messageKind: 'locked_media', createdAt: now(), risk: 'clear' },
];

const schemaSql = "\nCREATE TABLE IF NOT EXISTS romchat_profiles (\n  id TEXT PRIMARY KEY,\n  name TEXT NOT NULL,\n  age INTEGER NOT NULL,\n  city TEXT NOT NULL,\n  match_score INTEGER NOT NULL DEFAULT 80,\n  intent TEXT NOT NULL DEFAULT '',\n  prompt TEXT NOT NULL DEFAULT '',\n  voice_note TEXT NOT NULL DEFAULT '',\n  video_prompt TEXT NOT NULL DEFAULT '',\n  quote TEXT NOT NULL DEFAULT '',\n  song TEXT NOT NULL DEFAULT '',\n  gallery_count INTEGER NOT NULL DEFAULT 0,\n  tags TEXT[] NOT NULL DEFAULT '{}',\n  answers TEXT[] NOT NULL DEFAULT '{}',\n  poll JSONB NOT NULL DEFAULT '{}'::jsonb,\n  color TEXT NOT NULL DEFAULT '#ff2f73',\n  photo_key TEXT,\n  verified BOOLEAN NOT NULL DEFAULT false,\n  online BOOLEAN NOT NULL DEFAULT false,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS romchat_swipes (\n  id TEXT PRIMARY KEY,\n  actor_id TEXT NOT NULL DEFAULT 'me',\n  profile_id TEXT NOT NULL REFERENCES romchat_profiles(id) ON DELETE CASCADE,\n  action TEXT NOT NULL CHECK (action IN ('pass', 'like', 'super_like')),\n  matched BOOLEAN NOT NULL DEFAULT false,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS romchat_matches (\n  id TEXT PRIMARY KEY,\n  actor_id TEXT NOT NULL DEFAULT 'me',\n  profile_id TEXT NOT NULL REFERENCES romchat_profiles(id) ON DELETE CASCADE,\n  status TEXT NOT NULL DEFAULT 'active',\n  expires_at TIMESTAMPTZ,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  UNIQUE(actor_id, profile_id)\n);\n\nCREATE TABLE IF NOT EXISTS romchat_messages (\n  id TEXT PRIMARY KEY,\n  match_id TEXT NOT NULL,\n  sender_id TEXT NOT NULL,\n  text TEXT NOT NULL DEFAULT '',\n  media_url TEXT,\n  media_type TEXT,\n  gift_id TEXT,\n  priority BOOLEAN NOT NULL DEFAULT false,\n  view_once BOOLEAN NOT NULL DEFAULT false,\n  expires_at TIMESTAMPTZ,\n  read_at TIMESTAMPTZ,\n  risk TEXT NOT NULL DEFAULT 'clear',\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS romchat_privacy_settings (\n  member_id TEXT PRIMARY KEY DEFAULT 'me',\n  incognito BOOLEAN NOT NULL DEFAULT true,\n  screenshots_blocked BOOLEAN NOT NULL DEFAULT true,\n  visible_to_liked_only BOOLEAN NOT NULL DEFAULT true,\n  disappearing_default_seconds INTEGER NOT NULL DEFAULT 86400,\n  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS romchat_wallet_ledger (\n  id TEXT PRIMARY KEY,\n  member_id TEXT NOT NULL DEFAULT 'me',\n  title TEXT NOT NULL,\n  amount NUMERIC(12,2) NOT NULL,\n  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS romchat_subscriptions (\n  id TEXT PRIMARY KEY,\n  member_id TEXT NOT NULL DEFAULT 'me',\n  plan_id TEXT NOT NULL,\n  status TEXT NOT NULL DEFAULT 'active',\n  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  renews_at TIMESTAMPTZ\n);\n\nCREATE TABLE IF NOT EXISTS romchat_boosts (\n  id TEXT PRIMARY KEY,\n  member_id TEXT NOT NULL DEFAULT 'me',\n  boost_id TEXT NOT NULL,\n  profile_id TEXT NOT NULL DEFAULT 'me',\n  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  ends_at TIMESTAMPTZ NOT NULL\n);\n\nCREATE TABLE IF NOT EXISTS romchat_gifts (\n  id TEXT PRIMARY KEY,\n  gift_id TEXT NOT NULL,\n  match_id TEXT NOT NULL,\n  sender_id TEXT NOT NULL DEFAULT 'me',\n  note TEXT NOT NULL DEFAULT '',\n  token_cost INTEGER NOT NULL DEFAULT 0,\n  redeemable_usd NUMERIC(12,2) NOT NULL DEFAULT 0,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS romchat_reports (\n  id TEXT PRIMARY KEY,\n  reporter_id TEXT NOT NULL DEFAULT 'me',\n  profile_id TEXT,\n  type TEXT NOT NULL,\n  severity TEXT NOT NULL DEFAULT 'medium',\n  status TEXT NOT NULL DEFAULT 'open',\n  details TEXT,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS romchat_verification_requests (\n  id TEXT PRIMARY KEY,\n  member_id TEXT NOT NULL DEFAULT 'me',\n  name TEXT NOT NULL,\n  status TEXT NOT NULL DEFAULT 'manual_review',\n  risk TEXT NOT NULL DEFAULT 'low',\n  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE INDEX IF NOT EXISTS idx_romchat_messages_match_created ON romchat_messages(match_id, created_at);\nCREATE INDEX IF NOT EXISTS idx_romchat_swipes_actor_created ON romchat_swipes(actor_id, created_at);\nCREATE INDEX IF NOT EXISTS idx_romchat_reports_status ON romchat_reports(status);\nALTER TABLE romchat_swipes DROP CONSTRAINT IF EXISTS romchat_swipes_profile_id_fkey;\nALTER TABLE romchat_matches DROP CONSTRAINT IF EXISTS romchat_matches_profile_id_fkey;\n\nALTER TABLE romchat_messages\n  ADD COLUMN IF NOT EXISTS media_type TEXT,\n  ADD COLUMN IF NOT EXISTS locked BOOLEAN NOT NULL DEFAULT false,\n  ADD COLUMN IF NOT EXISTS unlock_cost_tokens INTEGER NOT NULL DEFAULT 0,\n  ADD COLUMN IF NOT EXISTS unlocked_by_actor BOOLEAN NOT NULL DEFAULT false,\n  ADD COLUMN IF NOT EXISTS message_kind TEXT NOT NULL DEFAULT \'text\';\n\nCREATE TABLE IF NOT EXISTS romchat_video_requests (\n  id TEXT PRIMARY KEY,\n  match_id TEXT NOT NULL,\n  sender_profile_id TEXT NOT NULL,\n  title TEXT NOT NULL,\n  teaser TEXT NOT NULL,\n  unlock_cost_tokens INTEGER NOT NULL DEFAULT 0,\n  status TEXT NOT NULL DEFAULT \'locked\',\n  unlocked_at TIMESTAMPTZ,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS romchat_token_unlocks (\n  id TEXT PRIMARY KEY,\n  member_id TEXT NOT NULL DEFAULT \'me\',\n  target_type TEXT NOT NULL CHECK (target_type IN (\'message\', \'video_request\', \'admirer\', \'read_receipt\', \'undo_swipe\')),\n  target_id TEXT NOT NULL,\n  cost_tokens INTEGER NOT NULL,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  UNIQUE(member_id, target_type, target_id)\n);\n\nCREATE INDEX IF NOT EXISTS idx_romchat_video_requests_match_created ON romchat_video_requests(match_id, created_at DESC);\nCREATE INDEX IF NOT EXISTS idx_romchat_token_unlocks_member_created ON romchat_token_unlocks(member_id, created_at DESC);\n\n";
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

function romanticMatchScore(row) {
  const seed = String(row.member_id || row.id || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return 84 + (seed % 14);
}

function isRecentlyOnline(row) {
  const lastSeen = new Date(row?.last_seen_at || row?.updated_at || 0).getTime();
  return Number.isFinite(lastSeen) && Date.now() - lastSeen <= 5 * 60 * 1000;
}

function fromMemberProfileRow(row, catalogueAccess = 1) {
  const access = Math.max(1, Number(catalogueAccess || 1));
  const photos = Array.isArray(row.photos) ? row.photos.filter(Boolean) : [];
  const visiblePhotos = photos.slice(0, access);
  const fullGallery = photos.length;
  const interests = row.interests || [];
  const promptAnswers = Array.isArray(row.prompt_answers) ? row.prompt_answers : [];
  const answers = promptAnswers.map((item) => item?.answer).filter(Boolean).slice(0, 3);
  return {
    id: row.member_id,
    name: row.display_name,
    age: Number(row.age),
    city: row.city,
    match: romanticMatchScore(row),
    intent: row.intent || 'Intentional Kenyan connection',
    prompt: row.bio || answers[0] || 'Ready for a real Kenyan romance with warm conversation.',
    videoPrompt: 'Video vibe check after a mutual match.',
    quote: row.bio || 'Looking for honest effort, chemistry, and consistency.',
    song: interests[0] ? `Currently into: ${interests[0]}` : 'Currently into: Kenyan romance energy',
    gallery: visiblePhotos.length || Math.min(fullGallery, access),
    fullGallery,
    lockedGallery: Math.max(0, fullGallery - visiblePhotos.length),
    catalogueAccess: access,
    photos: visiblePhotos,
    tags: interests.slice(0, 5),
    answers: answers.length ? answers : [row.intent || 'Intentional connection', row.city || 'Kenya', 'Real dates'],
    poll: { id: `poll_${row.member_id}`, question: 'Coffee date or sunset walk?', yes: 64, no: 36 },
    color: '#FF1493',
    verified: Boolean(row.selfie_verified),
    verificationStatus: row.verification_status || (row.selfie_verified ? 'verified' : 'not_started'),
    verificationScore: row.verification_score == null ? null : Number(row.verification_score),
    lastSeenAt: row.last_seen_at || null,
    online: isRecentlyOnline(row),
    distanceKm: Number(row.distance_km || 0),
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
    mediaType: row.media_type,
    giftId: row.gift_id,
    priority: Boolean(row.priority),
    viewOnce: Boolean(row.view_once),
    expiresAt: row.expires_at,
    readAt: row.read_at,
    risk: row.risk,
    locked: Boolean(row.locked),
    unlockCostTokens: Number(row.unlock_cost_tokens || 0),
    unlockedByActor: Boolean(row.unlocked_by_actor),
    messageKind: row.message_kind || 'text',
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

export async function getProfiles({ verifiedOnly = true, catalogueAccess = 1, viewerId = null } = {}) {
  const access = Math.max(1, Number(catalogueAccess || 1));
  return withDb(async () => {
    let viewer = null;
    if (viewerId) {
      const viewerRows = await queryWithRetry('SELECT member_id, city, latitude, longitude, max_distance_km, min_age, max_age, map_discovery_enabled FROM romchat_member_profiles WHERE member_id = $1', [viewerId]);
      viewer = viewerRows.rows[0] || null;
    }
    const viewerCoordinates = viewer ? rowCoordinates(viewer) : null;
    const maxDistanceKm = clampDistanceKm(viewer?.max_distance_km);
    const minAge = Number(viewer?.min_age || 18);
    const maxAge = Number(viewer?.max_age || 80);
    const mapDiscoveryEnabled = viewer?.map_discovery_enabled !== false;
    let result = await queryWithRetry(
      `SELECT
         p.*,
         COALESCE(
           array_agg(m.url ORDER BY m.position ASC, m.created_at ASC)
             FILTER (WHERE m.media_type = 'image'),
           '{}'
         ) AS photos
       FROM romchat_member_profiles p
       JOIN romchat_profile_media m ON m.member_id = p.member_id AND m.media_type = 'image'
       WHERE ($1::text IS NULL OR p.member_id <> $1)
         AND ($2::boolean = false OR p.selfie_verified = true)
       GROUP BY p.member_id
       ORDER BY p.selfie_verified DESC, p.profile_strength DESC, p.updated_at DESC`,
      [viewerId, Boolean(verifiedOnly)]
    );
    if (!result.rows.length && verifiedOnly) {
      result = await queryWithRetry(
        `SELECT
           p.*,
           COALESCE(
             array_agg(m.url ORDER BY m.position ASC, m.created_at ASC)
               FILTER (WHERE m.media_type = 'image'),
             '{}'
           ) AS photos
         FROM romchat_member_profiles p
         JOIN romchat_profile_media m ON m.member_id = p.member_id AND m.media_type = 'image'
         WHERE ($1::text IS NULL OR p.member_id <> $1)
         GROUP BY p.member_id
         ORDER BY p.selfie_verified DESC, p.profile_strength DESC, p.updated_at DESC`,
        [viewerId]
      );
    }
    return result.rows
      .map((row) => ({ ...row, distance_km: viewerCoordinates ? haversineKm(viewerCoordinates, rowCoordinates(row)) : 0 }))
      .filter((row) => !viewerCoordinates || !mapDiscoveryEnabled || Number(row.distance_km || 0) <= maxDistanceKm)
      .filter((row) => Number(row.age || 0) >= minAge && Number(row.age || 0) <= maxAge)
      .sort((a, b) => Number(a.distance_km || 0) - Number(b.distance_km || 0) || Number(b.profile_strength || 0) - Number(a.profile_strength || 0))
      .map((row) => fromMemberProfileRow(row, access));
  }, () => []);
}

export async function getMessages(matchId = 'match_elena') {
  return withDb(async () => {
    const result = await queryWithRetry(
      `SELECT * FROM romchat_messages WHERE match_id = $1 ORDER BY created_at ASC`,
      [matchId]
    );
    return result.rows.map(fromMessageRow);
  }, () => []);
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
      currency: 'KES',
      ledger: ledger.rows.map((row) => ({ id: row.id, title: row.title, amount: Number(row.amount), metadata: row.metadata, createdAt: row.created_at })),
    };
  }, () => ({ balance: 146, currency: 'KES', ledger: [] }));
}

export async function getBootstrap({ catalogueAccess = 1, viewerId = null, verifiedOnly = false } = {}) {
  const [profiles, messages, privacy, wallet] = await Promise.all([
    getProfiles({ verifiedOnly, catalogueAccess, viewerId }),
    getMessages('match_elena'),
    getPrivacy(),
    getWallet(),
  ]);
  return {
    app: { name: 'RomChat', tagline: 'Kenyan singles. Real vibes. Safer chats.', mode: process.env.ROMCHAT_MODE || 'demo' },
    me: { id: 'me', name: 'Nia', profileStrength: 94, verification: 'verified', safetyScore: 97 },
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
      await queryWithRetry(
        `INSERT INTO romchat_video_requests (id, match_id, sender_profile_id, title, teaser, unlock_cost_tokens, status)
         VALUES ($1,$2,$3,$4,$5,25,'locked')
         ON CONFLICT (id) DO NOTHING`,
        ['vr_' + matchId, matchId, profileId, '2-minute video vibe request', 'Unlock only if you want a quick live vibe check. Text chat stays free.', profileId]
      );
    }
    return { id: swipeId, matched, matchId, message: matched ? 'Ni match. Say hi.' : 'Preference saved for your Kenyan discovery.' };
  }, () => ({ id: swipeId, matched, matchId, message: matched ? 'Ni match. Say hi.' : 'Preference saved for your Kenyan discovery.' }));
}

export async function sendMessage({ matchId = 'match_elena', text, expiresInSeconds = null, viewOnce = false, mediaUrl = null, mediaType = null, giftId = null, priority = false, riskOverride = null }) {
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
    mediaType,
    giftId,
    priority: Boolean(priority),
    viewOnce: Boolean(viewOnce),
    expiresAt: expiresInSeconds ? new Date(Date.now() + Number(expiresInSeconds) * 1000).toISOString() : null,
    readAt: null,
    risk: riskOverride || (/money|wire|crypto|password/i.test(String(text || '')) ? 'review' : 'clear'),
    createdAt: now(),
  };
  return withDb(async () => {
    await queryWithRetry(
      `INSERT INTO romchat_messages (id, match_id, sender_id, text, media_url, media_type, gift_id, priority, view_once, expires_at, risk)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [message.id, message.matchId, message.senderId, message.text, message.mediaUrl, message.mediaType, message.giftId, message.priority, message.viewOnce, message.expiresAt, message.risk]
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
  }, () => ({ boost: activation, catalog: boost, wallet: { balance: 146, currency: 'KES', ledger: [] } }));
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
  }, () => ({ gift: entry, wallet: { balance: Math.max(0, 146 - gift.tokenCost), currency: 'KES', ledger: [] } }));
}

export async function createLockedMediaPreview({ matchId = 'match_elena', senderId = 'elena', text = 'I sent a private voice note preview. Basic text stays free; unlock this optional media when the vibe feels right.', mediaUrl = 'romchat://demo/voice/aisha-saturday-note', mediaType = 'voice', unlockCostTokens = 18 } = {}) {
  const message = {
    id: id('msg'),
    matchId,
    senderId,
    from: senderId,
    text,
    mediaUrl,
    mediaType,
    locked: true,
    unlockCostTokens: Number(unlockCostTokens),
    unlockedByActor: false,
    messageKind: 'locked_media',
    risk: 'clear',
    createdAt: now(),
  };
  return withDb(async () => {
    await queryWithRetry(
      `INSERT INTO romchat_messages (id, match_id, sender_id, text, media_url, media_type, locked, unlock_cost_tokens, unlocked_by_actor, message_kind, risk)
       VALUES ($1,$2,$3,$4,$5,$6,true,$7,false,'locked_media',$8)`,
      [message.id, message.matchId, message.senderId, message.text, message.mediaUrl, message.mediaType, message.unlockCostTokens, message.risk]
    );
    return message;
  }, () => message);
}

export async function getVideoRequests(matchId = 'match_elena') {
  return withDb(async () => {
    const result = await queryWithRetry('SELECT * FROM romchat_video_requests WHERE match_id = $1 ORDER BY created_at DESC', [matchId]);
    return result.rows.map((row) => ({
      id: row.id,
      matchId: row.match_id,
      senderProfileId: row.sender_profile_id,
      title: row.title,
      teaser: row.teaser,
      unlockCostTokens: Number(row.unlock_cost_tokens || 0),
      status: row.status,
      unlockedAt: row.unlocked_at,
      createdAt: row.created_at,
    }));
  }, () => []);
}

async function spendTokens({ targetType, targetId, costTokens, title }) {
  const cost = Number(costTokens || 0);
  if (cost <= 0) return { spent: 0, wallet: await getWallet() };
  const wallet = await getWallet();
  if (Number(wallet.balance || 0) < cost) {
    const error = new Error('Not enough RomChat tokens.');
    error.status = 402;
    error.code = 'INSUFFICIENT_TOKENS';
    throw error;
  }
  await queryWithRetry(
    'INSERT INTO romchat_token_unlocks (id, member_id, target_type, target_id, cost_tokens) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (member_id, target_type, target_id) DO NOTHING',
    [id('unlock'), 'me', targetType, targetId, cost]
  );
  await queryWithRetry('INSERT INTO romchat_wallet_ledger (id, member_id, title, amount, metadata) VALUES ($1,$2,$3,$4,$5)', [id('wl'), 'me', title, -cost, { targetType, targetId }]);
  return { spent: cost, wallet: await getWallet() };
}

export async function unlockPaidMessage(messageId) {
  return withDb(async () => {
    const result = await queryWithRetry('SELECT * FROM romchat_messages WHERE id = $1', [messageId]);
    const row = result.rows[0];
    if (!row) {
      const error = new Error('Paid message not found.');
      error.status = 404;
      throw error;
    }
    const spend = await spendTokens({ targetType: 'message', targetId: messageId, costTokens: row.unlock_cost_tokens, title: 'Unlocked private media' });
    await queryWithRetry('UPDATE romchat_messages SET unlocked_by_actor = true WHERE id = $1', [messageId]);
    return { message: { ...fromMessageRow({ ...row, unlocked_by_actor: true }), unlockedByActor: true }, ...spend };
  }, () => {
    const message = fallbackMessages.find((item) => item.id === messageId) || fallbackMessages.find((item) => item.locked);
    return { message: { ...message, unlockedByActor: true }, spent: Number(message?.unlockCostTokens || 10), wallet: { balance: 128, currency: 'KES', ledger: [] } };
  });
}

export async function unlockVideoRequest(requestId) {
  return withDb(async () => {
    const result = await queryWithRetry('SELECT * FROM romchat_video_requests WHERE id = $1', [requestId]);
    const row = result.rows[0];
    if (!row) {
      const error = new Error('Video request not found.');
      error.status = 404;
      throw error;
    }
    const spend = await spendTokens({ targetType: 'video_request', targetId: requestId, costTokens: row.unlock_cost_tokens, title: 'Unlocked video request' });
    await queryWithRetry("UPDATE romchat_video_requests SET status = 'unlocked', unlocked_at = now() WHERE id = $1", [requestId]);
    return {
      videoRequest: {
        id: row.id,
        matchId: row.match_id,
        senderProfileId: row.sender_profile_id,
        title: row.title,
        teaser: row.teaser,
        unlockCostTokens: Number(row.unlock_cost_tokens || 0),
        status: 'unlocked',
        unlockedAt: now(),
        createdAt: row.created_at,
      },
      ...spend,
    };
  }, (error) => {
    throw error;
  });
}

export async function getRevenueCatalog() {
  return {
    lockedMedia: { costTokens: 10, title: 'Unlock private media', description: 'Basic text stays free; only optional voice notes, HD photos, and premium media previews use tokens.' },
    videoRequest: { costTokens: 25, title: 'Accept video invite', description: 'Paid pop-up video requests create urgency after a Kenyan match.' },
    admirerReveal: { costTokens: 22, title: 'Reveal admirer', description: 'Show one blurred person who already liked you.' },
    priorityReply: { costTokens: 15, title: 'Priority message', description: 'Push one message to the top of her inbox.' },
    datePass: { costTokens: 40, title: 'Date pass', description: 'Unlock a guided date planner after mutual interest.' },
    streakSaver: { costTokens: 9, title: 'Save match streak', description: 'Keep an expiring match active for another day.' },
  };
}

export async function topUpWallet({ amount, platform, purchaseToken, transactionId, productId } = {}) {
  const value = Number(amount || 0);
  const nativePlatform = String(platform || '').toLowerCase();
  const hasNativeProof = ['google_play', 'app_store'].includes(nativePlatform) && Boolean(purchaseToken || transactionId) && Boolean(productId);
  const sandboxAllowed = process.env.ROMCHAT_ALLOW_SANDBOX_TOPUPS === 'true' && nativePlatform === 'sandbox';

  if (value <= 0) {
    const error = new Error('A positive token amount is required.');
    error.status = 400;
    throw error;
  }
  if (!hasNativeProof && !sandboxAllowed) {
    const error = new Error('RomChat token top-ups require a verified Google Play Billing or StoreKit purchase.');
    error.status = 402;
    throw error;
  }

  return withDb(async () => {
    const entry = { id: id('wl'), title: 'Native IAP wallet top-up', amount: value, createdAt: now(), platform: nativePlatform, productId };
    await queryWithRetry(
      'INSERT INTO romchat_wallet_ledger (id, member_id, title, amount, metadata) VALUES ($1,$2,$3,$4,$5)',
      [entry.id, 'me', entry.title, entry.amount, { platform: nativePlatform, productId, purchaseToken: purchaseToken || null, transactionId: transactionId || null }]
    );
    return { wallet: await getWallet(), entry };
  }, () => ({ wallet: { balance: 146 + value, currency: 'KES', ledger: [] }, entry: { id: id('wl'), title: 'Native IAP wallet top-up', amount: value, createdAt: now(), platform: nativePlatform, productId } }));
}
