import { GoogleAuth } from 'google-auth-library';
import { queryWithRetry } from '../config/db.js';
import { premiumPlans, tokenPackages } from './romchatRepository.js';

const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME || 'com.paulmbugua2.romchat1';
const playBase = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}`;

function credentialsFromEnv() {
  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    try {
      return JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    } catch {
      const error = new Error('Google Play billing is not configured on the server.');
      error.status = 503;
      error.code = 'PLAY_BILLING_NOT_CONFIGURED';
      throw error;
    }
  }
}

async function playRequest(path, options = {}) {
  const credentials = credentialsFromEnv();
  if (!credentials) {
    const error = new Error('Google Play billing is not configured on the server.');
    error.status = 503;
    error.code = 'PLAY_BILLING_NOT_CONFIGURED';
    throw error;
  }
  const auth = new GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/androidpublisher'] });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const response = await fetch(`${playBase}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token.token || token}`, 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error('Google Play could not verify this purchase.');
    error.status = response.status === 404 ? 400 : 502;
    error.code = 'PLAY_PURCHASE_VERIFICATION_FAILED';
    error.providerStatus = response.status;
    throw error;
  }
  return payload;
}

function productEntitlement(productId) {
  const tokenPackage = tokenPackages.find((item) => item.productIds?.android === productId);
  if (tokenPackage) return { kind: 'tokens', amount: Number(tokenPackage.amount || 0), title: `${tokenPackage.amount} RomChat Tokens` };
  const plan = premiumPlans.find((item) => `romchat_${item.id}` === productId);
  if (plan && plan.id !== 'free') return { kind: 'subscription', planId: plan.id, title: `RomChat ${plan.name}` };
  const error = new Error('This Google Play product is not available in RomChat.');
  error.status = 400;
  error.code = 'UNKNOWN_PLAY_PRODUCT';
  throw error;
}

export async function processGooglePlayPurchase({ memberId, productId, purchaseToken, transactionId } = {}) {
  if (!memberId || !purchaseToken || !productId) {
    const error = new Error('A valid Google Play purchase is required.');
    error.status = 400;
    throw error;
  }
  const entitlement = productEntitlement(productId);
  const existing = await queryWithRetry('SELECT * FROM romchat_google_play_purchases WHERE purchase_token = $1', [purchaseToken]);
  if (existing.rows[0]) {
    const wallet = await queryWithRetry('SELECT COALESCE(SUM(amount), 0) AS balance FROM romchat_wallet_ledger WHERE member_id = $1', [memberId]);
    return { verified: true, alreadyProcessed: true, entitlement: existing.rows[0].entitlement, walletBalance: Number(wallet.rows[0]?.balance || 0) };
  }

  let providerPurchase;
  if (entitlement.kind === 'subscription') {
    providerPurchase = await playRequest(`/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`);
    const lineItem = providerPurchase.lineItems?.find((item) => item.productId === productId);
    if (!lineItem || providerPurchase.subscriptionState !== 'SUBSCRIPTION_STATE_ACTIVE') {
      const error = new Error('This subscription is not active.');
      error.status = 402;
      error.code = 'PLAY_SUBSCRIPTION_NOT_ACTIVE';
      throw error;
    }
  } else {
    providerPurchase = await playRequest(`/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`);
    if (Number(providerPurchase.purchaseState) !== 0) {
      const error = new Error('This Google Play purchase is not complete.');
      error.status = 402;
      error.code = 'PLAY_PURCHASE_NOT_COMPLETE';
      throw error;
    }
  }

  const client = await (await import('../config/db.js')).default.connect();
  try {
    await client.query('BEGIN');
    const inserted = await client.query(
      `INSERT INTO romchat_google_play_purchases
       (purchase_token, transaction_id, member_id, product_id, entitlement, provider_payload)
       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (purchase_token) DO NOTHING RETURNING purchase_token`,
      [purchaseToken, transactionId || null, memberId, productId, entitlement, providerPurchase]
    );
    if (inserted.rowCount) {
      if (entitlement.kind === 'tokens') {
        await client.query(
          'INSERT INTO romchat_wallet_ledger (id, member_id, title, amount, metadata) VALUES ($1,$2,$3,$4,$5)',
          [`gplay_${Date.now()}_${Math.random().toString(16).slice(2)}`, memberId, entitlement.title, entitlement.amount, { platform: 'google_play', productId, purchaseToken }]
        );
      } else {
        const expiry = providerPurchase.lineItems?.find((item) => item.productId === productId)?.expiryTime || null;
        await client.query(
          `INSERT INTO romchat_subscriptions (id, member_id, plan_id, status, started_at, renews_at)
           VALUES ($1,$2,$3,'active',now(),$4)
           ON CONFLICT (id) DO NOTHING`,
          [`gplay_sub_${purchaseToken.slice(0, 40)}`, memberId, entitlement.planId, expiry]
        );
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  const wallet = await queryWithRetry('SELECT COALESCE(SUM(amount), 0) AS balance FROM romchat_wallet_ledger WHERE member_id = $1', [memberId]);
  return { verified: true, alreadyProcessed: false, entitlement, walletBalance: Number(wallet.rows[0]?.balance || 0) };
}
