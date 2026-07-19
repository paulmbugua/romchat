import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import http from 'http';
import { Server } from 'socket.io';
import crypto from 'crypto';

const app = express();
const server = http.createServer(app);
const port = Number(process.env.PORT || 4000);
const allowedOrigins = String(process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)),
    credentials: true,
  },
});

app.use(cors({
  origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)),
  credentials: true,
}));
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(morgan('dev'));
app.use(express.json({ limit: '5mb' }));

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
      screenshotWarnings: true,
      consentRequiredForCalls: true,
      reportSlaMinutes: 15,
    },
  };
}

app.get('/', (_req, res) => {
  res.json({ name: 'RomChat API', status: 'online', version: '1.0.0', generatedAt: now() });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'romchat-backend', time: now() });
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
  const { matchId = 'match_elena', text } = req.body || {};
  if (!String(text || '').trim()) return res.status(400).json({ message: 'Message text is required.' });
  const risk = /money|wire|crypto|password/i.test(text) ? 'review' : 'clear';
  const message = { id: id('msg'), matchId, from: 'me', text: String(text).trim(), createdAt: now(), risk };
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
