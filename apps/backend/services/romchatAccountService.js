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

CREATE TABLE IF NOT EXISTS romchat_password_resets (
  email TEXT PRIMARY KEY,
  reset_hash TEXT NOT NULL,
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
  prompt_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  voice_intro_url TEXT,
  selfie_media_url TEXT,
  selfie_verified BOOLEAN NOT NULL DEFAULT false,
  verification_status TEXT NOT NULL DEFAULT 'not_started',
  profile_strength INTEGER NOT NULL DEFAULT 25,
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
  moderation_status TEXT NOT NULL DEFAULT 'pending_provider_review',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_romchat_profile_media_member_position ON romchat_profile_media(member_id, position, created_at);

ALTER TABLE romchat_member_profiles
  ADD COLUMN IF NOT EXISTS prompt_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS voice_intro_url TEXT,
  ADD COLUMN IF NOT EXISTS selfie_media_url TEXT,
  ADD COLUMN IF NOT EXISTS selfie_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'not_started';

ALTER TABLE romchat_profile_media DROP CONSTRAINT IF EXISTS romchat_profile_media_media_type_check;
ALTER TABLE romchat_profile_media ADD CONSTRAINT romchat_profile_media_media_type_check CHECK (media_type IN ('image','video','voice','selfie'));
`;

const id = (prefix) => `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
const hashOtp = (email, otp) => crypto.createHash('sha256').update(`${email.toLowerCase()}:${otp}:${jwtSecret}`).digest('hex');

async function sendRomChatEmail(to, subject, details, fallbackCode) {
  try {
    await sendNotification({
      to,
      subject,
      suppressErrorLog: true,
      details: {
        brandName: 'RomChat',
        brandColor: '#FF1493',
        brandEmoji: 'Love',
        ...details,
      },
    });
    return { delivered: true };
  } catch (error) {
    console.error('[romchat-email] delivery failed', { to, subject, code: error.code || null, message: error.message });
    if (process.env.NODE_ENV !== 'production' || process.env.ROMCHAT_ALLOW_EMAIL_FALLBACK === 'true') {
      console.warn('[romchat-email] development fallback code', { to, subject, code: fallbackCode });
      return { delivered: false, fallbackCode, warning: 'Email delivery is not configured. Use the logged development code.' };
    }
    return { delivered: false, warning: 'Email delivery is temporarily unavailable. Please try again shortly.' };
  }
}

async function sendRomChatOtp(to, otp) {
  return sendRomChatEmail(to, 'Your RomChat verification code', {
    intro: 'Use this one-time RomChat code to verify your email and start building a real dating profile.',
    items: {
      'RomChat code': `<div style=\"font-size:28px;font-weight:800;letter-spacing:3px;color:#FF1493\">${otp}</div>`,
      Expires: `${otpTtlMinutes} minutes`,
    },
    plainText: `Your RomChat verification code is: ${otp}\n\nThis code expires in ${otpTtlMinutes} minutes.`,
  }, otp);
}

async function sendRomChatPasswordReset(to, resetCode) {
  return sendRomChatEmail(to, 'Reset your RomChat password', {
    intro: 'We received a request to reset your RomChat password. Use this private code in the app to choose a new password.',
    items: {
      'Reset code': `<div style=\"font-size:32px;font-weight:900;letter-spacing:4px;color:#FF1493\">${resetCode}</div>`,
      Expires: '15 minutes',
      Security: 'If you did not request this, ignore this email and your password will stay unchanged.',
    },
    plainText: `Your RomChat password reset code is: ${resetCode}\n\nThis code expires in 15 minutes. If you did not request it, ignore this email.`,
  }, resetCode);
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
    promptAnswers: Array.isArray(row.prompt_answers) ? row.prompt_answers : [],
    voiceIntroUrl: row.voice_intro_url || media.find((item) => item.mediaType === 'voice')?.url || '',
    selfieMediaUrl: row.selfie_media_url || media.find((item) => item.mediaType === 'selfie')?.url || '',
    selfieVerified: Boolean(row.selfie_verified),
    verificationStatus: row.verification_status || 'not_started',
    profileStrength: Number(row.profile_strength || 0),
    media,
    imageCount: media.filter((item) => item.mediaType === 'image' || item.mediaType === 'selfie').length,
    videoCount: media.filter((item) => item.mediaType === 'video').length,
    voiceCount: media.filter((item) => item.mediaType === 'voice').length,
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
  const delivery = await sendRomChatOtp(cleanEmail, otp);
  return { email: cleanEmail, expiresInMinutes: otpTtlMinutes, message: delivery.delivered ? 'Verification code sent.' : delivery.warning, ...(delivery.fallbackCode ? { developmentCode: delivery.fallbackCode } : {}) };
}

export async function requestPasswordReset({ email }) {
  await ensureAccountSchema();
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
    const error = new Error('A valid email is required.');
    error.status = 400;
    throw error;
  }
  const existing = await queryWithRetry('SELECT id FROM romchat_accounts WHERE email = $1', [cleanEmail]);
  const resetCode = String(crypto.randomInt(100000, 999999));
  if (existing.rows.length) {
    await queryWithRetry(
      `INSERT INTO romchat_password_resets (email, reset_hash, expires_at, attempts)
       VALUES ($1,$2,now() + interval '15 minutes',0)
       ON CONFLICT (email) DO UPDATE SET reset_hash = EXCLUDED.reset_hash, expires_at = EXCLUDED.expires_at, attempts = 0, created_at = now()`,
      [cleanEmail, hashOtp(cleanEmail, resetCode)]
    );
    const delivery = await sendRomChatPasswordReset(cleanEmail, resetCode);
    return { email: cleanEmail, expiresInMinutes: 15, message: delivery.delivered ? 'Password reset code sent.' : delivery.warning, ...(delivery.fallbackCode ? { developmentCode: delivery.fallbackCode } : {}) };
  }
  return { email: cleanEmail, expiresInMinutes: 15, message: 'If this email exists, a reset code has been sent.' };
}

export async function resetPasswordWithCode({ email, code, password }) {
  await ensureAccountSchema();
  const cleanEmail = String(email || '').trim().toLowerCase();
  const resetCode = String(code || '').trim();
  if (String(password || '').length < 6) {
    const error = new Error('Password must be at least 6 characters.');
    error.status = 400;
    throw error;
  }
  const result = await queryWithRetry('SELECT * FROM romchat_password_resets WHERE email = $1', [cleanEmail]);
  const pending = result.rows[0];
  if (!pending || new Date(pending.expires_at).getTime() < Date.now()) {
    const error = new Error('Reset code expired. Request a new code.');
    error.status = 400;
    throw error;
  }
  if (pending.reset_hash !== hashOtp(cleanEmail, resetCode)) {
    await queryWithRetry('UPDATE romchat_password_resets SET attempts = attempts + 1 WHERE email = $1', [cleanEmail]);
    const error = new Error('Invalid reset code.');
    error.status = 400;
    throw error;
  }
  const passwordHash = await bcrypt.hash(String(password), 10);
  const rows = await queryWithRetry('UPDATE romchat_accounts SET password_hash = $2, auth_provider = COALESCE(NULLIF(auth_provider, \'\'), \'email\'), updated_at = now() WHERE email = $1 RETURNING *', [cleanEmail, passwordHash]);
  await queryWithRetry('DELETE FROM romchat_password_resets WHERE email = $1', [cleanEmail]);
  const user = accountFromRow(rows.rows[0]);
  return { user, token: signSession(user), profile: await getMemberProfile(user.id) };
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
  const allowedAudiences = Array.from(new Set([
    process.env.ROMCHAT_GOOGLE_CLIENT_ID_WEB,
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    process.env.GOOGLE_CLIENT_ID_WEB,
    process.env.GOOGLE_CLIENT_ID,
    process.env.ROMCHAT_GOOGLE_CLIENT_ID_ANDROID,
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    process.env.GOOGLE_CLIENT_ID_ANDROID,
    process.env.ROMCHAT_GOOGLE_CLIENT_ID_IOS,
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    process.env.GOOGLE_CLIENT_ID_IOS,
    '164509786898-7ca20l8gli2hia1d8p06r55v81p9f2nh.apps.googleusercontent.com',
    '164509786898-3men3o0mi3tl2p4ktajsmc19qgkkgd88.apps.googleusercontent.com',
  ].filter(Boolean).flatMap((value) => String(value).split(',').map((item) => item.trim()).filter(Boolean))));
  console.info('[romchat-google] token:audiences', {
    requestId: diagnostics.requestId || null,
    tokenAudience: payload?.aud || null,
    configuredAudienceCount: allowedAudiences.length,
    audienceMatchedBeforeVerify: allowedAudiences.includes(String(payload?.aud || '')),
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
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({ idToken: rawToken, audience: allowedAudiences.length ? allowedAudiences : undefined });
    } catch (verifyError) {
      const error = new Error(`Google token audience mismatch. Token audience: ${payload?.aud || 'unknown'}`);
      error.status = 401;
      error.cause = verifyError;
      throw error;
    }
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
  const promptAnswers = Array.isArray(payload.promptAnswers) ? payload.promptAnswers.map((item) => ({ prompt: String(item?.prompt || '').trim().slice(0, 120), answer: String(item?.answer || '').trim().slice(0, 240) })).filter((item) => item.prompt && item.answer).slice(0, 7) : null;
  const mediaRows = await queryWithRetry('SELECT media_type, COUNT(*)::int AS count FROM romchat_profile_media WHERE member_id = $1 GROUP BY media_type', [memberId]);
  const mediaCounts = Object.fromEntries(mediaRows.rows.map((row) => [row.media_type, Number(row.count || 0)]));
  const imageCount = Number(mediaCounts.image || 0) + Number(mediaCounts.selfie || 0);
  const hasVoice = Number(mediaCounts.voice || 0) > 0;
  const strength = Math.min(100, 30 + Math.min(25, imageCount * 7) + (bio ? 12 : 0) + (interests.length ? 13 : 0) + (hasVoice ? 10 : 0) + (promptAnswers?.length === 7 ? 10 : 0));
  await queryWithRetry(
    `INSERT INTO romchat_member_profiles (member_id, display_name, age, gender, city, intent, bio, interests, prompt_answers, profile_strength)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,COALESCE($9::jsonb, '[]'::jsonb),$10)
     ON CONFLICT (member_id) DO UPDATE SET display_name = EXCLUDED.display_name, age = EXCLUDED.age, gender = EXCLUDED.gender, city = EXCLUDED.city, intent = EXCLUDED.intent, bio = EXCLUDED.bio, interests = EXCLUDED.interests, prompt_answers = COALESCE($9::jsonb, romchat_member_profiles.prompt_answers), profile_strength = EXCLUDED.profile_strength, updated_at = now()`,
    [memberId, displayName, age, gender, city, intent, bio, interests, promptAnswers ? JSON.stringify(promptAnswers) : null, strength]
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
  const insertedMedia = mediaFromRow(rows.rows[0]);
  if (insertedMedia.mediaType === 'voice') {
    await queryWithRetry('UPDATE romchat_member_profiles SET voice_intro_url = $2, updated_at = now() WHERE member_id = $1', [memberId, insertedMedia.url]);
  }
  if (insertedMedia.mediaType === 'selfie') {
    await queryWithRetry("UPDATE romchat_member_profiles SET selfie_media_url = $2, selfie_verified = true, verification_status = 'verified', updated_at = now() WHERE member_id = $1", [memberId, insertedMedia.url]);
  }
  const profile = await getMemberProfile(memberId);
  return { media: insertedMedia, profile };
}

export async function setMainProfilePhoto(memberId, mediaId) {
  await ensureAccountSchema();
  const selected = await queryWithRetry(
    "SELECT * FROM romchat_profile_media WHERE id = $1 AND member_id = $2 AND media_type IN ('image','selfie')",
    [mediaId, memberId]
  );
  const media = selected.rows[0];
  if (!media) {
    const error = new Error('Profile photo not found.');
    error.status = 404;
    throw error;
  }
  const existing = await queryWithRetry(
    "SELECT id FROM romchat_profile_media WHERE member_id = $1 AND media_type IN ('image','selfie') ORDER BY position ASC, created_at ASC",
    [memberId]
  );
  const orderedIds = [mediaId, ...existing.rows.map((row) => row.id).filter((id) => id !== mediaId)];
  for (let position = 0; position < orderedIds.length; position += 1) {
    await queryWithRetry('UPDATE romchat_profile_media SET position = $3 WHERE id = $1 AND member_id = $2', [orderedIds[position], memberId, position]);
  }
  return { media: mediaFromRow({ ...media, position: 0 }), profile: await getMemberProfile(memberId) };
}

export async function verifyMemberSelfie(memberId, payload = {}) {
  const result = await uploadMemberMedia(memberId, { ...payload, mediaType: 'selfie', fileName: payload.fileName || 'selfie-verification.jpg' });
  return { ...result, verification: { status: 'verified', selfieVerified: true, verifiedAt: new Date().toISOString() } };
}
