import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import http from 'http';
import { Server } from 'socket.io';
import crypto from 'crypto';
import romchatRoutes from './routes/romchatRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { localMediaRoot } from './services/romchatMediaStorage.js';

const app = express();
const server = http.createServer(app);
const port = Number(process.env.PORT || 4000);
const allowedOrigins = String(
  process.env.CORS_ALLOWED_ORIGINS ||
    'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,https://romchat.co.ke,https://www.romchat.co.ke,https://server.romchat.co.ke,https://admin.romchat.co.ke',
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOriginMatchers = [
  ...allowedOrigins,
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
  /^https:\/\/([a-z0-9-]+\.)*romchat\.co\.ke$/,
];

function isAllowedOrigin(origin) {
  if (!origin) return true;
  return allowedOriginMatchers.some((matcher) =>
    typeof matcher === 'string' ? matcher === origin : matcher.test(origin),
  );
}

const corsOptions = {
  origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-Client-Platform'],
};

const io = new Server(server, {
  cors: corsOptions,
});

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(morgan('dev'));
app.use(express.json({ limit: '24mb' }));
app.use('/api/romchat/media-local', express.static(localMediaRoot, { fallthrough: false, maxAge: '1h' }));
app.use('/api/auth', authRoutes);
app.use('/api/romchat', romchatRoutes(io));

const now = () => new Date().toISOString();
const id = (prefix) => `${prefix}_${crypto.randomBytes(6).toString('hex')}`;

const profiles = [
  {
    id: 'elena',
    name: 'Elena',
    age: 26,
    city: 'New York',
    match: 94,
    intent: 'Long-term, slow burn',
    verified: true,
    online: true,
    interests: ['Architecture', 'Jazz', 'Mindful dating', 'Travel'],
    prompt: 'A perfect Sunday is coffee, galleries, and dinner where phones stay away.',
    trust: { identity: 'verified', liveness: 'passed', reports: 0, conversationPace: 'healthy' },
    voiceNote: 'Saturday jazz, morning markets, quiet confidence.',
    videoPrompt: 'Golden-hour walk through a design district.',
    vibePoll: { id: 'poll_elena_pizza', question: 'Pineapple on pizza?', options: [{ id: 'yes', label: 'Yes', votes: 62 }, { id: 'no', label: 'No', votes: 38 }] },
  },
  {
    id: 'amara',
    name: 'Amara',
    age: 29,
    city: 'Brooklyn',
    match: 91,
    intent: 'Ready for partnership',
    verified: true,
    online: false,
    interests: ['Cooking', 'Design', 'Film', 'Live music'],
    prompt: 'I plan tiny rituals, host thoughtful dinners, and remember the details.',
    trust: { identity: 'verified', liveness: 'passed', reports: 0, conversationPace: 'healthy' },
    voiceNote: 'I will remember your coffee order.',
    videoPrompt: 'Candlelit pasta night with a film queue.',
    vibePoll: { id: 'poll_amara_plans', question: 'Plan the date or freestyle?', options: [{ id: 'plan', label: 'Plan', votes: 74 }, { id: 'free', label: 'Freestyle', votes: 26 }] },
  },
  {
    id: 'noah',
    name: 'Noah',
    age: 31,
    city: 'Jersey City',
    match: 88,
    intent: 'Intentional connection',
    verified: true,
    online: true,
    interests: ['Startups', 'Running', 'Books', 'Rooftops'],
    prompt: 'Builder, runner, and the friend who books the table before anyone asks.',
    trust: { identity: 'verified', liveness: 'passed', reports: 0, conversationPace: 'healthy' },
    voiceNote: 'Sunday run, bookstore, rooftop sunset.',
    videoPrompt: 'City run ending at a skyline cafe.',
    vibePoll: { id: 'poll_noah_travel', question: 'Early flight or late checkout?', options: [{ id: 'early', label: 'Early flight', votes: 57 }, { id: 'late', label: 'Late checkout', votes: 43 }] },
  },
];

const messages = [
  { id: 'msg_1', matchId: 'match_elena', from: 'elena', text: 'Your answer about building a life with room for quiet days was rare.', createdAt: now(), risk: 'clear' },
  { id: 'msg_2', matchId: 'match_elena', from: 'me', text: 'I meant it. The best connection feels calm before it feels exciting.', createdAt: now(), risk: 'clear' },
  { id: 'msg_3', matchId: 'match_elena', from: 'elena', text: 'That deserves a golden-hour walk. Saturday?', createdAt: now(), risk: 'clear' },
];

const events = [
  { id: 'evt_golden', title: 'Golden Hour Social', date: 'Friday 8:00 PM', seats: 18, price: 24, status: 'selling' },
  { id: 'evt_mindful', title: 'Mindful Dating Workshop', date: 'Sunday 11:00 AM', seats: 9, price: 18, status: 'selling' },
];

const reports = [
  { id: 'rp_441', type: 'Harassment', severity: 'high', status: 'open', createdAt: now() },
  { id: 'rp_442', type: 'Off-platform payment', severity: 'medium', status: 'triage', createdAt: now() },
  { id: 'rp_443', type: 'Impersonation', severity: 'critical', status: 'open', createdAt: now() },
];

const verificationQueue = [
  { id: 'rv_101', memberId: 'elena', name: 'Elena Marquez', status: 'liveness_pending', risk: 'low', updatedAt: now() },
  { id: 'rv_102', memberId: 'amara', name: 'Amara Stone', status: 'manual_review', risk: 'medium', updatedAt: now() },
  { id: 'rv_103', memberId: 'noah', name: 'Noah Carter', status: 'verified', risk: 'low', updatedAt: now() },
];


const privacySettings = {
  incognito: true,
  screenshotsBlocked: true,
  disappearingDefaultSeconds: 86400,
  visibleToLikedOnly: true,
};

const premiumPlans = [
  { id: 'free', name: 'Free', priceUsd: 0, billing: 'monthly', perks: ['Verified browsing', 'Limited likes', 'Safety hub'] },
  { id: 'gold', name: 'Gold', priceUsd: 19, billing: 'monthly', perks: ['Unlimited likes', 'See who liked you', 'Undo swipes', 'Read receipts'], priorityLikes: 5 },
  { id: 'platinum', name: 'Platinum', priceUsd: 39, billing: 'monthly', perks: ['Priority likes', 'Passport mode', 'Weekly boost', 'Incognito included'], spotlightMinutes: 30, priorityLikes: 20 },
];

const gifts = [
  { id: 'rose', name: 'Rose', tokenCost: 12, redeemableUsd: 0.4, animation: 'petal_burst' },
  { id: 'coffee', name: 'Digital coffee', tokenCost: 30, redeemableUsd: 1.2, animation: 'steam_heart' },
  { id: 'spotlight', name: 'Spotlight note', tokenCost: 80, redeemableUsd: 3.5, animation: 'golden_ribbon' },
];

const boosts = [
  { id: 'local_peak_30', name: 'Peak-hour spotlight', priceUsd: 6, durationMinutes: 30, multiplier: 8 },
  { id: 'passport_weekend', name: 'Passport weekend', priceUsd: 12, durationMinutes: 4320, multiplier: 3 },
];

const addOns = [
  { id: 'unblur_one', name: 'Unblur one admirer', priceUsd: 1.99, description: 'Reveal one blurred like without a subscription.' },
  { id: 'undo_swipe', name: 'Undo swipe', priceUsd: 0.99, description: 'Reverse the latest accidental pass.' },
  { id: 'priority_like', name: 'Priority like', priceUsd: 2.49, description: 'Move a like to the top of the inbox.' },
  { id: 'single_read_receipt', name: 'Single read receipt', priceUsd: 0.49, description: 'See whether one message was read.' },
];

const subscriptions = [];
const boostLedger = [];
const giftLedger = [];

const wallet = {
  balance: 46,
  currency: 'USD',
  ledger: [
    { id: 'wl_1', title: 'Profile boost', amount: -6, createdAt: now() },
    { id: 'wl_2', title: 'Wallet top-up', amount: 52, createdAt: now() },
  ],
};

function bootstrap() {
  return {
    app: {
      name: 'RomChat',
      tagline: 'Intentional dating. Verified chemistry.',
      mode: process.env.ROMCHAT_MODE || 'demo',
    },
    me: {
      id: 'me',
      name: 'Mia',
      profileStrength: 86,
      verification: 'verified',
      safetyScore: 97,
    },
    profiles,
    messages,
    events,
    wallet,
    safety: {
      verifiedOnlyDefault: true,
      screenshotWarnings: privacySettings.screenshotsBlocked,
      consentRequiredForCalls: true,
      reportSlaMinutes: 15,
      mandatorySelfieVerification: true,
      antiScreengrab: privacySettings.screenshotsBlocked,
    },
    premium: { activeTier: 'gold', plans: premiumPlans },
    privacy: privacySettings,
  };
}

app.get('/', (_req, res) => {
  res.json({ name: 'RomChat API', status: 'online', version: '1.0.0', generatedAt: now() });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'romchat-backend', time: now() });
});

app.get('/api/mobile/version', (req, res) => {
  const platform = String(req.query.platform || req.get('x-client-platform') || '').toLowerCase();
  const isIos = platform === 'ios';
  const latestBuildNumber = Number.parseInt(
    isIos
      ? process.env.ROMCHAT_IOS_LATEST_BUILD_NUMBER || process.env.MOBILE_IOS_LATEST_BUILD_NUMBER || ''
      : process.env.ROMCHAT_ANDROID_LATEST_BUILD_NUMBER || process.env.MOBILE_ANDROID_LATEST_BUILD_NUMBER || '',
    10,
  );
  const minimumBuildNumber = Number.parseInt(
    isIos
      ? process.env.ROMCHAT_IOS_MIN_BUILD_NUMBER || process.env.MOBILE_IOS_MIN_BUILD_NUMBER || ''
      : process.env.ROMCHAT_ANDROID_MIN_BUILD_NUMBER || process.env.MOBILE_ANDROID_MIN_BUILD_NUMBER || '',
    10,
  );
  const androidStoreUrl =
    process.env.MOBILE_ANDROID_STORE_URL ||
    process.env.APP_ANDROID_STORE_URL ||
    'https://play.google.com/store/apps/details?id=com.paulmbugua2.romchat1';
  const iosStoreUrl = process.env.MOBILE_IOS_STORE_URL || process.env.APP_IOS_STORE_URL || '';

  res.json({
    latestVersion: process.env.MOBILE_LATEST_VERSION || process.env.APP_LATEST_VERSION || '1.0.0',
    minVersion: process.env.MOBILE_MIN_VERSION || process.env.APP_MIN_VERSION || '1.0.0',
    required:
      String(process.env.MOBILE_FORCE_UPDATE || process.env.APP_FORCE_UPDATE || 'false').toLowerCase() ===
      'true',
    message: process.env.MOBILE_UPDATE_MESSAGE || process.env.APP_UPDATE_MESSAGE || '',
    latestBuildNumber: Number.isFinite(latestBuildNumber) ? latestBuildNumber : null,
    minimumBuildNumber: Number.isFinite(minimumBuildNumber) ? minimumBuildNumber : null,
    storeUrl: isIos ? iosStoreUrl : androidStoreUrl,
    androidStoreUrl,
    iosStoreUrl,
  });
});

app.get('/api/romchat/bootstrap', (_req, res) => {
  res.json(bootstrap());
});

app.get('/api/romchat/discovery', (req, res) => {
  const verifiedOnly = String(req.query.verifiedOnly ?? 'true') !== 'false';
  res.json({ profiles: profiles.filter((profile) => !verifiedOnly || profile.verified), generatedAt: now() });
});

app.post('/api/romchat/swipes', (req, res) => {
  const { profileId, action } = req.body || {};
  if (!profileId || !['pass', 'like', 'super_like'].includes(action)) {
    return res.status(400).json({ message: 'profileId and a valid action are required.' });
  }
  const profile = profiles.find((item) => item.id === profileId);
  const matched = action !== 'pass' && profile?.match >= 88;
  io.emit('romchat:swipe', { profileId, action, matched, createdAt: now() });
  return res.status(201).json({ id: id('swipe'), matched, matchId: matched ? `match_${profileId}` : null, message: matched ? 'It is a match.' : 'Preference saved.' });
});

app.get('/api/romchat/messages/:matchId', (req, res) => {
  res.json({ messages: messages.filter((message) => message.matchId === req.params.matchId), generatedAt: now() });
});

app.post('/api/romchat/messages', (req, res) => {
  const { matchId = 'match_elena', text, expiresInSeconds = null, viewOnce = false, mediaUrl = null, giftId = null, priority = false } = req.body || {};
  if (!String(text || '').trim()) return res.status(400).json({ message: 'Message text is required.' });
  const risk = /money|wire|crypto|password/i.test(text) ? 'review' : 'clear';
  const message = { id: id('msg'), matchId, from: 'me', text: String(text).trim(), mediaUrl, giftId, priority, viewOnce: Boolean(viewOnce), expiresAt: expiresInSeconds ? new Date(Date.now() + Number(expiresInSeconds) * 1000).toISOString() : null, readAt: null, createdAt: now(), risk };
  messages.push(message);
  io.to(matchId).emit('romchat:message', message);
  res.status(201).json({ message, trustInsight: risk === 'review' ? 'Message queued for trust review.' : 'Message delivered.' });
});

app.post('/api/romchat/calls', (req, res) => {
  const { matchId = 'match_elena', mode = 'video' } = req.body || {};
  const call = { id: id('call'), matchId, mode, status: 'consent_pending', startedAt: now(), safety: ['blur_enabled', 'instant_exit', 'report_button'] };
  io.to(matchId).emit('romchat:call', call);
  res.status(201).json(call);
});

app.get('/api/romchat/events', (_req, res) => {
  res.json({ events });
});

app.post('/api/romchat/events/:eventId/tickets', (req, res) => {
  const event = events.find((item) => item.id === req.params.eventId);
  if (!event) return res.status(404).json({ message: 'Event not found.' });
  if (event.seats <= 0) return res.status(409).json({ message: 'Event is sold out.' });
  event.seats -= 1;
  const ticket = { id: id('ticket'), eventId: event.id, price: event.price, status: 'confirmed', createdAt: now() };
  res.status(201).json({ ticket, event });
});

app.get('/api/romchat/wallet', (_req, res) => {
  res.json(wallet);
});

app.post('/api/romchat/wallet/topups', (req, res) => {
  const amount = Number(req.body?.amount || 0);
  if (amount <= 0) return res.status(400).json({ message: 'A positive amount is required.' });
  wallet.balance += amount;
  const entry = { id: id('wl'), title: 'Wallet top-up', amount, createdAt: now() };
  wallet.ledger.unshift(entry);
  res.status(201).json({ wallet, entry });
});

app.post('/api/romchat/verification', (req, res) => {
  const request = { id: id('rv'), memberId: req.body?.memberId || 'me', name: req.body?.name || 'RomChat member', status: 'manual_review', risk: 'low', updatedAt: now() };
  verificationQueue.unshift(request);
  res.status(201).json({ request, message: 'Verification submitted for review.' });
});

app.post('/api/romchat/reports', (req, res) => {
  const report = { id: id('rp'), type: req.body?.type || 'Safety report', severity: req.body?.severity || 'medium', status: 'open', createdAt: now() };
  reports.unshift(report);
  io.emit('romchat:report', report);
  res.status(201).json({ report, message: 'Report received by RomChat safety.' });
});


app.get('/api/romchat/features', (_req, res) => {
  res.json({
    premiumPlans,
    gifts,
    boosts,
    addOns,
    privacy: privacySettings,
    conversation: {
      readReceipts: true,
      typingIndicators: true,
      disappearingMessages: true,
      antiScamRisk: 'clear',
    },
    vibePolls: profiles.map((profile) => profile.vibePoll),
  });
});

app.post('/api/romchat/ai/icebreakers', (req, res) => {
  const { profileId, myInterests = [], tone = 'warm' } = req.body || {};
  const profile = profiles.find((item) => item.id === profileId) || profiles[0];
  const overlap = profile.interests.filter((interest) => myInterests.map(String).includes(interest));
  const anchor = overlap[0] || profile.interests[0] || 'your profile';
  res.json({
    openers: [
      `I noticed ${anchor} on your profile. What made it stick for you?`,
      `Your "${profile.intent}" energy feels rare. What does a good pace look like for you?`,
      tone === 'playful'
        ? `Quick vibe check: defend your answer to "${profile.vibePoll.question}" in one sentence.`
        : `Your prompt feels intentional. What kind of date would make that side of you show up?`,
    ],
  });
});

app.post('/api/romchat/ai/bio', (req, res) => {
  const { intent = 'intentional connection', interests = [], values = [] } = req.body || {};
  const interestText = interests.slice(0, 3).join(', ') || 'good conversation';
  const valueText = values.slice(0, 2).join(' and ') || 'kindness and consistency';
  res.json({
    bios: [
      `Looking for ${intent}. I light up around ${interestText}, and I care most about ${valueText}.`,
      `Dating with intention, humor, and follow-through. Best with someone who values ${valueText} and can make space for ${interestText}.`,
    ],
  });
});

app.patch('/api/romchat/privacy', (req, res) => {
  Object.assign(privacySettings, {
    incognito: typeof req.body?.incognito === 'boolean' ? req.body.incognito : privacySettings.incognito,
    screenshotsBlocked: typeof req.body?.screenshotsBlocked === 'boolean' ? req.body.screenshotsBlocked : privacySettings.screenshotsBlocked,
    visibleToLikedOnly: typeof req.body?.visibleToLikedOnly === 'boolean' ? req.body.visibleToLikedOnly : privacySettings.visibleToLikedOnly,
    disappearingDefaultSeconds: req.body?.disappearingDefaultSeconds === null || Number(req.body?.disappearingDefaultSeconds) > 0
      ? req.body.disappearingDefaultSeconds
      : privacySettings.disappearingDefaultSeconds,
  });
  io.emit('romchat:privacy', privacySettings);
  res.json({ privacy: privacySettings });
});

app.patch('/api/romchat/profile/prompts', (req, res) => {
  const profile = profiles.find((item) => item.id === (req.body?.profileId || 'elena')) || profiles[0];
  if (typeof req.body?.voiceNote === 'string') profile.voiceNote = req.body.voiceNote.slice(0, 240);
  if (typeof req.body?.videoPrompt === 'string') profile.videoPrompt = req.body.videoPrompt.slice(0, 240);
  if (req.body?.vibePoll?.question) profile.vibePoll = req.body.vibePoll;
  res.json({ profile });
});

app.post('/api/romchat/vibe-polls/:pollId/votes', (req, res) => {
  const profile = profiles.find((item) => item.vibePoll?.id === req.params.pollId);
  if (!profile) return res.status(404).json({ message: 'Vibe poll not found.' });
  const option = profile.vibePoll.options.find((entry) => entry.id === req.body?.optionId);
  if (!option) return res.status(400).json({ message: 'Valid optionId is required.' });
  option.votes += 1;
  io.emit('romchat:vibe-poll', profile.vibePoll);
  res.status(201).json({ poll: profile.vibePoll });
});

app.post('/api/romchat/messages/typing', (req, res) => {
  const event = { matchId: req.body?.matchId || 'match_elena', userId: req.body?.userId || 'me', typing: req.body?.typing !== false, at: now() };
  io.to(event.matchId).emit('romchat:typing', event);
  res.status(202).json(event);
});

app.post('/api/romchat/messages/read-receipts', (req, res) => {
  const messageIds = Array.isArray(req.body?.messageIds) ? req.body.messageIds : [];
  const readAt = now();
  messages.forEach((message) => {
    if (messageIds.includes(message.id) || message.matchId === req.body?.matchId) message.readAt = readAt;
  });
  const receipt = { matchId: req.body?.matchId || 'match_elena', messageIds, readAt };
  io.to(receipt.matchId).emit('romchat:read', receipt);
  res.json(receipt);
});

app.post('/api/romchat/messages/disappearing', (req, res) => {
  const { matchId = 'match_elena', text = '', mediaUrl = null, expiresInSeconds = 86400, viewOnce = false } = req.body || {};
  if (!String(text || mediaUrl || '').trim()) return res.status(400).json({ message: 'Text or mediaUrl is required.' });
  const message = {
    id: id('msg'),
    matchId,
    from: 'me',
    text: String(text).trim(),
    mediaUrl,
    viewOnce: Boolean(viewOnce),
    expiresAt: new Date(Date.now() + Number(expiresInSeconds) * 1000).toISOString(),
    readAt: null,
    createdAt: now(),
    risk: 'clear',
  };
  messages.push(message);
  io.to(matchId).emit('romchat:message', message);
  res.status(201).json({ message });
});

app.get('/api/romchat/premium', (_req, res) => {
  res.json({ plans: premiumPlans, addOns, subscriptions, activeTier: subscriptions[0]?.planId || 'gold' });
});

app.post('/api/romchat/subscriptions', (req, res) => {
  const plan = premiumPlans.find((item) => item.id === req.body?.planId);
  if (!plan || plan.id === 'free') return res.status(400).json({ message: 'A paid planId is required.' });
  const subscription = { id: id('sub'), planId: plan.id, status: 'active', startedAt: now(), renewsAt: new Date(Date.now() + 30 * 86400 * 1000).toISOString() };
  subscriptions.unshift(subscription);
  res.status(201).json({ subscription, plan });
});

app.post('/api/romchat/boosts', (req, res) => {
  const boost = boosts.find((item) => item.id === req.body?.boostId) || boosts[0];
  const activation = { id: id('boost'), boostId: boost.id, profileId: req.body?.profileId || 'me', startsAt: now(), endsAt: new Date(Date.now() + boost.durationMinutes * 60000).toISOString() };
  boostLedger.unshift(activation);
  io.emit('romchat:boost', activation);
  res.status(201).json({ boost: activation, catalog: boost });
});

app.post('/api/romchat/gifts', (req, res) => {
  const gift = gifts.find((item) => item.id === req.body?.giftId);
  if (!gift) return res.status(400).json({ message: 'Valid giftId is required.' });
  const entry = { id: id('gift'), giftId: gift.id, matchId: req.body?.matchId || 'match_elena', note: req.body?.note || '', tokenCost: gift.tokenCost, redeemableUsd: gift.redeemableUsd, createdAt: now() };
  giftLedger.unshift(entry);
  wallet.balance = Math.max(0, wallet.balance - gift.tokenCost);
  io.to(entry.matchId).emit('romchat:gift', entry);
  res.status(201).json({ gift: entry, wallet });
});

app.get('/api/admin/romchat/operations', (_req, res) => {
  res.json({
    totals: {
      members: 248910,
      matches: 64230,
      verifiedRate: 81,
      openReports: reports.filter((report) => report.status !== 'resolved').length,
      callsToday: 1482,
      revenue: 92400,
    },
    verificationQueue,
    reports,
    conversations: [
      { match: 'Mia and Elena', score: 98, state: 'healthy', last: 'Planning Saturday coffee.' },
      { match: 'Ari and Dana', score: 71, state: 'watch', last: 'Repeated phone-number pressure.' },
      { match: 'Noah and Sam', score: 87, state: 'healthy', last: 'Video call completed.' },
    ],
    events,
    generatedAt: now(),
  });
});

app.patch('/api/admin/romchat/verification/:id', (req, res) => {
  const item = verificationQueue.find((entry) => entry.id === req.params.id);
  if (!item) return res.status(404).json({ message: 'Verification item not found.' });
  item.status = req.body?.status || 'verified';
  item.risk = req.body?.risk || item.risk;
  item.updatedAt = now();
  res.json({ item, message: 'Verification updated.' });
});

app.patch('/api/admin/romchat/reports/:id', (req, res) => {
  const report = reports.find((entry) => entry.id === req.params.id);
  if (!report) return res.status(404).json({ message: 'Report not found.' });
  report.status = req.body?.status || 'resolved';
  res.json({ report, message: 'Report updated.' });
});

io.on('connection', (socket) => {
  socket.emit('romchat:ready', { socketId: socket.id, time: now() });
  socket.on('romchat:join', (matchId) => socket.join(matchId));
});

server.listen(port, () => {
  console.log(`RomChat API listening on ${port}`);
});
