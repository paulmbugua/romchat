import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { queryWithRetry } from '../config/db.js';

dotenv.config();

const REVIEWER_EMAIL = (process.env.ROMCHAT_REVIEWER_EMAIL || 'reviewer@romchat.co.ke').trim().toLowerCase();
const REVIEWER_PASSWORD = process.env.ROMCHAT_REVIEWER_PASSWORD;
const REVIEWER_ID = process.env.ROMCHAT_REVIEWER_MEMBER_ID || 'reviewer_romchat';

const now = () => new Date().toISOString();

const schemaSql = `
CREATE TABLE IF NOT EXISTS romchat_accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  name TEXT NOT NULL DEFAULT '',
  auth_provider TEXT NOT NULL DEFAULT 'email',
  google_id TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  token_balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS romchat_member_profiles (
  member_id TEXT PRIMARY KEY REFERENCES romchat_accounts(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  city TEXT NOT NULL,
  intent TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  interests TEXT[] NOT NULL DEFAULT '{}',
  prompt_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  voice_intro_url TEXT,
  selfie_media_url TEXT,
  selfie_verified BOOLEAN NOT NULL DEFAULT false,
  verification_status TEXT NOT NULL DEFAULT 'not_started',
  verification_method TEXT,
  verification_provider TEXT,
  verification_score NUMERIC(5,2),
  verification_events JSONB NOT NULL DEFAULT '[]'::jsonb,
  verified_at TIMESTAMPTZ,
  profile_strength INTEGER NOT NULL DEFAULT 25,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  max_distance_km INTEGER NOT NULL DEFAULT 80,
  min_age INTEGER NOT NULL DEFAULT 18,
  max_age INTEGER NOT NULL DEFAULT 80,
  map_discovery_enabled BOOLEAN NOT NULL DEFAULT true,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS romchat_profile_media (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES romchat_accounts(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image','video','voice','selfie')),
  url TEXT NOT NULL,
  object_key TEXT NOT NULL,
  bucket TEXT NOT NULL,
  content_type TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  moderation_status TEXT NOT NULL DEFAULT 'approved_for_review',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS romchat_swipes (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL DEFAULT 'me',
  profile_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('pass', 'like', 'super_like')),
  matched BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS romchat_matches (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL DEFAULT 'me',
  profile_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(actor_id, profile_id)
);

CREATE TABLE IF NOT EXISTS romchat_messages (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  media_url TEXT,
  media_type TEXT,
  gift_id TEXT,
  priority BOOLEAN NOT NULL DEFAULT false,
  view_once BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  risk TEXT NOT NULL DEFAULT 'clear',
  locked BOOLEAN NOT NULL DEFAULT false,
  unlock_cost_tokens INTEGER NOT NULL DEFAULT 0,
  unlocked_by_actor BOOLEAN NOT NULL DEFAULT false,
  message_kind TEXT NOT NULL DEFAULT 'text',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS romchat_wallet_ledger (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL DEFAULT 'me',
  title TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS romchat_subscriptions (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL DEFAULT 'me',
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  renews_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS romchat_notifications (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  match_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  read_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS romchat_reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL DEFAULT 'me',
  profile_id TEXT,
  reported_member_id TEXT,
  match_id TEXT,
  message_id TEXT,
  type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  details TEXT,
  reporter_note TEXT,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  moderation JSONB NOT NULL DEFAULT '{}'::jsonb,
  auto_blocked BOOLEAN NOT NULL DEFAULT false,
  resolution_note TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_romchat_profile_media_member_position ON romchat_profile_media(member_id, position, created_at);
CREATE INDEX IF NOT EXISTS idx_romchat_messages_match_created ON romchat_messages(match_id, created_at);
CREATE INDEX IF NOT EXISTS idx_romchat_swipes_actor_created ON romchat_swipes(actor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_romchat_notifications_member_created ON romchat_notifications(member_id, created_at DESC);
`;

const profiles = [
  {
    id: REVIEWER_ID,
    email: REVIEWER_EMAIL,
    name: 'RomChat Reviewer',
    displayName: 'Reviewer',
    age: 32,
    gender: 'male',
    city: 'Nairobi',
    intent: 'Reviewing the full RomChat dating flow',
    bio: 'Reusable review profile for marketplace browsing, likes, matches, chat, profile editing, payments, privacy, and safety checks.',
    interests: ['Coffee dates', 'Live music', 'Travel', 'Nairobi weekends', 'Serious relationship', 'Safety first'],
    latitude: -1.286389,
    longitude: 36.817223,
    photos: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=1200&q=85',
    ],
  },
  {
    id: 'reviewer_match_amina',
    email: 'amina.review@romchat.co.ke',
    name: 'Amina Review',
    displayName: 'Amina',
    age: 29,
    gender: 'female',
    city: 'Nairobi',
    intent: 'Serious relationship',
    bio: 'Coffee, honest effort, and warm conversation around Nairobi.',
    interests: ['Coffee dates', 'Afrobeats', 'Books', 'Travel', 'Serious relationship'],
    latitude: -1.292066,
    longitude: 36.821946,
    photos: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=85',
    ],
  },
  {
    id: 'reviewer_match_nia',
    email: 'nia.review@romchat.co.ke',
    name: 'Nia Review',
    displayName: 'Nia',
    age: 27,
    gender: 'female',
    city: 'Nakuru',
    intent: 'Long-term partner',
    bio: 'Road trips, family values, music, and intentional connection.',
    interests: ['Road trips', 'Live music', 'Faith', 'Cooking', 'Long-term partner'],
    latitude: -0.303099,
    longitude: 36.080025,
    photos: [
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1200&q=85',
    ],
  },
  {
    id: 'reviewer_pick_zuri',
    email: 'zuri.review@romchat.co.ke',
    name: 'Zuri Review',
    displayName: 'Zuri',
    age: 31,
    gender: 'female',
    city: 'Mombasa',
    intent: 'Intentional dating',
    bio: 'Coast weekends, kind energy, and a calm relationship pace.',
    interests: ['Beach walks', 'Swahili food', 'Film nights', 'Travel', 'Intentional dating'],
    latitude: -4.043477,
    longitude: 39.668206,
    photos: [
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',
    ],
  },
];

const promptAnswers = [
  { prompt: 'A perfect Kenyan date', answer: 'Coffee, laughter, and a walk where the conversation keeps going.' },
  { prompt: 'Green flags', answer: 'Respect, consistency, patience, and honest communication.' },
  { prompt: 'My weekend vibe', answer: 'Good food, music, errands done early, then something memorable.' },
  { prompt: 'I am looking for', answer: 'A safe, intentional connection with real chemistry.' },
  { prompt: 'Best first message', answer: 'Ask about something specific from my profile.' },
  { prompt: 'Small joy', answer: 'Sunsets, playlists, and someone who remembers the tiny details.' },
  { prompt: 'RomChat safety rule', answer: 'Keep early conversations in the app and report pressure quickly.' },
];

async function upsertAccount(profile, passwordHash) {
  await queryWithRetry(
    `INSERT INTO romchat_accounts (id, email, password_hash, name, auth_provider, email_verified, token_balance)
     VALUES ($1,$2,$3,$4,'email',true,0)
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       password_hash = COALESCE(EXCLUDED.password_hash, romchat_accounts.password_hash),
       name = EXCLUDED.name,
       auth_provider = 'email',
       email_verified = true,
       token_balance = 0,
       updated_at = now()`,
    [profile.id, profile.email, profile.id === REVIEWER_ID ? passwordHash : null, profile.name]
  );
}

async function upsertProfile(profile) {
  await queryWithRetry(
    `INSERT INTO romchat_member_profiles
      (member_id, display_name, age, gender, city, intent, bio, interests, prompt_answers, selfie_verified, verification_status, verification_method, verification_provider, verification_score, verified_at, profile_strength, latitude, longitude, max_distance_km, min_age, max_age, map_discovery_enabled, last_seen_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,true,'verified','review_seed_photo_check','romchat_review_seed',0.96,now(),96,$10,$11,120,18,55,true,now())
     ON CONFLICT (member_id) DO UPDATE SET
       display_name = EXCLUDED.display_name,
       gender = EXCLUDED.gender,
       city = EXCLUDED.city,
       intent = EXCLUDED.intent,
       bio = EXCLUDED.bio,
       interests = EXCLUDED.interests,
       prompt_answers = EXCLUDED.prompt_answers,
       selfie_verified = true,
       verification_status = 'verified',
       verification_method = 'review_seed_photo_check',
       verification_provider = 'romchat_review_seed',
       verification_score = 0.96,
       verified_at = COALESCE(romchat_member_profiles.verified_at, now()),
       profile_strength = 96,
       latitude = EXCLUDED.latitude,
       longitude = EXCLUDED.longitude,
       max_distance_km = EXCLUDED.max_distance_km,
       min_age = EXCLUDED.min_age,
       max_age = EXCLUDED.max_age,
       map_discovery_enabled = true,
       last_seen_at = now(),
       updated_at = now()`,
    [profile.id, profile.displayName, profile.age, profile.gender, profile.city, profile.intent, profile.bio, profile.interests, JSON.stringify(promptAnswers), profile.latitude, profile.longitude]
  );
}

async function replaceMedia(profile) {
  await queryWithRetry("DELETE FROM romchat_profile_media WHERE member_id = $1 AND object_key LIKE 'reviewer-seed/%'", [profile.id]);
  for (let index = 0; index < profile.photos.length; index += 1) {
    await queryWithRetry(
      `INSERT INTO romchat_profile_media (id, member_id, media_type, url, object_key, bucket, content_type, position, moderation_status)
       VALUES ($1,$2,'image',$3,$4,'review-seed','image/jpeg',$5,'approved')
       ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url, position = EXCLUDED.position, moderation_status = 'approved'`,
      [`media_${profile.id}_${index + 1}`, profile.id, profile.photos[index], `reviewer-seed/${profile.id}/${index + 1}.jpg`, index]
    );
  }
}

async function seedConversation(matchProfile) {
  const matchId = `match_${REVIEWER_ID}_${matchProfile.id}`;
  await queryWithRetry(
    `INSERT INTO romchat_matches (id, actor_id, profile_id, status, expires_at)
     VALUES ($1,$2,$3,'active',now() + interval '14 days')
     ON CONFLICT (actor_id, profile_id) DO UPDATE SET status = 'active', expires_at = EXCLUDED.expires_at`,
    [matchId, REVIEWER_ID, matchProfile.id]
  );
  await queryWithRetry(
    `INSERT INTO romchat_swipes (id, actor_id, profile_id, action, matched)
     VALUES ($1,$2,$3,'like',true)
     ON CONFLICT (id) DO NOTHING`,
    [`swipe_${REVIEWER_ID}_${matchProfile.id}`, REVIEWER_ID, matchProfile.id]
  );
  await queryWithRetry(
    `INSERT INTO romchat_swipes (id, actor_id, profile_id, action, matched)
     VALUES ($1,$2,$3,'like',true)
     ON CONFLICT (id) DO NOTHING`,
    [`swipe_${matchProfile.id}_${REVIEWER_ID}`, matchProfile.id, REVIEWER_ID]
  );
  const messages = [
    { id: `msg_${matchProfile.id}_1`, senderId: matchProfile.id, text: `Hi Reviewer, welcome to RomChat. Ask me about ${matchProfile.interests[0].toLowerCase()}.` },
    { id: `msg_${matchProfile.id}_2`, senderId: REVIEWER_ID, text: 'Thanks. I am checking that matches and messages deliver cleanly.' },
    { id: `msg_${matchProfile.id}_3`, senderId: matchProfile.id, text: 'Perfect. Text chat is free after a mutual match, and safety tools are available in chat.' },
  ];
  for (const message of messages) {
    await queryWithRetry(
      `INSERT INTO romchat_messages (id, match_id, sender_id, text, risk)
       VALUES ($1,$2,$3,$4,'clear')
       ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text`,
      [message.id, matchId, message.senderId, message.text]
    );
  }
  await queryWithRetry(
    `INSERT INTO romchat_notifications (id, member_id, match_id, type, title, body, metadata)
     VALUES ($1,$2,$3,'message','New RomChat message','A review match sent a safe test message.',$4)
     ON CONFLICT (id) DO NOTHING`,
    [`ntf_${matchProfile.id}_${REVIEWER_ID}`, REVIEWER_ID, matchId, { seeded: true, reviewer: true }]
  );
}

async function main() {
  if (!REVIEWER_PASSWORD || REVIEWER_PASSWORD.length < 8) {
    throw new Error('Set ROMCHAT_REVIEWER_PASSWORD to at least 8 characters.');
  }
  await queryWithRetry(schemaSql);
  const passwordHash = await bcrypt.hash(REVIEWER_PASSWORD, 10);
  for (const profile of profiles) {
    await upsertAccount(profile, passwordHash);
    await upsertProfile(profile);
    await replaceMedia(profile);
  }
  for (const matchProfile of profiles.filter((profile) => profile.id !== REVIEWER_ID).slice(0, 2)) {
    await seedConversation(matchProfile);
  }
  await queryWithRetry("DELETE FROM romchat_wallet_ledger WHERE member_id = $1 AND metadata->>'reviewerSeed' = 'true'", [REVIEWER_ID]);
  await queryWithRetry(
    `INSERT INTO romchat_wallet_ledger (id, member_id, title, amount, metadata)
     VALUES ($1,$2,'Reviewer wallet credit',150,$3)`,
    [`wl_${REVIEWER_ID}_review_credit`, REVIEWER_ID, { reviewerSeed: true, createdAt: now(), reason: 'App review can inspect token flows without real payment.' }]
  );
  await queryWithRetry(
    `INSERT INTO romchat_subscriptions (id, member_id, plan_id, status, renews_at)
     VALUES ($1,$2,'gold','active',now() + interval '30 days')
     ON CONFLICT (id) DO UPDATE SET status = 'active', renews_at = EXCLUDED.renews_at`,
    [`sub_${REVIEWER_ID}_gold`, REVIEWER_ID]
  );
  console.info('[romchat-reviewer-seed] ready', {
    email: REVIEWER_EMAIL,
    memberId: REVIEWER_ID,
    profileCount: profiles.length,
    matchedProfiles: 2,
    googleSignInRequired: false,
  });
  process.exit(0);
}

main().catch((error) => {
  console.error('[romchat-reviewer-seed] failed', { message: error.message, code: error.code || null });
  process.exit(1);
});

