import crypto from 'crypto';
import axios from 'axios';
import { queryWithRetry } from '../config/db.js';
import { getAccessToken, mpesaPassword, mpesaTimestamp, resolveStkCallbackUrl, shortcode, MPESA_BASE } from '../utils/mpesa.js';
import { normalizePhoneNumber } from '../utils/phoneUtils.js';

const now = () => new Date().toISOString();
const id = (prefix) => `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
const FREE_DAILY_LIKE_LIMIT = 30;

export const premiumPlans = [
  { id: 'free', name: 'Free', priceKes: 0, billing: 'monthly', perks: ['Verified browsing', 'Limited daily likes', 'Safety hub'], features: { canRewind: false, canSeeLikesSent: false, canSeeTopPicks: false, unlimitedLikes: false } },
  { id: 'gold', name: 'Gold', priceKes: 1000, billing: 'monthly', perks: ['Unlimited likes', 'See admirers', 'Undo swipes', 'Read receipts', 'Likes Sent', 'Top Picks'], features: { canRewind: true, canSeeLikesSent: true, canSeeTopPicks: true, unlimitedLikes: true }, priorityLikes: 5 },
  { id: 'platinum', name: 'Platinum', priceKes: 2400, billing: 'monthly', perks: ['Unlimited likes', 'See Likes Sent', 'Top Picks', 'Priority Likes', 'Passport mode', 'Weekly boost'], features: { canRewind: true, canSeeLikesSent: true, canSeeTopPicks: true, unlimitedLikes: true }, spotlightMinutes: 30, priorityLikes: 20 },
];

export const gifts = [
  { id: 'rose', name: 'Rose', tokenCost: 5, redeemableUsd: 0.4, animation: 'petal_burst' },
  { id: 'chai', name: 'Chai date', tokenCost: 12, redeemableUsd: 1.2, animation: 'steam_heart' },
  { id: 'spotlight', name: 'Spotlight note', tokenCost: 30, redeemableUsd: 3.5, animation: 'golden_ribbon' },
];

export const tokenPackages = [
  { id: 'tokens_100', amount: 100, priceKes: 250, unitPriceKes: 2.5, badge: null, productIds: { android: 'romchat_tokens_100', ios: 'romchat.tokens.100' } },
  { id: 'tokens_350', amount: 350, priceKes: 650, unitPriceKes: 1.85, badge: 'MOST POPULAR', productIds: { android: 'romchat_tokens_350', ios: 'romchat.tokens.350' } },
  { id: 'tokens_1000', amount: 1000, priceKes: 1500, unitPriceKes: 1.5, badge: 'BEST VALUE', productIds: { android: 'romchat_tokens_1000', ios: 'romchat.tokens.1000' } },
  { id: 'superlikes_15', amount: 225, superLikeCount: 15, priceKes: 3000, unitPriceKes: 200, badge: 'SUPER LIKES', productIds: { android: 'romchat_superlikes_15', ios: 'romchat.superlikes.15' } },
  { id: 'superlikes_30', amount: 450, superLikeCount: 30, priceKes: 4500, unitPriceKes: 150, badge: 'BEST SUPER VALUE', productIds: { android: 'romchat_superlikes_30', ios: 'romchat.superlikes.30' } },
];

export const boosts = [
  { id: 'local_peak_30', name: 'Peak-hour spotlight', priceKes: 6, durationMinutes: 30, multiplier: 8 },
  { id: 'passport_weekend', name: 'Passport weekend', priceKes: 12, durationMinutes: 4320, multiplier: 3 },
];

export const addOns = [
  { id: 'unblur_one', name: 'Unblur one admirer', priceKes: 1.99, description: 'Reveal one blurred like without a subscription.' },
  { id: 'undo_swipe', name: 'Undo swipe', priceKes: 0.99, description: 'Reverse the latest accidental pass.' },
  { id: 'priority_like', name: 'Priority like', priceKes: 2.49, description: 'Move a like to the top of the inbox.' },
  { id: 'single_read_receipt', name: 'Single read receipt', priceKes: 0.49, description: 'See whether one message was read.' },
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
    gender: 'female',
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
    gender: 'female',
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
    gender: 'male',
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

const schemaSql = "\nCREATE TABLE IF NOT EXISTS romchat_profiles (\n  id TEXT PRIMARY KEY,\n  name TEXT NOT NULL,\n  age INTEGER NOT NULL,\n  city TEXT NOT NULL,\n  gender TEXT NOT NULL DEFAULT 'female',\n  match_score INTEGER NOT NULL DEFAULT 80,\n  intent TEXT NOT NULL DEFAULT '',\n  prompt TEXT NOT NULL DEFAULT '',\n  voice_note TEXT NOT NULL DEFAULT '',\n  video_prompt TEXT NOT NULL DEFAULT '',\n  quote TEXT NOT NULL DEFAULT '',\n  song TEXT NOT NULL DEFAULT '',\n  gallery_count INTEGER NOT NULL DEFAULT 0,\n  tags TEXT[] NOT NULL DEFAULT '{}',\n  answers TEXT[] NOT NULL DEFAULT '{}',\n  poll JSONB NOT NULL DEFAULT '{}'::jsonb,\n  color TEXT NOT NULL DEFAULT '#ff2f73',\n  photo_key TEXT,\n  verified BOOLEAN NOT NULL DEFAULT false,\n  online BOOLEAN NOT NULL DEFAULT false,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS romchat_swipes (\n  id TEXT PRIMARY KEY,\n  actor_id TEXT NOT NULL DEFAULT 'me',\n  profile_id TEXT NOT NULL REFERENCES romchat_profiles(id) ON DELETE CASCADE,\n  action TEXT NOT NULL CHECK (action IN ('pass', 'like', 'super_like')),\n  matched BOOLEAN NOT NULL DEFAULT false,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS romchat_matches (\n  id TEXT PRIMARY KEY,\n  actor_id TEXT NOT NULL DEFAULT 'me',\n  profile_id TEXT NOT NULL REFERENCES romchat_profiles(id) ON DELETE CASCADE,\n  status TEXT NOT NULL DEFAULT 'active',\n  expires_at TIMESTAMPTZ,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  UNIQUE(actor_id, profile_id)\n);\n\nCREATE TABLE IF NOT EXISTS romchat_messages (\n  id TEXT PRIMARY KEY,\n  match_id TEXT NOT NULL,\n  sender_id TEXT NOT NULL,\n  text TEXT NOT NULL DEFAULT '',\n  media_url TEXT,\n  media_type TEXT,\n  gift_id TEXT,\n  priority BOOLEAN NOT NULL DEFAULT false,\n  view_once BOOLEAN NOT NULL DEFAULT false,\n  expires_at TIMESTAMPTZ,\n  read_at TIMESTAMPTZ,\n  risk TEXT NOT NULL DEFAULT 'clear',\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS romchat_privacy_settings (\n  member_id TEXT PRIMARY KEY DEFAULT 'me',\n  incognito BOOLEAN NOT NULL DEFAULT true,\n  screenshots_blocked BOOLEAN NOT NULL DEFAULT true,\n  visible_to_liked_only BOOLEAN NOT NULL DEFAULT true,\n  disappearing_default_seconds INTEGER NOT NULL DEFAULT 86400,\n  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS romchat_wallet_ledger (\n  id TEXT PRIMARY KEY,\n  member_id TEXT NOT NULL DEFAULT 'me',\n  title TEXT NOT NULL,\n  amount NUMERIC(12,2) NOT NULL,\n  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS romchat_subscriptions (\n  id TEXT PRIMARY KEY,\n  member_id TEXT NOT NULL DEFAULT 'me',\n  plan_id TEXT NOT NULL,\n  status TEXT NOT NULL DEFAULT 'active',\n  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  renews_at TIMESTAMPTZ\n);\n\nCREATE TABLE IF NOT EXISTS romchat_boosts (\n  id TEXT PRIMARY KEY,\n  member_id TEXT NOT NULL DEFAULT 'me',\n  boost_id TEXT NOT NULL,\n  profile_id TEXT NOT NULL DEFAULT 'me',\n  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  ends_at TIMESTAMPTZ NOT NULL\n);\n\nCREATE TABLE IF NOT EXISTS romchat_gifts (\n  id TEXT PRIMARY KEY,\n  gift_id TEXT NOT NULL,\n  match_id TEXT NOT NULL,\n  sender_id TEXT NOT NULL DEFAULT 'me',\n  note TEXT NOT NULL DEFAULT '',\n  token_cost INTEGER NOT NULL DEFAULT 0,\n  redeemable_usd NUMERIC(12,2) NOT NULL DEFAULT 0,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS romchat_reports (\n  id TEXT PRIMARY KEY,\n  reporter_id TEXT NOT NULL DEFAULT 'me',\n  profile_id TEXT,\n  type TEXT NOT NULL,\n  severity TEXT NOT NULL DEFAULT 'medium',\n  status TEXT NOT NULL DEFAULT 'open',\n  details TEXT,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS romchat_verification_requests (\n  id TEXT PRIMARY KEY,\n  member_id TEXT NOT NULL DEFAULT 'me',\n  name TEXT NOT NULL,\n  status TEXT NOT NULL DEFAULT 'manual_review',\n  risk TEXT NOT NULL DEFAULT 'low',\n  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE INDEX IF NOT EXISTS idx_romchat_messages_match_created ON romchat_messages(match_id, created_at);\nCREATE INDEX IF NOT EXISTS idx_romchat_swipes_actor_created ON romchat_swipes(actor_id, created_at);\nCREATE INDEX IF NOT EXISTS idx_romchat_reports_status ON romchat_reports(status);\nALTER TABLE romchat_swipes DROP CONSTRAINT IF EXISTS romchat_swipes_profile_id_fkey;\nALTER TABLE romchat_matches DROP CONSTRAINT IF EXISTS romchat_matches_profile_id_fkey;\n\nALTER TABLE romchat_profiles ADD COLUMN IF NOT EXISTS gender TEXT NOT NULL DEFAULT 'female';\n\nALTER TABLE romchat_messages\n  ADD COLUMN IF NOT EXISTS media_type TEXT,\n  ADD COLUMN IF NOT EXISTS locked BOOLEAN NOT NULL DEFAULT false,\n  ADD COLUMN IF NOT EXISTS unlock_cost_tokens INTEGER NOT NULL DEFAULT 0,\n  ADD COLUMN IF NOT EXISTS unlocked_by_actor BOOLEAN NOT NULL DEFAULT false,\n  ADD COLUMN IF NOT EXISTS message_kind TEXT NOT NULL DEFAULT \'text\';\n\nCREATE TABLE IF NOT EXISTS romchat_video_requests (\n  id TEXT PRIMARY KEY,\n  match_id TEXT NOT NULL,\n  sender_profile_id TEXT NOT NULL,\n  title TEXT NOT NULL,\n  teaser TEXT NOT NULL,\n  unlock_cost_tokens INTEGER NOT NULL DEFAULT 0,\n  status TEXT NOT NULL DEFAULT \'locked\',\n  unlocked_at TIMESTAMPTZ,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS romchat_token_unlocks (\n  id TEXT PRIMARY KEY,\n  member_id TEXT NOT NULL DEFAULT \'me\',\n  target_type TEXT NOT NULL CHECK (target_type IN (\'message\', \'video_request\', \'admirer\', \'read_receipt\', \'undo_swipe\')),\n  target_id TEXT NOT NULL,\n  cost_tokens INTEGER NOT NULL,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  UNIQUE(member_id, target_type, target_id)\n);\n\nCREATE TABLE IF NOT EXISTS romchat_notifications (\n  id TEXT PRIMARY KEY,\n  member_id TEXT NOT NULL,\n  match_id TEXT NOT NULL,\n  type TEXT NOT NULL,\n  title TEXT NOT NULL,\n  body TEXT NOT NULL DEFAULT \'\',\n  read_at TIMESTAMPTZ,\n  metadata JSONB NOT NULL DEFAULT \'{}\'::jsonb,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE INDEX IF NOT EXISTS idx_romchat_notifications_member_created ON romchat_notifications(member_id, created_at DESC);\nCREATE INDEX IF NOT EXISTS idx_romchat_video_requests_match_created ON romchat_video_requests(match_id, created_at DESC);\nCREATE INDEX IF NOT EXISTS idx_romchat_token_unlocks_member_created ON romchat_token_unlocks(member_id, created_at DESC);\n\nCREATE TABLE IF NOT EXISTS romchat_payment_intents (\n  id TEXT PRIMARY KEY,\n  member_id TEXT NOT NULL DEFAULT 'me',\n  provider TEXT NOT NULL,\n  purpose TEXT NOT NULL,\n  amount_kes INTEGER NOT NULL,\n  tokens INTEGER NOT NULL DEFAULT 0,\n  plan_id TEXT,\n  status TEXT NOT NULL DEFAULT 'pending',\n  checkout_url TEXT,\n  phone TEXT,\n  reference TEXT NOT NULL,\n  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\nCREATE INDEX IF NOT EXISTS idx_romchat_payment_intents_member_created ON romchat_payment_intents(member_id, created_at DESC);\n\n";
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
    matchId: row.match_id || null,
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
    boosted: Boolean(row.boosted_now),
    distanceKm: Number(row.distance_km || 0),
    gender: row.gender || '',
  };
}


async function getActiveMatch(matchId, actorId = 'me') {
  const result = await queryWithRetry("SELECT * FROM romchat_matches WHERE id = $1 AND status = 'active'", [matchId]);
  const match = result.rows[0];
  if (!match || ![match.actor_id, match.profile_id].includes(actorId || 'me')) {
    const error = new Error('Only matched profiles can chat each other.');
    error.status = 403;
    error.code = 'MATCH_REQUIRED';
    throw error;
  }
  return match;
}

async function createNotification({ memberId, matchId, type, title, body = '', metadata = {} }) {
  await queryWithRetry(
    'INSERT INTO romchat_notifications (id, member_id, match_id, type, title, body, metadata) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [id('ntf'), memberId, matchId, type, title, body, metadata]
  );
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
        (id, name, age, city, gender, match_score, intent, prompt, voice_note, video_prompt, quote, song, gallery_count, tags, answers, poll, color, verified, online)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       ON CONFLICT (id) DO NOTHING`,
      [
        profile.id,
        profile.name,
        profile.age,
        profile.city,
        profile.gender,
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
      const viewerRows = await queryWithRetry('SELECT member_id, gender, city, latitude, longitude, max_distance_km, min_age, max_age, map_discovery_enabled FROM romchat_member_profiles WHERE member_id = $1', [viewerId]);
      viewer = viewerRows.rows[0] || null;
    }
    const viewerCoordinates = viewer ? rowCoordinates(viewer) : null;
    const maxDistanceKm = clampDistanceKm(viewer?.max_distance_km);
    const minAge = Number(viewer?.min_age || 18);
    const maxAge = Number(viewer?.max_age || 80);
    const mapDiscoveryEnabled = viewer?.map_discovery_enabled !== false;
    const viewerGender = String(viewer?.gender || '').toLowerCase();
    const desiredGender = viewerGender === 'female' ? 'male' : viewerGender === 'male' ? 'female' : null;
    let result = await queryWithRetry(
      `SELECT
         p.*,
         active_match.id AS match_id,
         EXISTS (
           SELECT 1 FROM romchat_boosts b
           WHERE b.profile_id = p.member_id AND b.ends_at > now()
         ) AS boosted_now,
         COALESCE(
           array_agg(m.url ORDER BY m.position ASC, m.created_at ASC)
             FILTER (WHERE m.media_type = 'image'),
           '{}'
         ) AS photos
       FROM romchat_member_profiles p
       JOIN romchat_profile_media m ON m.member_id = p.member_id AND m.media_type = 'image'
       LEFT JOIN romchat_matches active_match
         ON active_match.status = 'active'
        AND $1::text IS NOT NULL
        AND ((active_match.actor_id = $1 AND active_match.profile_id = p.member_id)
          OR (active_match.profile_id = $1 AND active_match.actor_id = p.member_id))
       WHERE ($1::text IS NULL OR p.member_id <> $1)
         AND ($2::boolean = false OR p.selfie_verified = true)
         AND ($3::text IS NULL OR lower(p.gender) = $3)
       GROUP BY p.member_id, active_match.id
       ORDER BY p.selfie_verified DESC, p.profile_strength DESC, p.updated_at DESC`,
      [viewerId, Boolean(verifiedOnly), desiredGender]
    );
    if (!result.rows.length && verifiedOnly) {
      result = await queryWithRetry(
        `SELECT
           p.*,
           active_match.id AS match_id,
           EXISTS (
             SELECT 1 FROM romchat_boosts b
             WHERE b.profile_id = p.member_id AND b.ends_at > now()
           ) AS boosted_now,
           COALESCE(
             array_agg(m.url ORDER BY m.position ASC, m.created_at ASC)
               FILTER (WHERE m.media_type = 'image'),
             '{}'
           ) AS photos
         FROM romchat_member_profiles p
         JOIN romchat_profile_media m ON m.member_id = p.member_id AND m.media_type = 'image'
         LEFT JOIN romchat_matches active_match
           ON active_match.status = 'active'
          AND $1::text IS NOT NULL
          AND ((active_match.actor_id = $1 AND active_match.profile_id = p.member_id)
            OR (active_match.profile_id = $1 AND active_match.actor_id = p.member_id))
         WHERE ($1::text IS NULL OR p.member_id <> $1)
           AND ($2::text IS NULL OR lower(p.gender) = $2)
         GROUP BY p.member_id, active_match.id
         ORDER BY p.selfie_verified DESC, p.profile_strength DESC, p.updated_at DESC`,
        [viewerId, desiredGender]
      );
    }
    return result.rows
      .map((row) => ({ ...row, distance_km: viewerCoordinates ? haversineKm(viewerCoordinates, rowCoordinates(row)) : 0 }))
      .filter((row) => !viewerCoordinates || !mapDiscoveryEnabled || Number(row.distance_km || 0) <= maxDistanceKm)
      .filter((row) => Number(row.age || 0) >= minAge && Number(row.age || 0) <= maxAge)
      .sort((a, b) => Number(Boolean(b.boosted_now)) - Number(Boolean(a.boosted_now)) || Number(a.distance_km || 0) - Number(b.distance_km || 0) || Number(b.profile_strength || 0) - Number(a.profile_strength || 0))
      .map((row) => fromMemberProfileRow(row, access));
  }, () => []);
}

export async function getMessages(matchId = 'match_elena', actorId = null) {
  return withDb(async () => {
    if (actorId) await getActiveMatch(matchId, actorId);
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

export async function getLikesSummary(memberId = null) {
  return withDb(async () => {
    if (!memberId) return { receivedCount: 0, sentCount: 0, sentProfileIds: [], topPickProfileIds: [] };
    const [received, sent, topPicks] = await Promise.all([
      queryWithRetry("SELECT COUNT(DISTINCT actor_id)::int AS received_count FROM romchat_swipes WHERE profile_id = $1 AND action IN ('like', 'super_like')", [memberId]),
      queryWithRetry("SELECT DISTINCT profile_id FROM romchat_swipes WHERE actor_id = $1 AND action IN ('like', 'super_like') ORDER BY profile_id", [memberId]),
      queryWithRetry(`SELECT candidate.member_id
         FROM romchat_member_profiles candidate
         JOIN romchat_member_profiles viewer ON viewer.member_id = $1
        WHERE candidate.member_id <> $1
        ORDER BY
          CASE WHEN lower(candidate.intent) = lower(viewer.intent) AND candidate.intent <> '' THEN 2 ELSE 0 END DESC,
          COALESCE((SELECT COUNT(*) FROM unnest(candidate.interests) ci JOIN unnest(viewer.interests) vi ON lower(ci) = lower(vi)), 0) DESC,
          candidate.selfie_verified DESC,
          candidate.profile_strength DESC,
          candidate.updated_at DESC
        LIMIT 12`, [memberId]),
    ]);
    const sentProfileIds = sent.rows.map((row) => row.profile_id).filter(Boolean);
    const topPickProfileIds = topPicks.rows.map((row) => row.member_id).filter(Boolean);
    return { receivedCount: Number(received.rows[0]?.received_count || 0), sentCount: sentProfileIds.length, sentProfileIds, topPickProfileIds };
  }, () => ({ receivedCount: 0, sentCount: 0, sentProfileIds: [], topPickProfileIds: [] }));
}

export async function getBootstrap({ catalogueAccess = 1, viewerId = null, verifiedOnly = false } = {}) {
  const [profiles, messages, privacy, wallet, likes, activeSubscription] = await Promise.all([
    getProfiles({ verifiedOnly, catalogueAccess, viewerId }),
    getMessages('match_elena'),
    getPrivacy(),
    getWallet(),
    getLikesSummary(viewerId),
    getActiveSubscription(viewerId),
  ]);
  return {
    app: { name: 'RomChat', tagline: 'Kenyan singles. Real vibes. Safer chats.', mode: process.env.ROMCHAT_MODE || 'demo' },
    me: { id: 'me', name: 'Nia', profileStrength: 94, verification: 'verified', safetyScore: 97 },
    profiles,
    messages,
    wallet,
    likes,
    safety: {
      verifiedOnlyDefault: true,
      screenshotWarnings: privacy.screenshotsBlocked,
      consentRequiredForCalls: true,
      mandatorySelfieVerification: true,
      antiScreengrab: privacy.screenshotsBlocked,
    },
    premium: { activeTier: activeSubscription?.plan_id || 'free', plans: premiumPlans },
    privacy,
  };
}

function deterministicPercent(input) {
  const hash = crypto.createHash('sha256').update(String(input)).digest();
  return hash[0] % 100;
}

function shouldCreateMutualMatch(profileId, action, profile) {
  if (action === 'pass') return false;
  const baseChance = action === 'super_like' ? 42 : 16;
  const score = Number(profile?.match || 0);
  const scoreBoost = score >= 94 ? 12 : score >= 88 ? 6 : 0;
  return deterministicPercent(String(profileId) + ':' + action + ':romchat-mutual') < baseChance + scoreBoost;
}

async function getActiveSubscription(memberId = 'me') {
  const active = await queryWithRetry(
    `SELECT plan_id, status, started_at, renews_at
     FROM romchat_subscriptions
     WHERE member_id = $1 AND status = 'active' AND (renews_at IS NULL OR renews_at > now())
     ORDER BY started_at DESC LIMIT 1`,
    [memberId || 'me']
  );
  return active.rows?.[0] || null;
}

async function hasUnlimitedLikes(memberId) {
  const active = await getActiveSubscription(memberId);
  const plan = premiumPlans.find((item) => item.id === active?.plan_id);
  return Boolean(plan?.features?.unlimitedLikes);
}

async function enforceDailyLikeLimit(memberId, action) {
  if (action !== 'like') return;
  if (await hasUnlimitedLikes(memberId)) return;
  const usage = await queryWithRetry(
    `SELECT COUNT(*)::int AS used,
            (date_trunc('day', now()) + interval '1 day') AS retry_at
     FROM romchat_swipes
     WHERE actor_id = $1 AND action = 'like' AND created_at >= date_trunc('day', now())`,
    [memberId || 'me']
  );
  const used = Number(usage.rows?.[0]?.used || 0);
  if (used < FREE_DAILY_LIKE_LIMIT) return;
  const error = new Error("You're out of Likes for today. Check back tomorrow to keep swiping, or upgrade for unlimited Likes.");
  error.status = 429;
  error.code = 'DAILY_LIKE_LIMIT_REACHED';
  error.limit = FREE_DAILY_LIKE_LIMIT;
  error.remaining = 0;
  error.retryAt = usage.rows?.[0]?.retry_at || null;
  throw error;
}

function matchIdFor(actorId, profileId) {
  return `match_${String(actorId || 'me').replace(/[^a-zA-Z0-9_]/g, '_')}_${String(profileId || '').replace(/[^a-zA-Z0-9_]/g, '_')}`;
}

export async function createSwipe({ profileId, action, actorId = 'me', forceMatch = false }) {
  if (!profileId || !['pass', 'like', 'super_like'].includes(action)) {
    const error = new Error('profileId and a valid action are required.');
    error.status = 400;
    throw error;
  }
  const profiles = await getProfiles({ verifiedOnly: false });
  const profile = profiles.find((item) => item.id === profileId);
  const matched = Boolean(forceMatch && action !== 'pass') || shouldCreateMutualMatch(profileId, action, profile);
  const swipeId = id('swipe');
  const matchId = matched ? matchIdFor(actorId || 'me', profileId) : null;

  return withDb(async () => {
    await enforceDailyLikeLimit(actorId || 'me', action);
    await queryWithRetry('INSERT INTO romchat_swipes (id, actor_id, profile_id, action, matched) VALUES ($1,$2,$3,$4,$5)', [swipeId, actorId || 'me', profileId, action, matched]);
    if (matched) {
      await queryWithRetry(
        `INSERT INTO romchat_matches (id, actor_id, profile_id, expires_at)
         VALUES ($1, $2, $3, now() + interval '24 hours')
         ON CONFLICT (actor_id, profile_id) DO UPDATE SET status = 'active'`,
        [matchId, actorId || 'me', profileId]
      );
    }
    return { id: swipeId, matched, matchId, message: matched ? 'Ni match. Say hi.' : 'Like sent. If they like you back, it becomes a match.' };
  }, () => ({ id: swipeId, matched, matchId, message: matched ? 'Ni match. Say hi.' : 'Like sent. If they like you back, it becomes a match.' }));
}

export async function sendMessage({ matchId = 'match_elena', text, actorId = 'me', expiresInSeconds = null, viewOnce = false, mediaUrl = null, mediaType = null, giftId = null, priority = false, readReceiptRequested = false, riskOverride = null }) {
  if (!String(text || '').trim() && !mediaUrl) {
    const error = new Error('Message text or mediaUrl is required.');
    error.status = 400;
    throw error;
  }
  const message = {
    id: id('msg'),
    matchId,
    senderId: actorId || 'me',
    from: actorId || 'me',
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
    const match = await getActiveMatch(matchId, actorId || 'me');
    const recipientId = match.actor_id === (actorId || 'me') ? match.profile_id : match.actor_id;
    await queryWithRetry(
      `INSERT INTO romchat_messages (id, match_id, sender_id, text, media_url, media_type, gift_id, priority, view_once, expires_at, risk)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [message.id, message.matchId, message.senderId, message.text, message.mediaUrl, message.mediaType, message.giftId, message.priority, message.viewOnce, message.expiresAt, message.risk]
    );
    await createNotification({
      memberId: recipientId,
      matchId,
      type: 'message',
      title: readReceiptRequested ? 'New RomChat message with read receipt' : 'New RomChat message',
      body: message.text.slice(0, 160),
      metadata: { messageId: message.id, viewOnce: message.viewOnce, expiresAt: message.expiresAt, readReceiptRequested: Boolean(readReceiptRequested) },
    });
    return { ...message, recipientId, notificationSent: true, readReceiptRequested: Boolean(readReceiptRequested) };
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
    await queryWithRetry('INSERT INTO romchat_wallet_ledger (id, member_id, title, amount, metadata) VALUES ($1,$2,$3,$4,$5)', [id('wl'), 'me', 'Profile boost', -Number(boost.priceKes || 0), { boostId: boost.id }]);
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
    const match = await getActiveMatch(entry.matchId);
    await queryWithRetry(
      'INSERT INTO romchat_gifts (id, gift_id, match_id, sender_id, note, token_cost, redeemable_usd) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [entry.id, entry.giftId, entry.matchId, 'me', entry.note, entry.tokenCost, entry.redeemableUsd]
    );
    await queryWithRetry('INSERT INTO romchat_wallet_ledger (id, member_id, title, amount, metadata) VALUES ($1,$2,$3,$4,$5)', [id('wl'), 'me', `Gift: ${gift.name}`, -gift.tokenCost, { giftId: gift.id }]);
    await createNotification({ memberId: match.profile_id, matchId: entry.matchId, type: 'gift', title: `RomChat gift: ${gift.name}`, body: entry.note || 'A match sent you a gift.', metadata: { giftId: gift.id, giftEntryId: entry.id } });
    return { gift: { ...entry, recipientId: match.profile_id, notificationSent: true }, wallet: await getWallet() };
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

export async function createVideoRequest({ matchId = 'match_elena', senderProfileId = null } = {}) {
  return withDb(async () => {
    const match = await getActiveMatch(matchId);
    const recipientId = senderProfileId || match.profile_id;
    const requestId = 'vr_' + matchId;
    await queryWithRetry(
      `INSERT INTO romchat_video_requests (id, match_id, sender_profile_id, title, teaser, unlock_cost_tokens, status)
       VALUES ($1,$2,$3,$4,$5,25,'locked')
       ON CONFLICT (id) DO UPDATE SET teaser = EXCLUDED.teaser`,
      [requestId, matchId, recipientId, '2-minute video vibe request', 'Pay 25 tokens to open a quick video vibe. Your match earns 20 tokens and RomChat keeps 5.']
    );
    await createNotification({ memberId: recipientId, matchId, type: 'video_request', title: '2-minute video vibe requested', body: 'A match wants to open a quick paid video vibe.', metadata: { requestId, costTokens: 25, recipientEarns: 20, platformFee: 5 } });
    return (await getVideoRequests(matchId)).find((request) => request.id === requestId) || null;
  }, () => null);
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
    if (row.status === 'unlocked') {
      return {
        videoRequest: {
          id: row.id,
          matchId: row.match_id,
          senderProfileId: row.sender_profile_id,
          title: row.title,
          teaser: row.teaser,
          unlockCostTokens: Number(row.unlock_cost_tokens || 0),
          status: 'unlocked',
          unlockedAt: row.unlocked_at,
          createdAt: row.created_at,
        },
        spent: 0,
        wallet: await getWallet(),
      };
    }
    const match = await getActiveMatch(row.match_id);
    const spend = await spendTokens({ targetType: 'video_request', targetId: requestId, costTokens: row.unlock_cost_tokens, title: 'Unlocked 2-minute video vibe' });
    await queryWithRetry('INSERT INTO romchat_wallet_ledger (id, member_id, title, amount, metadata) VALUES ($1,$2,$3,$4,$5)', [id('wl'), row.sender_profile_id, 'Video vibe creator share', 20, { requestId, matchId: row.match_id }]);
    await queryWithRetry('INSERT INTO romchat_wallet_ledger (id, member_id, title, amount, metadata) VALUES ($1,$2,$3,$4,$5)', [id('wl'), 'platform', 'Video vibe platform fee', 5, { requestId, matchId: row.match_id }]);
    await queryWithRetry("UPDATE romchat_video_requests SET status = 'unlocked', unlocked_at = now() WHERE id = $1", [requestId]);
    await createNotification({ memberId: match.profile_id, matchId: row.match_id, type: 'video_unlocked', title: 'Video vibe unlocked', body: 'Your match paid 25 tokens. You earned 20 tokens.', metadata: { requestId, recipientEarned: 20, platformFee: 5 } });
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


function maskPhone(phone = '') {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 6) return 'missing';
  return `${digits.slice(0, 5)}***${digits.slice(-2)}`;
}

async function initiateRomchatMpesaStk(payment) {
  const requestId = `rcpay_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
  const normalizedPhone = normalizePhoneNumber(payment.phone || '');
  if (!normalizedPhone) {
    const error = new Error('Enter a valid Kenyan M-Pesa phone number.');
    error.status = 400;
    error.code = 'MPESA_PHONE_REQUIRED';
    throw error;
  }
  const callbackUrl = process.env.ROMCHAT_MPESA_CALLBACK_URL || resolveStkCallbackUrl({ product: 'RomChat' });
  if (!callbackUrl) {
    const error = new Error('M-Pesa callback URL is not configured.');
    error.status = 500;
    error.code = 'MPESA_CALLBACK_MISSING';
    throw error;
  }
  const ts = mpesaTimestamp();
  const payload = {
    BusinessShortCode: shortcode,
    Password: mpesaPassword(ts),
    Timestamp: ts,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.max(1, Math.round(Number(payment.amountKes || 0))),
    PartyA: normalizedPhone,
    PartyB: shortcode,
    PhoneNumber: normalizedPhone,
    CallBackURL: callbackUrl,
    AccountReference: payment.id.slice(0, 12),
    TransactionDesc: `RomChat ${payment.purpose}`,
  };
  console.info('[romchat-payment] mpesa:stk:start', { requestId, paymentId: payment.id, amountKes: payment.amountKes, phone: maskPhone(normalizedPhone), callbackConfigured: Boolean(callbackUrl) });
  try {
    const accessToken = await getAccessToken();
    const response = await axios.post(`${MPESA_BASE}/mpesa/stkpush/v1/processrequest`, payload, { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 30000 });
    console.info('[romchat-payment] mpesa:stk:ok', { requestId, paymentId: payment.id, merchantRequestId: response.data?.MerchantRequestID || null, checkoutRequestId: response.data?.CheckoutRequestID || null, responseCode: response.data?.ResponseCode || null });
    return { providerReference: response.data?.CheckoutRequestID || payment.reference, merchantRequestId: response.data?.MerchantRequestID || null, response: response.data };
  } catch (error) {
    const providerError = error.response?.data || { message: error.message };
    console.warn('[romchat-payment] mpesa:stk:failed', { requestId, paymentId: payment.id, status: error.response?.status || null, providerError });
    const wrapped = new Error(providerError?.errorMessage || providerError?.ResponseDescription || providerError?.message || 'M-Pesa STK Push failed.');
    wrapped.status = 502;
    wrapped.code = 'MPESA_STK_FAILED';
    throw wrapped;
  }
}

async function initiateRomchatPaystackCheckout(payment, email = '') {
  const requestId = `rcpay_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    const error = new Error('Paystack secret key is not configured.');
    error.status = 500;
    error.code = 'PAYSTACK_SECRET_MISSING';
    throw error;
  }
  if (!email) {
    const error = new Error('A verified email is required for card checkout.');
    error.status = 400;
    error.code = 'PAYSTACK_EMAIL_REQUIRED';
    throw error;
  }
  const payload = {
    amount: Math.max(1, Math.round(Number(payment.amountKes || 0) * 100)),
    email,
    currency: 'KES',
    reference: payment.reference,
    callback_url: process.env.ROMCHAT_PAYSTACK_CALLBACK_URL || process.env.FRONTEND_URL || undefined,
    metadata: { paymentId: payment.id, memberId: payment.memberId, purpose: payment.purpose, planId: payment.planId, tokens: payment.tokens },
  };
  console.info('[romchat-payment] paystack:init:start', { requestId, paymentId: payment.id, amountKes: payment.amountKes, emailDomain: email.split('@')[1] || 'unknown' });
  try {
    const response = await axios.post('https://api.paystack.co/transaction/initialize', payload, { headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' }, timeout: 30000 });
    if (!response.data?.status || !response.data?.data?.authorization_url) throw new Error(response.data?.message || 'Paystack did not return a checkout URL.');
    console.info('[romchat-payment] paystack:init:ok', { requestId, paymentId: payment.id, reference: response.data.data.reference, hasCheckoutUrl: Boolean(response.data.data.authorization_url) });
    return { providerReference: response.data.data.reference || payment.reference, checkoutUrl: response.data.data.authorization_url, response: response.data.data };
  } catch (error) {
    const providerError = error.response?.data || { message: error.message };
    console.warn('[romchat-payment] paystack:init:failed', { requestId, paymentId: payment.id, status: error.response?.status || null, providerError });
    const wrapped = new Error(providerError?.message || 'Paystack checkout could not start.');
    wrapped.status = 502;
    wrapped.code = 'PAYSTACK_INIT_FAILED';
    throw wrapped;
  }
}

export async function getRevenueCatalog() {
  return {
    lockedMedia: { costTokens: 10, title: 'Unlock private media', description: 'Basic text stays free; only optional voice notes, HD photos, and premium media previews use tokens.' },
    admirerReveal: { costTokens: 22, title: 'Reveal admirer', description: 'Show one blurred person who already liked you.' },
    priorityReply: { costTokens: 15, title: 'Priority message', description: 'Push one message to the top of her inbox.' },
    datePass: { costTokens: 40, title: 'Date pass', description: 'Unlock a guided date planner after mutual interest.' },
    streakSaver: { costTokens: 9, title: 'Save match streak', description: 'Keep an expiring match active for another day.' },
  };
}

export async function createPaymentIntent({ memberId = 'me', provider, purpose = 'tokens', packageId = 'tokens_100', planId = null, phone = '', email = '' } = {}) {
  const normalizedProvider = String(provider || '').toLowerCase();
  if (!['mpesa', 'paystack'].includes(normalizedProvider)) {
    const error = new Error('Choose M-Pesa or Paystack card payment.');
    error.status = 400;
    throw error;
  }
  const tokenPackage = tokenPackages.find((item) => item.id === packageId) || tokenPackages[0];
  const plan = planId ? premiumPlans.find((item) => item.id === planId) : null;
  const amountKes = Number(plan?.priceKes || tokenPackage.priceKes || 0);
  const tokens = purpose === 'subscription' ? 0 : Number(tokenPackage.amount || 0);
  const payment = {
    id: id('pay'),
    memberId: memberId || 'me',
    provider: normalizedProvider,
    purpose,
    amountKes,
    tokens,
    planId: plan?.id || null,
    phone: phone || null,
    reference: `romchat_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    status: 'pending',
    checkoutUrl: null,
    instructions: normalizedProvider === 'mpesa' ? 'M-Pesa STK push sent. Enter your PIN to complete.' : 'Open Paystack card checkout to complete payment.',
    currency: 'KES',
  };
  const metadata = { email, packageId, packageKind: packageId?.startsWith('superlikes_') ? 'super_likes' : 'tokens', superLikeCount: tokenPackage.superLikeCount || null, unitPriceKes: tokenPackage.unitPriceKes || null };
  console.info('[romchat-payment] intent:start', { paymentId: payment.id, memberId: payment.memberId, provider: payment.provider, purpose: payment.purpose, amountKes: payment.amountKes, planId: payment.planId, packageId, hasPhone: Boolean(phone), hasEmail: Boolean(email) });
  const providerResult = normalizedProvider === 'mpesa'
    ? await initiateRomchatMpesaStk(payment)
    : await initiateRomchatPaystackCheckout(payment, email);
  payment.reference = providerResult.providerReference || payment.reference;
  payment.checkoutUrl = providerResult.checkoutUrl || null;
  const providerMetadata = { ...metadata, providerReference: payment.reference, merchantRequestId: providerResult.merchantRequestId || null, providerResponse: providerResult.response || null };
  return withDb(async () => {
    await queryWithRetry(
      `INSERT INTO romchat_payment_intents (id, member_id, provider, purpose, amount_kes, tokens, plan_id, status, checkout_url, phone, reference, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [payment.id, payment.memberId, payment.provider, payment.purpose, payment.amountKes, payment.tokens, payment.planId, payment.status, payment.checkoutUrl, payment.phone, payment.reference, providerMetadata]
    );
    console.info('[romchat-payment] intent:stored', { paymentId: payment.id, provider: payment.provider, reference: payment.reference, hasCheckoutUrl: Boolean(payment.checkoutUrl) });
    return { ...payment, packageKind: metadata.packageKind, superLikeCount: tokenPackage.superLikeCount || null };
  }, () => payment);
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
