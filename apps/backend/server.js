import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import crypto from 'crypto';
import pg from 'pg';

const app = express();
const port = Number(process.env.PORT || 4000);
const { Pool } = pg;
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgres://postgres:Ariana2017%2A@127.0.0.1:5432/grogon_sacco',
  connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS || 5000),
});

const allowedOrigins = String(
  process.env.CORS_ALLOWED_ORIGINS ||
    'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174',
).split(',').map((origin) => origin.trim()).filter(Boolean);

function isAllowedDevOrigin(origin) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin) || isAllowedDevOrigin(origin)) return cb(null, true);
      return cb(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

const money = (value) => Number(value || 0);
const sha = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
const randomToken = () => crypto.randomBytes(32).toString('hex');
const adminRights = {
  super_admin: [
    'dashboard.read',
    'members.create',
    'members.update',
    'members.approve',
    'kyc.verify',
    'loans.review',
    'loans.approve',
    'transactions.post',
    'tickets.manage',
    'admins.manage',
    'audit.read',
  ],
  admin: [
    'dashboard.read',
    'members.create',
    'members.update',
    'kyc.verify',
    'loans.review',
    'transactions.post',
    'tickets.manage',
  ],
};

function adminShape(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    status: row.status,
    rights: row.rights || adminRights[row.role] || [],
    lastLoginAt: row.last_login_at,
    mustChangePassword: Boolean(row.must_change_password),
    createdAt: row.created_at,
  };
}

const memberShape = (row) => ({
  id: row.id,
  memberNo: row.member_no,
  fullName: row.full_name,
  email: row.email,
  phone: row.phone,
  shopLocation: row.shop_location,
  membershipTier: row.membership_tier,
  status: row.status,
  savingsBalance: money(row.savings_balance),
  loanBalance: money(row.loan_balance),
  dividendBalance: money(row.dividend_balance),
  kycStatus: row.kyc_status,
  onboardingStage: row.onboarding_stage || 'registered',
  assignedAdminId: row.assigned_admin_id,
  createdAt: row.created_at,
});

async function logAudit(adminId, action, entityType, entityId, details = {}) {
  await pool.query(
    'INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5)',
    [adminId || null, action, entityType, entityId || null, JSON.stringify(details)],
  );
}

async function initDatabase() {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE TABLE IF NOT EXISTS admin_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('super_admin','admin')),
      status TEXT NOT NULL DEFAULT 'active',
      rights JSONB NOT NULL DEFAULT '[]'::jsonb,
      must_change_password BOOLEAN NOT NULL DEFAULT false,
      last_login_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
      token_hash TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      member_no TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      shop_location TEXT NOT NULL,
      membership_tier TEXT NOT NULL DEFAULT 'Jua Kali',
      status TEXT NOT NULL DEFAULT 'active',
      savings_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
      loan_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
      dividend_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
      kyc_status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ALTER TABLE members ADD COLUMN IF NOT EXISTS onboarding_stage TEXT NOT NULL DEFAULT 'registered';
    ALTER TABLE members ADD COLUMN IF NOT EXISTS assigned_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL;
    ALTER TABLE members ADD COLUMN IF NOT EXISTS id_number TEXT;
    ALTER TABLE members ADD COLUMN IF NOT EXISTS kra_pin TEXT;
    ALTER TABLE members ADD COLUMN IF NOT EXISTS next_of_kin TEXT;
    ALTER TABLE members ADD COLUMN IF NOT EXISTS trade_category TEXT;
    CREATE TABLE IF NOT EXISTS onboarding_tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id UUID REFERENCES members(id) ON DELETE CASCADE,
      assigned_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
      task TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      due_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS loan_applications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id UUID REFERENCES members(id) ON DELETE SET NULL,
      loan_type TEXT NOT NULL,
      amount NUMERIC(14,2) NOT NULL,
      term_months INTEGER NOT NULL,
      purpose TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'submitted',
      monthly_repayment NUMERIC(14,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ALTER TABLE loan_applications ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES admin_users(id) ON DELETE SET NULL;
    ALTER TABLE loan_applications ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
    ALTER TABLE loan_applications ADD COLUMN IF NOT EXISTS decision_notes TEXT;
    CREATE TABLE IF NOT EXISTS transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id UUID REFERENCES members(id) ON DELETE SET NULL,
      kind TEXT NOT NULL,
      channel TEXT NOT NULL DEFAULT 'M-Pesa',
      amount NUMERIC(14,2) NOT NULL,
      reference TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'posted',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS posted_by UUID REFERENCES admin_users(id) ON DELETE SET NULL;
    CREATE TABLE IF NOT EXISTS support_tickets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id UUID REFERENCES members(id) ON DELETE SET NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS assigned_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL;
    ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS resolution TEXT;
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id UUID,
      details JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const seededAdmins = [
    [
      process.env.SUPER_ADMIN_NAME || 'SACCO Super Admin',
      (process.env.SUPER_ADMIN_EMAIL || 'superadmin@grogonsacco.co.ke').toLowerCase(),
      sha(process.env.SUPER_ADMIN_PASSWORD || 'GrogonSuper2026!'),
      'super_admin',
      JSON.stringify(adminRights.super_admin),
      false,
    ],
    [
      process.env.ADMIN_NAME || 'Member Onboarding Admin',
      (process.env.ADMIN_EMAIL || 'admin@grogonsacco.co.ke').toLowerCase(),
      sha(process.env.ADMIN_PASSWORD || 'GrogonAdmin2026!'),
      'admin',
      JSON.stringify(adminRights.admin),
      true,
    ],
  ];
  for (const admin of seededAdmins) {
    await pool.query(
      `INSERT INTO admin_users (full_name, email, password_hash, role, rights, must_change_password)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6)
       ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, rights = EXCLUDED.rights`,
      admin,
    );
  }

  const members = [
    ['GS-0001', 'James K. Mwangi', 'james@grogonsacco.co.ke', '+254711204480', 'Kirinyaga Road', 'Premium', 4829450, 1864000, 250000, 'approved', 'activated', 'Garage owner'],
    ['GS-0002', 'Amina Wanjiku', 'amina@karageautos.co.ke', '+254722948201', 'Kamukunji', 'Biashara', 1248800, 520000, 120000, 'verified', 'savings_active', 'Parts dealer'],
    ['GS-0003', 'Peter Otieno', 'peter@spannerworks.co.ke', '+254733119845', 'Grogon Lane', 'Jua Kali', 782100, 310000, 64000, 'pending', 'kyc_review', 'Mechanic'],
    ['GS-0004', 'Musa Ndungu', 'musa@dieselhub.co.ke', '+254700441322', 'Kirinyaga Road', 'Premium', 2350400, 940000, 180000, 'verified', 'loan_ready', 'Diesel specialist'],
  ];
  for (const member of members) {
    await pool.query(
      `INSERT INTO members
        (member_no, full_name, email, phone, shop_location, membership_tier, savings_balance, loan_balance, dividend_balance, kyc_status, onboarding_stage, trade_category)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (member_no) DO NOTHING`,
      member,
    );
  }

  const { rows } = await pool.query('SELECT id FROM members ORDER BY member_no LIMIT 4');
  const txnCount = await pool.query('SELECT COUNT(*)::int AS count FROM transactions');
  if (txnCount.rows[0].count === 0 && rows.length) {
    for (const txn of [[rows[0].id, 'savings_deposit', 45000, 'MPESA-GS001'], [rows[0].id, 'loan_repayment', 68500, 'MPESA-GS002'], [rows[0].id, 'dividend_credit', 250000, 'DIV-2026-001'], [rows[1].id, 'savings_deposit', 28000, 'MPESA-GS003'], [rows[2].id, 'membership_fee', 2500, 'CASH-GS004'], [rows[3].id, 'loan_disbursement', 750000, 'BANK-GS005']]) {
      await pool.query('INSERT INTO transactions (member_id, kind, amount, reference) VALUES ($1,$2,$3,$4) ON CONFLICT (reference) DO NOTHING', txn);
    }
  }
  const loanCount = await pool.query('SELECT COUNT(*)::int AS count FROM loan_applications');
  if (loanCount.rows[0].count === 0 && rows.length) {
    await pool.query(
      `INSERT INTO loan_applications (member_id, loan_type, amount, term_months, purpose, status, monthly_repayment)
       VALUES ($1,'Equipment Financing',1200000,24,'Two-post lift, diagnostic scanner and compressor','approved',58800),
              ($2,'Working Capital',350000,12,'Bulk spare consumables and payroll bridge','under_review',32100),
              ($3,'Business Growth Fund',650000,18,'Paint booth expansion and service bay roofing','submitted',41400)`,
      [rows[0].id, rows[1].id, rows[2].id],
    );
  }
}

async function requireAdmin(req, res, next) {
  try {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ message: 'Admin login required' });
    const { rows } = await pool.query(
      `SELECT a.* FROM admin_sessions s
       JOIN admin_users a ON a.id = s.admin_id
       WHERE s.token_hash = $1 AND s.expires_at > now() AND a.status = 'active'`,
      [sha(token)],
    );
    if (!rows[0]) return res.status(401).json({ message: 'Admin session expired' });
    req.admin = adminShape(rows[0]);
    next();
  } catch (error) {
    next(error);
  }
}

const requireRight = (right) => (req, res, next) => {
  if (!req.admin?.rights?.includes(right)) return res.status(403).json({ message: `Missing right: ${right}` });
  next();
};

app.get('/', (_req, res) => res.json({ name: 'Grogon SACCO API', status: 'ok', location: 'Kirinyaga Road, Nairobi' }));
app.get('/healthz', (_req, res) => res.status(200).send('ok'));
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok', service: 'grogon-sacco-backend' }));

app.post('/api/admin/auth/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').toLowerCase().trim();
    const password = String(req.body.password || '');
    const { rows } = await pool.query('SELECT * FROM admin_users WHERE email = $1 AND status = $2', [email, 'active']);
    const admin = rows[0];
    if (!admin || admin.password_hash !== sha(password)) return res.status(401).json({ message: 'Invalid admin credentials' });
    const token = randomToken();
    await pool.query('INSERT INTO admin_sessions (admin_id, token_hash, expires_at) VALUES ($1,$2,now() + interval \'12 hours\')', [admin.id, sha(token)]);
    await pool.query('UPDATE admin_users SET last_login_at = now() WHERE id = $1', [admin.id]);
    await logAudit(admin.id, 'admin.login', 'admin_user', admin.id, { email });
    res.json({ token, admin: adminShape(admin), demo: { superAdmin: 'superadmin@grogonsacco.co.ke / GrogonSuper2026!', admin: 'admin@grogonsacco.co.ke / GrogonAdmin2026!' } });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/auth/me', requireAdmin, (req, res) => res.json({ admin: req.admin }));
app.post('/api/admin/auth/change-password', requireAdmin, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Current and new password are required.' });
    if (String(newPassword).length < 10) return res.status(400).json({ message: 'Use at least 10 characters for the new password.' });
    if (newPassword === 'GrogonAdmin2026!' || newPassword === 'GrogonSuper2026!') return res.status(400).json({ message: 'Choose a private password, not an issued temporary password.' });
    const { rows } = await pool.query('SELECT * FROM admin_users WHERE id = $1', [req.admin.id]);
    if (!rows[0] || rows[0].password_hash !== sha(currentPassword)) return res.status(401).json({ message: 'Current password is incorrect.' });
    const updated = await pool.query(
      'UPDATE admin_users SET password_hash = $1, must_change_password = false WHERE id = $2 RETURNING id, full_name, email, role, status, rights, must_change_password, last_login_at, created_at',
      [sha(newPassword), req.admin.id],
    );
    await logAudit(req.admin.id, 'admin.password_changed', 'admin_user', req.admin.id, { forced: Boolean(rows[0].must_change_password) });
    res.json({ admin: adminShape(updated.rows[0]), message: 'Password changed. Your admin account is now secured.' });
  } catch (error) {
    next(error);
  }
});
app.post('/api/admin/auth/logout', requireAdmin, async (req, res, next) => {
  try {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    await pool.query('DELETE FROM admin_sessions WHERE token_hash = $1', [sha(token)]);
    res.json({ message: 'Logged out' });
  } catch (error) {
    next(error);
  }
});

async function getOperationalSummary() {
  const [{ rows: totals }, { rows: members }, { rows: loans }, { rows: txns }, { rows: tickets }, { rows: admins }, { rows: tasks }, { rows: audits }] =
    await Promise.all([
      pool.query(`SELECT COUNT(*)::int members, COALESCE(SUM(savings_balance),0) savings, COALESCE(SUM(loan_balance),0) loans, COALESCE(SUM(dividend_balance),0) dividends FROM members`),
      pool.query('SELECT * FROM members ORDER BY created_at DESC LIMIT 30'),
      pool.query(`SELECT l.*, m.full_name, m.member_no FROM loan_applications l LEFT JOIN members m ON m.id = l.member_id ORDER BY l.created_at DESC LIMIT 30`),
      pool.query(`SELECT t.*, m.full_name, m.member_no, a.full_name posted_by_name FROM transactions t LEFT JOIN members m ON m.id = t.member_id LEFT JOIN admin_users a ON a.id = t.posted_by ORDER BY t.created_at DESC LIMIT 30`),
      pool.query(`SELECT s.*, m.full_name, m.member_no, a.full_name assigned_admin_name FROM support_tickets s LEFT JOIN members m ON m.id = s.member_id LEFT JOIN admin_users a ON a.id = s.assigned_admin_id ORDER BY s.created_at DESC LIMIT 30`),
      pool.query('SELECT id, full_name, email, role, status, rights, must_change_password, last_login_at, created_at FROM admin_users ORDER BY created_at DESC'),
      pool.query(`SELECT ot.*, m.full_name member_name, m.member_no, a.full_name assigned_admin_name FROM onboarding_tasks ot LEFT JOIN members m ON m.id = ot.member_id LEFT JOIN admin_users a ON a.id = ot.assigned_admin_id ORDER BY ot.created_at DESC LIMIT 30`),
      pool.query(`SELECT al.*, a.full_name admin_name FROM audit_logs al LEFT JOIN admin_users a ON a.id = al.admin_id ORDER BY al.created_at DESC LIMIT 40`),
    ]);
  return {
    totals: {
      members: totals[0].members,
      savings: money(totals[0].savings),
      loans: money(totals[0].loans),
      dividends: money(totals[0].dividends),
      pendingKyc: members.filter((m) => m.kyc_status === 'pending').length,
      openTickets: tickets.filter((t) => t.status === 'open').length,
      loanQueue: loans.filter((l) => ['submitted', 'under_review'].includes(l.status)).length,
    },
    members: members.map(memberShape),
    loans: loans.map((row) => ({ id: row.id, memberName: row.full_name, memberNo: row.member_no, loanType: row.loan_type, amount: money(row.amount), termMonths: row.term_months, purpose: row.purpose, status: row.status, monthlyRepayment: money(row.monthly_repayment), decisionNotes: row.decision_notes, createdAt: row.created_at })),
    transactions: txns.map((row) => ({ id: row.id, memberName: row.full_name, memberNo: row.member_no, kind: row.kind, channel: row.channel, amount: money(row.amount), reference: row.reference, status: row.status, postedByName: row.posted_by_name, createdAt: row.created_at })),
    tickets: tickets.map((row) => ({ id: row.id, memberName: row.full_name, memberNo: row.member_no, subject: row.subject, message: row.message, status: row.status, resolution: row.resolution, assignedAdminName: row.assigned_admin_name, createdAt: row.created_at })),
    admins: admins.map(adminShape),
    tasks: tasks.map((row) => ({ id: row.id, memberId: row.member_id, memberName: row.member_name, memberNo: row.member_no, task: row.task, status: row.status, assignedAdminName: row.assigned_admin_name, dueAt: row.due_at, completedAt: row.completed_at, createdAt: row.created_at })),
    audits: audits.map((row) => ({ id: row.id, adminName: row.admin_name, action: row.action, entityType: row.entity_type, entityId: row.entity_id, details: row.details, createdAt: row.created_at })),
  };
}

app.get('/api/sacco/summary', async (_req, res, next) => {
  try {
    res.json(await getOperationalSummary());
  } catch (error) {
    next(error);
  }
});
app.get('/api/admin/operations', requireAdmin, requireRight('dashboard.read'), async (_req, res, next) => {
  try {
    res.json(await getOperationalSummary());
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/admins', requireAdmin, requireRight('admins.manage'), async (req, res, next) => {
  try {
    const { fullName, email, password, role = 'admin' } = req.body;
    if (!fullName || !email || !password || !adminRights[role]) return res.status(400).json({ message: 'fullName, email, password and valid role are required' });
    const { rows } = await pool.query(
      `INSERT INTO admin_users (full_name, email, password_hash, role, rights, must_change_password)
       VALUES ($1,$2,$3,$4,$5::jsonb,true) RETURNING id, full_name, email, role, status, rights, must_change_password, last_login_at, created_at`,
      [fullName, String(email).toLowerCase(), sha(password), role, JSON.stringify(adminRights[role])],
    );
    await logAudit(req.admin.id, 'admin.create', 'admin_user', rows[0].id, { email, role });
    res.status(201).json({ admin: adminShape(rows[0]), message: 'Admin account created.' });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/members/onboard', requireAdmin, requireRight('members.create'), async (req, res, next) => {
  try {
    const { fullName, email, phone, shopLocation, membershipTier = 'Jua Kali', idNumber, kraPin, nextOfKin, tradeCategory } = req.body;
    if (!fullName || !email || !phone || !shopLocation) return res.status(400).json({ message: 'fullName, email, phone and shopLocation are required' });
    const memberNo = `GS-${crypto.randomInt(1000, 9999)}`;
    const { rows } = await pool.query(
      `INSERT INTO members (member_no, full_name, email, phone, shop_location, membership_tier, savings_balance, assigned_admin_id, id_number, kra_pin, next_of_kin, trade_category, onboarding_stage)
       VALUES ($1,$2,$3,$4,$5,$6,2500,$7,$8,$9,$10,$11,'kyc_review') RETURNING *`,
      [memberNo, fullName, email, phone, shopLocation, membershipTier, req.admin.id, idNumber || null, kraPin || null, nextOfKin || null, tradeCategory || null],
    );
    await pool.query('INSERT INTO transactions (member_id, kind, amount, reference, posted_by) VALUES ($1,$2,$3,$4,$5)', [rows[0].id, 'membership_fee', 2500, `JOIN-${memberNo}`, req.admin.id]);
    await pool.query('INSERT INTO onboarding_tasks (member_id, assigned_admin_id, task, due_at) VALUES ($1,$2,$3,now() + interval \'3 days\')', [rows[0].id, req.admin.id, 'Verify ID, KRA PIN, workshop location and next of kin']);
    await logAudit(req.admin.id, 'member.onboard', 'member', rows[0].id, { memberNo });
    res.status(201).json({ member: memberShape(rows[0]), message: 'Member onboarded and KYC task opened.' });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/admin/members/:id', requireAdmin, requireRight('members.update'), async (req, res, next) => {
  try {
    const allowed = ['full_name', 'email', 'phone', 'shop_location', 'membership_tier', 'status', 'kyc_status', 'onboarding_stage', 'id_number', 'kra_pin', 'next_of_kin', 'trade_category'];
    const entries = Object.entries(req.body).filter(([key]) => allowed.includes(key));
    if (!entries.length) return res.status(400).json({ message: 'No valid member fields supplied' });
    const sets = entries.map(([key], index) => `${key} = $${index + 2}`).join(', ');
    const values = entries.map(([, value]) => value);
    const { rows } = await pool.query(`UPDATE members SET ${sets} WHERE id = $1 RETURNING *`, [req.params.id, ...values]);
    await logAudit(req.admin.id, 'member.update', 'member', req.params.id, req.body);
    res.json({ member: memberShape(rows[0]), message: 'Member record updated.' });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/members/:id/approve-kyc', requireAdmin, requireRight('kyc.verify'), async (req, res, next) => {
  try {
    const { rows } = await pool.query("UPDATE members SET kyc_status = 'approved', onboarding_stage = 'savings_active', status = 'active' WHERE id = $1 RETURNING *", [req.params.id]);
    await pool.query("UPDATE onboarding_tasks SET status = 'completed', completed_at = now() WHERE member_id = $1 AND status = 'open'", [req.params.id]);
    await logAudit(req.admin.id, 'member.kyc_approved', 'member', req.params.id, {});
    res.json({ member: memberShape(rows[0]), message: 'KYC approved and member activated.' });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/admin/loans/:id/decision', requireAdmin, requireRight('loans.review'), async (req, res, next) => {
  try {
    const { status, notes = '' } = req.body;
    const allowed = req.admin.rights.includes('loans.approve') ? ['under_review', 'approved', 'rejected', 'disbursed'] : ['under_review', 'rejected'];
    if (!allowed.includes(status)) return res.status(403).json({ message: 'This role cannot set that loan status.' });
    const { rows } = await pool.query('UPDATE loan_applications SET status = $1, decision_notes = $2, reviewed_by = $3, reviewed_at = now() WHERE id = $4 RETURNING *', [status, notes, req.admin.id, req.params.id]);
    if (status === 'disbursed') {
      await pool.query('UPDATE members SET loan_balance = loan_balance + $1, onboarding_stage = $2 WHERE id = $3', [rows[0].amount, 'loan_active', rows[0].member_id]);
      await pool.query('INSERT INTO transactions (member_id, kind, channel, amount, reference, posted_by) VALUES ($1,$2,$3,$4,$5,$6)', [rows[0].member_id, 'loan_disbursement', 'Bank', rows[0].amount, `LOAN-${crypto.randomInt(100000, 999999)}`, req.admin.id]);
    }
    await logAudit(req.admin.id, 'loan.decision', 'loan_application', req.params.id, { status, notes });
    res.json({ loan: rows[0], message: `Loan marked ${status}.` });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/transactions', requireAdmin, requireRight('transactions.post'), async (req, res, next) => {
  try {
    const { memberId, kind, amount, channel = 'M-Pesa', reference } = req.body;
    if (!memberId || !kind || !amount) return res.status(400).json({ message: 'memberId, kind and amount are required' });
    const ref = reference || `${channel.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${crypto.randomInt(100000, 999999)}`;
    const { rows } = await pool.query('INSERT INTO transactions (member_id, kind, channel, amount, reference, posted_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [memberId, kind, channel, amount, ref, req.admin.id]);
    if (kind === 'savings_deposit') await pool.query('UPDATE members SET savings_balance = savings_balance + $1 WHERE id = $2', [amount, memberId]);
    if (kind === 'loan_repayment') await pool.query('UPDATE members SET loan_balance = GREATEST(loan_balance - $1, 0) WHERE id = $2', [amount, memberId]);
    if (kind === 'dividend_credit') await pool.query('UPDATE members SET dividend_balance = dividend_balance + $1 WHERE id = $2', [amount, memberId]);
    await logAudit(req.admin.id, 'transaction.post', 'transaction', rows[0].id, { memberId, kind, amount, ref });
    res.status(201).json({ transaction: rows[0], message: 'Transaction posted on behalf of member.' });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/admin/tickets/:id', requireAdmin, requireRight('tickets.manage'), async (req, res, next) => {
  try {
    const { status = 'in_progress', resolution = '' } = req.body;
    const { rows } = await pool.query('UPDATE support_tickets SET status = $1, resolution = $2, assigned_admin_id = $3 WHERE id = $4 RETURNING *', [status, resolution, req.admin.id, req.params.id]);
    await logAudit(req.admin.id, 'ticket.update', 'support_ticket', req.params.id, { status, resolution });
    res.json({ ticket: rows[0], message: 'Ticket updated.' });
  } catch (error) {
    next(error);
  }
});

app.post('/api/members/register', async (req, res, next) => {
  try {
    const { fullName, email, phone, shopLocation, membershipTier = 'Jua Kali' } = req.body;
    if (!fullName || !email || !phone || !shopLocation) return res.status(400).json({ message: 'fullName, email, phone and shopLocation are required' });
    const memberNo = `GS-${crypto.randomInt(1000, 9999)}`;
    const { rows } = await pool.query(`INSERT INTO members (member_no, full_name, email, phone, shop_location, membership_tier, savings_balance) VALUES ($1,$2,$3,$4,$5,$6,2500) RETURNING *`, [memberNo, fullName, email, phone, shopLocation, membershipTier]);
    await pool.query('INSERT INTO transactions (member_id, kind, amount, reference) VALUES ($1,$2,$3,$4)', [rows[0].id, 'membership_fee', 2500, `JOIN-${memberNo}`]);
    res.status(201).json({ member: memberShape(rows[0]), message: 'Member registration submitted. KYC review is pending.' });
  } catch (error) {
    next(error);
  }
});
app.post('/api/loans/apply', async (req, res, next) => {
  try {
    const { memberId, loanType, amount, termMonths, purpose } = req.body;
    if (!loanType || !amount || !termMonths || !purpose) return res.status(400).json({ message: 'loanType, amount, termMonths and purpose are required' });
    const monthlyRepayment = Math.round((Number(amount) * (1 + 0.012 * Number(termMonths))) / Number(termMonths));
    const { rows } = await pool.query(`INSERT INTO loan_applications (member_id, loan_type, amount, term_months, purpose, monthly_repayment) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [memberId || null, loanType, amount, termMonths, purpose, monthlyRepayment]);
    res.status(201).json({ loan: rows[0], message: 'Loan application received for credit committee review.' });
  } catch (error) {
    next(error);
  }
});
app.post('/api/payments/record', async (req, res, next) => {
  try {
    const { memberId, kind = 'savings_deposit', amount, channel = 'M-Pesa' } = req.body;
    if (!amount) return res.status(400).json({ message: 'amount is required' });
    const reference = `${channel.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${crypto.randomInt(100000, 999999)}`;
    const { rows } = await pool.query('INSERT INTO transactions (member_id, kind, channel, amount, reference) VALUES ($1,$2,$3,$4,$5) RETURNING *', [memberId || null, kind, channel, amount, reference]);
    if (memberId && kind === 'savings_deposit') await pool.query('UPDATE members SET savings_balance = savings_balance + $1 WHERE id = $2', [amount, memberId]);
    if (memberId && kind === 'loan_repayment') await pool.query('UPDATE members SET loan_balance = GREATEST(loan_balance - $1, 0) WHERE id = $2', [amount, memberId]);
    res.status(201).json({ transaction: rows[0], message: 'Payment posted.' });
  } catch (error) {
    next(error);
  }
});
app.post('/api/support/tickets', async (req, res, next) => {
  try {
    const { memberId, subject, message } = req.body;
    if (!subject || !message) return res.status(400).json({ message: 'subject and message are required' });
    const { rows } = await pool.query('INSERT INTO support_tickets (member_id, subject, message) VALUES ($1,$2,$3) RETURNING *', [memberId || null, subject, message]);
    res.status(201).json({ ticket: rows[0], message: 'Support ticket opened.' });
  } catch (error) {
    next(error);
  }
});

app.use('/api', (_req, res) => res.status(404).json({ message: 'SACCO API route not found' }));
app.use((req, res) => res.status(404).json({ message: 'Route not found', path: req.originalUrl }));
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.code === '23505' ? 409 : 500;
  res.status(status).json({ message: status === 409 ? 'A record with those details already exists.' : 'Internal server error' });
});

initDatabase()
  .then(() => app.listen(port, '0.0.0.0', () => console.log(`Grogon SACCO backend listening on port ${port}`)))
  .catch((error) => {
    console.error('Failed to initialize database', error);
    process.exit(1);
  });
