import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import admin from 'firebase-admin';
import { queryWithRetry } from '../config/db.js';
import { sendNotification } from '../utils/sendNotification.js';
import { putRomchatMedia } from './romchatMediaStorage.js';

const googleClient = new OAuth2Client();
const jwtSecret = process.env.JWT_SECRET || process.env.ROMCHAT_JWT_SECRET || 'romchat-local-dev-secret';
const otpTtlMinutes = Number(process.env.ROMCHAT_OTP_TTL_MINUTES || 10);
let accountSchemaReady = false;

const accountSchemaSql = `
CREATE TABLE IF NOT EXISTS romchat_accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  name TEXT NOT NULL DEFAULT '',
  auth_provider TEXT NOT NULL DEFAULT 'email',
  google_id TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  token_balance INTEGER NOT NULL DEFAULT 45,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS romchat_email_otps (
  email TEXT PRIMARY KEY,
  otp_hash TEXT NOT NULL,
  pending_name TEXT NOT NULL,
  pending_password_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
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
  profile_strength INTEGER NOT NULL DEFAULT 25,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS romchat_profile_media (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES romchat_accounts(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image','video')),
  url TEXT NOT NULL,
  object_key TEXT NOT NULL,
  bucket TEXT NOT NULL,
  content_type TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  moderation_status TEXT NOT NULL DEFAULT 'pending_provider_review',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_romchat_profile_media_member_position ON romchat_profile_media(member_id, position, created_at);
`;

const id = (prefix) => `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
const hashOtp = (email, otp) => crypto.createHash('sha256').update(`${email.toLowerCase()}:${otp}:${jwtSecret}`).digest('hex');

async function sendRomChatOtp(to, otp) {
  await sendNotification({
    to,
    subject: 'Your RomChat verification code',
    details: {
      intro: 'Use this one-time RomChat code to verify your email and start building a real dating profile.',
      items: {
        'RomChat code': `<div style=\"font-size:28px;font-weight:800;letter-spacing:3px;color:#FF1493\">${otp}</div>`,
        Expires: `${otpTtlMinutes} minutes`,
      },
      plainText: `Your RomChat verification code is: ${otp}\n\nThis code expires in ${otpTtlMinutes} minutes.`,
    },
  });
}

async function ensureAccountSchema() {
  if (accountSchemaReady) return;
  await queryWithRetry(accountSchemaSql);
  accountSchemaReady = true;
}

function signSession(account) {
  return jwt.sign({ sub: account.id, email: account.email, scope: 'romchat' }, jwtSecret, { expiresIn: '30d' });
}

function accountFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name || '',
    emailVerified: Boolean(row.email_verified),
    provider: row.auth_provider || 'email',
    tokenBalance: Number(row.token_balance || 0),
  };
}

function profileFromRow(row, media = []) {
  if (!row) return null;
  return {
    memberId: row.member_id,
    displayName: row.display_name,
    age: Number(row.age),
    gender: row.gender,
    city: row.city,
    intent: row.intent || '',
    bio: row.bio || '',
    interests: row.interests || [],
    profileStrength: Number(row.profile_strength || 0),
    media,
    imageCount: media.filter((item) => item.mediaType === 'image').length,
    videoCount: media.filter((item) => item.mediaType === 'video').length,
  };
}

function mediaFromRow(row) {
  return {
    id: row.id,
    memberId: row.member_id,
    mediaType: row.media_type,
    url: row.url,
    key: row.object_key,
    bucket: row.bucket,
    contentType: row.content_type,
    position: Number(row.position || 0),
    moderationStatus: row.moderation_status,
    createdAt: row.created_at,
  };
}

export async function requestSignupOtp({ email, password, name }) {
  await ensureAccountSchema();
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanName = String(name || '').trim().slice(0, 80);
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
    const error = new Error('A valid email is required.');
    error.status = 400;
    throw error;
  }
  if (String(password || '').length < 6) {
    const error = new Error('Password must be at least 6 characters.');
    error.status = 400;
    throw error;
  }
  const existing = await queryWithRetry('SELECT id FROM romchat_accounts WHERE email = $1', [cleanEmail]);
  if (existing.rows.length) {
    const error = new Error('An account already exists for this email.');
    error.status = 409;
    throw error;
  }
  const otp = String(crypto.randomInt(100000, 999999));
  const passwordHash = await bcrypt.hash(String(password), 10);
  await queryWithRetry(
    `INSERT INTO romchat_email_otps (email, otp_hash, pending_name, pending_password_hash, expires_at, attempts)
     VALUES ($1,$2,$3,$4,now() + ($5::text || ' minutes')::interval,0)
     ON CONFLICT (email) DO UPDATE SET otp_hash = EXCLUDED.otp_hash, pending_name = EXCLUDED.pending_name, pending_password_hash = EXCLUDED.pending_password_hash, expires_at = EXCLUDED.expires_at, attempts = 0, created_at = now()`,
    [cleanEmail, hashOtp(cleanEmail, otp), cleanName || cleanEmail.split('@')[0], passwordHash, otpTtlMinutes]
  );
  await sendRomChatOtp(cleanEmail, otp);
  return { email: cleanEmail, expiresInMinutes: otpTtlMinutes, message: 'Verification code sent.' };
}

export async function verifySignupOtp({ email, otp }) {
  await ensureAccountSchema();
  const cleanEmail = String(email || '').trim().toLowerCase();
  const code = String(otp || '').trim();
  const result = await queryWithRetry('SELECT * FROM romchat_email_otps WHERE email = $1', [cleanEmail]);
  const pending = result.rows[0];
  if (!pending || new Date(pending.expires_at).getTime() < Date.now()) {
    const error = new Error('Verification code expired. Request a new code.');
    error.status = 400;
    throw error;
  }
  if (pending.otp_hash !== hashOtp(cleanEmail, code)) {
    await queryWithRetry('UPDATE romchat_email_otps SET attempts = attempts + 1 WHERE email = $1', [cleanEmail]);
    const error = new Error('Invalid verification code.');
    error.status = 400;
    throw error;
  }
  const account = {
    id: id('member'),
    email: cleanEmail,
    name: pending.pending_name,
  };
  const rows = await queryWithRetry(
    `INSERT INTO romchat_accounts (id, email, password_hash, name, auth_provider, email_verified)
     VALUES ($1,$2,$3,$4,'email',true)
     RETURNING *`,
    [account.id, account.email, pending.pending_password_hash, account.name]
  );
  await queryWithRetry('DELETE FROM romchat_email_otps WHERE email = $1', [cleanEmail]);
  const user = accountFromRow(rows.rows[0]);
  return { user, token: signSession(user), profile: null };
}

export async function loginWithPassword({ email, password }) {
  await ensureAccountSchema();
  const cleanEmail = String(email || '').trim().toLowerCase();
  const result = await queryWithRetry('SELECT * FROM romchat_accounts WHERE email = $1', [cleanEmail]);
  const row = result.rows[0];
  if (!row?.password_hash || !(await bcrypt.compare(String(password || ''), row.password_hash))) {
    const error = new Error('Invalid email or password.');
    error.status = 401;
    throw error;
  }
  if (!row.email_verified) {
    const error = new Error('Please verify your email before logging in.');
    error.status = 403;
    throw error;
  }
  const user = accountFromRow(row);
  return { user, token: signSession(user), profile: await getMemberProfile(user.id) };
}

function decodeJwtPayload(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(parts[1].length / 4) * 4, '='), 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

export async function loginWithGoogleToken({ idToken }, diagnostics = {}) {
  await ensureAccountSchema();
  const rawToken = String(idToken || '');
  const payload = decodeJwtPayload(rawToken);
  console.info('[romchat-google] token:decoded', {
    requestId: diagnostics.requestId || null,
    issuer: payload?.iss || null,
    audience: payload?.aud || null,
    emailVerified: payload?.email_verified ?? null,
    hasEmail: Boolean(payload?.email),
  });
  if (!payload) {
    const error = new Error('Malformed Google token.');
    error.status = 400;
    throw error;
  }
  const allowedAudiences = [
    process.env.GOOGLE_CLIENT_ID_WEB || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    process.env.GOOGLE_CLIENT_ID_ANDROID || process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    process.env.GOOGLE_CLIENT_ID_IOS || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  ].filter(Boolean);
  console.info('[romchat-google] token:audiences', {
    requestId: diagnostics.requestId || null,
    configuredAudienceCount: allowedAudiences.length,
    hasFirebaseProjectId: Boolean(process.env.FIREBASE_PROJECT_ID),
  });
  const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
  let email;
  let name;
  let googleId;

  if (typeof payload.iss === 'string' && payload.iss.startsWith('https://securetoken.google.com/')) {
    if (!firebaseProjectId || payload.aud !== firebaseProjectId) {
      const error = new Error('Firebase token audience mismatch.');
      error.status = 401;
      throw error;
    }
    if (!admin.apps.length) {
      admin.initializeApp({ projectId: firebaseProjectId });
    }
    const decoded = await admin.auth().verifyIdToken(rawToken);
    email = decoded.email;
    name = decoded.name || decoded.email;
    googleId = decoded.uid;
  } else {
    const ticket = await googleClient.verifyIdToken({ idToken: rawToken, audience: allowedAudiences.length ? allowedAudiences : undefined });
    const google = ticket.getPayload();
    if (!google?.email || google.email_verified === false) {
      const error = new Error('Google email is missing or unverified.');
      error.status = 401;
      throw error;
    }
    email = google.email;
    name = google.name || google.email;
    googleId = google.sub;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const rows = await queryWithRetry(
    `INSERT INTO romchat_accounts (id, email, name, auth_provider, google_id, email_verified)
     VALUES ($1,$2,$3,'google',$4,true)
     ON CONFLICT (email) DO UPDATE SET name = COALESCE(NULLIF(romchat_accounts.name,''), EXCLUDED.name), google_id = COALESCE(romchat_accounts.google_id, EXCLUDED.google_id), email_verified = true, updated_at = now()
     RETURNING *`,
    [id('member'), cleanEmail, String(name || cleanEmail).slice(0, 80), googleId]
  );
  const user = accountFromRow(rows.rows[0]);
  return { user, token: signSession(user), profile: await getMemberProfile(user.id) };
}

export async function verifyRomchatToken(token) {
  await ensureAccountSchema();
  const raw = String(token || '').replace(/^Bearer\s+/i, '');
  if (!raw) return null;
  try {
    const decoded = jwt.verify(raw, jwtSecret);
    if (decoded.scope !== 'romchat') return null;
    const result = await queryWithRetry('SELECT * FROM romchat_accounts WHERE id = $1', [decoded.sub]);
    return accountFromRow(result.rows[0]);
  } catch {
    return null;
  }
}

export async function requireRomchatAccount(req) {
  const user = await verifyRomchatToken(req.headers.authorization || '');
  if (!user) {
    const error = new Error('RomChat login required.');
    error.status = 401;
    throw error;
  }
  return user;
}

export async function getMemberProfile(memberId) {
  await ensureAccountSchema();
  const mediaRows = await queryWithRetry('SELECT * FROM romchat_profile_media WHERE member_id = $1 ORDER BY position ASC, created_at ASC', [memberId]);
  const media = mediaRows.rows.map(mediaFromRow);
  const profileRows = await queryWithRetry('SELECT * FROM romchat_member_profiles WHERE member_id = $1', [memberId]);
  return profileFromRow(profileRows.rows[0], media);
}

export async function getAuthState(req) {
  const user = await requireRomchatAccount(req);
  const profile = await getMemberProfile(user.id);
  return {
    user,
    profile,
    onboarding: {
      needsProfile: !profile,
      needsFirstImage: !profile?.imageCount,
      imageCount: profile?.imageCount || 0,
      catalogueAccess: Math.min(6, Math.max(1, profile?.imageCount || 0)),
    },
  };
}

export async function upsertMemberProfile(memberId, payload = {}) {
  await ensureAccountSchema();
  const displayName = String(payload.displayName || payload.name || '').trim().slice(0, 80);
  const age = Number(payload.age || 0);
  const gender = String(payload.gender || '').trim().toLowerCase();
  const city = String(payload.city || '').trim().slice(0, 80);
  if (!displayName || age < 18 || !gender || !city) {
    const error = new Error('Display name, age 18+, gender, and city are required.');
    error.status = 400;
    throw error;
  }
  const bio = String(payload.bio || '').trim().slice(0, 280);
  const intent = String(payload.intent || '').trim().slice(0, 120);
  const interests = Array.isArray(payload.interests) ? payload.interests.map(String).map((item) => item.trim()).filter(Boolean).slice(0, 8) : [];
  const mediaRows = await queryWithRetry('SELECT COUNT(*)::int AS count FROM romchat_profile_media WHERE member_id = $1', [memberId]);
  const imageCount = Number(mediaRows.rows[0]?.count || 0);
  const strength = Math.min(100, 35 + Math.min(30, imageCount * 10) + (bio ? 15 : 0) + (interests.length ? 20 : 0));
  await queryWithRetry(
    `INSERT INTO romchat_member_profiles (member_id, display_name, age, gender, city, intent, bio, interests, profile_strength)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (member_id) DO UPDATE SET display_name = EXCLUDED.display_name, age = EXCLUDED.age, gender = EXCLUDED.gender, city = EXCLUDED.city, intent = EXCLUDED.intent, bio = EXCLUDED.bio, interests = EXCLUDED.interests, profile_strength = EXCLUDED.profile_strength, updated_at = now()`,
    [memberId, displayName, age, gender, city, intent, bio, interests, strength]
  );
  return getMemberProfile(memberId);
}

export async function uploadMemberMedia(memberId, payload = {}) {
  await ensureAccountSchema();
  const uploaded = await putRomchatMedia({
    memberId,
    mediaKind: payload.mediaType || 'image',
    contentType: payload.contentType,
    dataUri: payload.dataUri,
    base64: payload.base64,
    fileName: payload.fileName,
  });
  const count = await queryWithRetry('SELECT COUNT(*)::int AS count FROM romchat_profile_media WHERE member_id = $1', [memberId]);
  const position = Number(count.rows[0]?.count || 0);
  const mediaId = id('media');
  const rows = await queryWithRetry(
    `INSERT INTO romchat_profile_media (id, member_id, media_type, url, object_key, bucket, content_type, position)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [mediaId, memberId, uploaded.mediaType, uploaded.url, uploaded.key, uploaded.bucket, uploaded.contentType, position]
  );
  const profile = await getMemberProfile(memberId);
  return { media: mediaFromRow(rows.rows[0]), profile };
}
