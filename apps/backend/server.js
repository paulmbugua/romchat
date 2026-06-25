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
    'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173',
).split(',').map((origin) => origin.trim()).filter(Boolean);

app.use(cors({ origin: (origin, cb) => !origin || allowedOrigins.includes(origin) ? cb(null, true) : cb(new Error(`Not allowed by CORS: ${origin}`)), credentials: true }));
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

async function initDatabase() {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
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
    CREATE TABLE IF NOT EXISTS support_tickets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id UUID REFERENCES members(id) ON DELETE SET NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const members = [
    ['GS-0001', 'James K. Mwangi', 'james@grogonsacco.co.ke', '+254711204480', 'Kirinyaga Road', 'Premium', 4829450, 1864000, 250000, 'approved'],
    ['GS-0002', 'Amina Wanjiku', 'amina@karageautos.co.ke', '+254722948201', 'Kamukunji', 'Biashara', 1248800, 520000, 120000, 'verified'],
    ['GS-0003', 'Peter Otieno', 'peter@spannerworks.co.ke', '+254733119845', 'Grogon Lane', 'Jua Kali', 782100, 310000, 64000, 'pending'],
    ['GS-0004', 'Musa Ndungu', 'musa@dieselhub.co.ke', '+254700441322', 'Kirinyaga Road', 'Premium', 2350400, 940000, 180000, 'verified'],
  ];
  for (const member of members) {
    await pool.query(`INSERT INTO members (member_no, full_name, email, phone, shop_location, membership_tier, savings_balance, loan_balance, dividend_balance, kyc_status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (member_no) DO NOTHING`, member);
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
    await pool.query(`INSERT INTO loan_applications (member_id, loan_type, amount, term_months, purpose, status, monthly_repayment) VALUES ($1,'Equipment Financing',1200000,24,'Two-post lift, diagnostic scanner and compressor','approved',58800), ($2,'Working Capital',350000,12,'Bulk spare consumables and payroll bridge','under_review',32100), ($3,'Business Growth Fund',650000,18,'Paint booth expansion and service bay roofing','submitted',41400)`, [rows[0].id, rows[1].id, rows[2].id]);
  }
}

const money = (value) => Number(value || 0);
const memberShape = (row) => ({ id: row.id, memberNo: row.member_no, fullName: row.full_name, email: row.email, phone: row.phone, shopLocation: row.shop_location, membershipTier: row.membership_tier, status: row.status, savingsBalance: money(row.savings_balance), loanBalance: money(row.loan_balance), dividendBalance: money(row.dividend_balance), kycStatus: row.kyc_status, createdAt: row.created_at });

app.get('/', (_req, res) => res.json({ name: 'Grogon SACCO API', status: 'ok', location: 'Kirinyaga Road, Nairobi' }));
app.get('/healthz', (_req, res) => res.status(200).send('ok'));
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok', service: 'grogon-sacco-backend' }));
app.get('/api/sacco/summary', async (_req, res, next) => { try { const [{ rows: totals }, { rows: members }, { rows: loans }, { rows: txns }, { rows: tickets }] = await Promise.all([pool.query(`SELECT COUNT(*)::int members, COALESCE(SUM(savings_balance),0) savings, COALESCE(SUM(loan_balance),0) loans, COALESCE(SUM(dividend_balance),0) dividends FROM members`), pool.query('SELECT * FROM members ORDER BY created_at DESC LIMIT 8'), pool.query(`SELECT l.*, m.full_name, m.member_no FROM loan_applications l LEFT JOIN members m ON m.id = l.member_id ORDER BY l.created_at DESC LIMIT 8`), pool.query(`SELECT t.*, m.full_name, m.member_no FROM transactions t LEFT JOIN members m ON m.id = t.member_id ORDER BY t.created_at DESC LIMIT 12`), pool.query(`SELECT s.*, m.full_name, m.member_no FROM support_tickets s LEFT JOIN members m ON m.id = s.member_id ORDER BY s.created_at DESC LIMIT 8`)]); res.json({ totals: { members: totals[0].members, savings: money(totals[0].savings), loans: money(totals[0].loans), dividends: money(totals[0].dividends) }, members: members.map(memberShape), loans: loans.map((row) => ({ id: row.id, memberName: row.full_name, memberNo: row.member_no, loanType: row.loan_type, amount: money(row.amount), termMonths: row.term_months, purpose: row.purpose, status: row.status, monthlyRepayment: money(row.monthly_repayment), createdAt: row.created_at })), transactions: txns.map((row) => ({ id: row.id, memberName: row.full_name, memberNo: row.member_no, kind: row.kind, channel: row.channel, amount: money(row.amount), reference: row.reference, status: row.status, createdAt: row.created_at })), tickets: tickets.map((row) => ({ id: row.id, memberName: row.full_name, memberNo: row.member_no, subject: row.subject, message: row.message, status: row.status, createdAt: row.created_at })) }); } catch (error) { next(error); } });
app.post('/api/members/register', async (req, res, next) => { try { const { fullName, email, phone, shopLocation, membershipTier = 'Jua Kali' } = req.body; if (!fullName || !email || !phone || !shopLocation) return res.status(400).json({ message: 'fullName, email, phone and shopLocation are required' }); const memberNo = `GS-${crypto.randomInt(1000, 9999)}`; const { rows } = await pool.query(`INSERT INTO members (member_no, full_name, email, phone, shop_location, membership_tier, savings_balance) VALUES ($1,$2,$3,$4,$5,$6,2500) RETURNING *`, [memberNo, fullName, email, phone, shopLocation, membershipTier]); await pool.query('INSERT INTO transactions (member_id, kind, amount, reference) VALUES ($1,$2,$3,$4)', [rows[0].id, 'membership_fee', 2500, `JOIN-${memberNo}`]); res.status(201).json({ member: memberShape(rows[0]), message: 'Member registration submitted. KYC review is pending.' }); } catch (error) { next(error); } });
app.post('/api/loans/apply', async (req, res, next) => { try { const { memberId, loanType, amount, termMonths, purpose } = req.body; if (!loanType || !amount || !termMonths || !purpose) return res.status(400).json({ message: 'loanType, amount, termMonths and purpose are required' }); const monthlyRepayment = Math.round((Number(amount) * (1 + 0.012 * Number(termMonths))) / Number(termMonths)); const { rows } = await pool.query(`INSERT INTO loan_applications (member_id, loan_type, amount, term_months, purpose, monthly_repayment) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [memberId || null, loanType, amount, termMonths, purpose, monthlyRepayment]); res.status(201).json({ loan: rows[0], message: 'Loan application received for credit committee review.' }); } catch (error) { next(error); } });
app.post('/api/payments/record', async (req, res, next) => { try { const { memberId, kind = 'savings_deposit', amount, channel = 'M-Pesa' } = req.body; if (!amount) return res.status(400).json({ message: 'amount is required' }); const reference = `${channel.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${crypto.randomInt(100000, 999999)}`; const { rows } = await pool.query('INSERT INTO transactions (member_id, kind, channel, amount, reference) VALUES ($1,$2,$3,$4,$5) RETURNING *', [memberId || null, kind, channel, amount, reference]); if (memberId && kind === 'savings_deposit') await pool.query('UPDATE members SET savings_balance = savings_balance + $1 WHERE id = $2', [amount, memberId]); if (memberId && kind === 'loan_repayment') await pool.query('UPDATE members SET loan_balance = GREATEST(loan_balance - $1, 0) WHERE id = $2', [amount, memberId]); res.status(201).json({ transaction: rows[0], message: 'Payment posted.' }); } catch (error) { next(error); } });
app.post('/api/support/tickets', async (req, res, next) => { try { const { memberId, subject, message } = req.body; if (!subject || !message) return res.status(400).json({ message: 'subject and message are required' }); const { rows } = await pool.query('INSERT INTO support_tickets (member_id, subject, message) VALUES ($1,$2,$3) RETURNING *', [memberId || null, subject, message]); res.status(201).json({ ticket: rows[0], message: 'Support ticket opened.' }); } catch (error) { next(error); } });
app.use('/api', (_req, res) => res.status(404).json({ message: 'SACCO API route not found' }));
app.use((req, res) => res.status(404).json({ message: 'Route not found', path: req.originalUrl }));
app.use((err, _req, res, _next) => { console.error(err); const status = err.code === '23505' ? 409 : 500; res.status(status).json({ message: status === 409 ? 'A record with those details already exists.' : 'Internal server error' }); });

initDatabase().then(() => { app.listen(port, '0.0.0.0', () => console.log(`Grogon SACCO backend listening on port ${port}`)); }).catch((error) => { console.error('Failed to initialize database', error); process.exit(1); });
