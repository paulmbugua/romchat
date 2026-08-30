import Constants from 'expo-constants';
import { Platform } from 'react-native';

export class ApiRequestError extends Error {
  status?: number;
  code?: string | null;
  payload?: unknown;

  constructor(message: string, options: { status?: number; code?: string | null; payload?: unknown } = {}) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = options.status;
    this.code = options.code;
    this.payload = options.payload;
  }
}

export type SaccoSummary = {
  totals: { members: number; savings: number; loans: number; dividends: number };
  members: any[];
  loans: any[];
  transactions: any[];
  tickets: any[];
};

export type GrogonUser = {
  id: string;
  email: string;
  fullName?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role?: 'member' | 'admin' | 'buyer' | 'seller' | string;
  isActive?: boolean;
};

export type MarketplaceProduct = {
  id: string;
  name: string;
  brand?: string | null;
  category?: string | null;
  vehicleType?: string | null;
  condition?: string | string[] | null;
  description?: string | null;
  imageUrl?: string | null;
  imageUrls?: string[] | string | null;
  priceKes?: number | string | null;
  sellerName?: string | null;
  sellerPhone?: string | null;
  sellerWhatsapp?: string | null;
  sellerLocation?: string | null;
  sellerVerified?: boolean | null;
  isTopAd?: boolean | null;
  isPremiumSeller?: boolean | null;
  rankingScore?: number | string | null;
  promotionPackage?: string | null;
  createdAt?: string | null;
  status?: string | null;
};

export type PromotionPackage = {
  code: 'top_7' | 'top_30' | string;
  name: string;
  amountKes: number;
  days: number;
  score: number;
};

export type SellerDashboard = {
  seller: {
    id: string;
    name: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
    location?: string;
    verified?: boolean;
    walletBalanceKes?: number | string;
    premiumUntil?: string | null;
  };
  products: MarketplaceProduct[];
  packages: PromotionPackage[];
  transactions?: Array<{ id: string; type: string; amountKes: number | string; status?: string; createdAt?: string }>;
  promotions?: Array<{ id: string; productId: string; packageCode: string; status: string; expiresAt?: string }>;
};

const TECHNICAL_ERROR_PATTERN = /(?:\[[a-z0-9_-]+:[a-z0-9_:-]+\]|\b(?:backend|console|stack|sql|postgres|database|firebase|audience mismatch|environment variable|certificate|localhost|network request failed|request failed with status)\b|https?:\/\/|\b(?:10|127|192\.168)\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?|\*{2,}[^\s]*@|(?:check|see)\s+(?:the\s+)?(?:backend|server|console))/i;

export function userFacingErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  const source = error as { message?: unknown; status?: number; code?: string } | null;
  const status = source?.status;
  const message = typeof source?.message === 'string' ? source.message.replace(/\s+/g, ' ').trim() : typeof error === 'string' ? error.replace(/\s+/g, ' ').trim() : '';
  const code = String(source?.code || '');
  if (/google|oauth|firebase|audience/i.test(code + ' ' + message)) return 'Google sign-in could not be completed. Please try again or use email login.';
  if (/invalid (?:email|credentials)|email or password|incorrect password/i.test(message)) return 'The email or password you entered is incorrect.';
  if (/network|failed to fetch|connection|timeout|timed out/i.test(message)) return 'We could not connect right now. Check your internet connection and try again.';
  if (message && message.length <= 220 && !TECHNICAL_ERROR_PATTERN.test(message)) return message;
  if (status === 400 || status === 422) return 'Please review your information and try again.';
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to complete this action.';
  if (status === 404) return 'We could not find what you were looking for.';
  if (status === 409) return 'This information is already in use.';
  if (status === 429) return 'Too many attempts. Please wait a moment and try again.';
  if (status && status >= 500) return 'Something went wrong on our side. Please try again shortly.';
  return fallback;
}

type ApiOptions = RequestInit & { token?: string | null };
type ExpoExtra = {
  EXPO_PUBLIC_ALLOW_ANDROID_EMULATOR_BACKEND?: string;
  EXPO_PUBLIC_APP_ENV?: string;
  EXPO_PUBLIC_BACKEND_URL?: string;
  EXPO_PUBLIC_DEVICE_BACKEND_PORT?: string;
  EXPO_PUBLIC_DEVICE_BACKEND_URL?: string;
  EXPO_PUBLIC_PROD_BACKEND_URL?: string;
  EXPO_PUBLIC_LAN_BACKEND_URL?: string;
  BACKENDS?: Record<string, string>;
  DEFAULT_BACKEND?: string;
};

const PRODUCTION_API_BASE_URL = 'https://server.romchat.co.ke';

function isUnsafeReleaseBackendUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const privateIpv4 =
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
      /^127\./.test(hostname);
    return (
      url.protocol !== 'https:' ||
      privateIpv4 ||
      hostname === 'localhost' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.endsWith('.local')
    );
  } catch {
    return true;
  }
}

const manifestExtra = (Constants.manifest as { extra?: unknown } | null | undefined)?.extra;
const extra = (Constants.expoConfig?.extra || manifestExtra || {}) as ExpoExtra;
const selectedBackendKey = extra.DEFAULT_BACKEND || 'direct';
const explicitDeviceBackendUrl = (
  process.env.EXPO_PUBLIC_DEVICE_BACKEND_URL ||
  extra.EXPO_PUBLIC_DEVICE_BACKEND_URL ||
  process.env.EXPO_PUBLIC_LAN_BACKEND_URL ||
  extra.EXPO_PUBLIC_LAN_BACKEND_URL ||
  ''
).replace(/\/$/, '');

const selectedBackend =
  extra.DEFAULT_BACKEND === 'devDevice'
    ? explicitDeviceBackendUrl
    : extra.BACKENDS && extra.DEFAULT_BACKEND
      ? extra.BACKENDS[extra.DEFAULT_BACKEND]
      : undefined;

const configuredApiBaseUrl = (
  selectedBackend ||
  extra.EXPO_PUBLIC_BACKEND_URL ||
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  extra.EXPO_PUBLIC_PROD_BACKEND_URL ||
  process.env.EXPO_PUBLIC_PROD_BACKEND_URL ||
  PRODUCTION_API_BASE_URL
).replace(/\/$/, '');

const allowAndroidEmulatorBackend =
  String(extra.EXPO_PUBLIC_ALLOW_ANDROID_EMULATOR_BACKEND || process.env.EXPO_PUBLIC_ALLOW_ANDROID_EMULATOR_BACKEND || '').toLowerCase() === 'true';

const androidEmulatorBackendSelected =
  Platform.OS === 'android' &&
  /^(https?:\/\/)?10\.0\.2\.2(?::\d+)?(?:\/)?$/i.test(configuredApiBaseUrl) &&
  !allowAndroidEmulatorBackend;

const constantsRuntime = Constants as typeof Constants & {
  expoConfig?: { hostUri?: string | null };
  manifest?: { debuggerHost?: string | null; hostUri?: string | null };
  manifest2?: { extra?: { expoClient?: { hostUri?: string | null } } };
};

function hostFromExpoRuntime() {
  const hostUri =
    constantsRuntime.expoConfig?.hostUri ||
    constantsRuntime.manifest?.debuggerHost ||
    constantsRuntime.manifest?.hostUri ||
    constantsRuntime.manifest2?.extra?.expoClient?.hostUri ||
    '';
  const host = String(hostUri).replace(/^https?:\/\//, '').split('/')[0]?.split(':')[0] || '';
  if (!host || host === 'localhost' || host === '127.0.0.1' || host === '10.0.2.2') return '';
  return host;
}

const metroHost = hostFromExpoRuntime();
const lanBackendPort = extra.EXPO_PUBLIC_DEVICE_BACKEND_PORT || process.env.EXPO_PUBLIC_DEVICE_BACKEND_PORT || '4009';
const lanBackendUrl = metroHost ? `http://${metroHost}:${lanBackendPort}` : '';
const physicalAndroidBackendUrl = (
  explicitDeviceBackendUrl ||
  lanBackendUrl ||
  PRODUCTION_API_BASE_URL
).replace(/\/$/, '');

const developmentDeviceBackendSelected =
  Platform.OS === 'android' &&
  selectedBackendKey === 'prod' &&
  extra.EXPO_PUBLIC_APP_ENV !== 'production' &&
  Boolean(lanBackendUrl) &&
  !process.env.EXPO_PUBLIC_DEVICE_BACKEND_URL &&
  !extra.EXPO_PUBLIC_DEVICE_BACKEND_URL;

const selectedApiBaseUrl =
  androidEmulatorBackendSelected || developmentDeviceBackendSelected ? physicalAndroidBackendUrl : configuredApiBaseUrl;
const isReleaseRuntime = typeof __DEV__ !== 'undefined' && !__DEV__;
const releaseBackendOverrideApplied = isReleaseRuntime && isUnsafeReleaseBackendUrl(selectedApiBaseUrl);

export const apiBaseUrl = releaseBackendOverrideApplied ? PRODUCTION_API_BASE_URL : selectedApiBaseUrl;

const apiDebugEnabled = typeof __DEV__ === 'undefined' ? true : __DEV__;

function describeApiError(error: unknown) {
  if (error instanceof Error) return { name: error.name, message: error.message, stack: error.stack };
  return { name: 'UnknownError', message: String(error) };
}

if (apiDebugEnabled) {
  console.info('[romchat-api] configured', {
    baseUrl: apiBaseUrl,
    configuredBaseUrl: configuredApiBaseUrl,
    physicalAndroidBackendUrl,
    lanBackendUrl,
    lanBackendPort,
    metroHost,
    backendKey: selectedBackendKey,
    releaseBackendOverrideApplied,
    androidEmulatorBackendSelected,
    developmentDeviceBackendSelected,
    explicitDeviceBackendUrl,
    appEnv: extra.EXPO_PUBLIC_APP_ENV || process.env.EXPO_PUBLIC_APP_ENV || 'unknown',
    hasManifestBackend: Boolean(extra.EXPO_PUBLIC_BACKEND_URL || selectedBackend),
  });
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const requestId = `rc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const method = String(options.method || 'GET').toUpperCase();
  const url = `${apiBaseUrl}${path}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (apiDebugEnabled) console.info('[romchat-api] request:start', { requestId, method, url, hasAuth: Boolean(options.token) });
  try {
    const response = await fetch(url, { ...options, headers });
    const responseText = await response.text().catch(() => '');
    let payload: any = {};
    try { payload = responseText ? JSON.parse(responseText) : {}; } catch { payload = { raw: responseText.slice(0, 500) }; }
    const contentType = response.headers?.get?.('content-type') || '';
    const rawSnippet = typeof payload?.raw === 'string' ? payload.raw.replace(/\s+/g, ' ').trim().slice(0, 240) : undefined;
    if (apiDebugEnabled) {
      console.info('[romchat-api] request:finish', {
        requestId,
        method,
        url,
        status: response.status,
        ok: response.ok,
        contentType,
        rawSnippet,
        payloadKeys: payload && typeof payload === 'object' ? Object.keys(payload).slice(0, 8) : [],
      });
    }
    if (!response.ok) {
      const unsafeError = Object.assign(new Error(payload.message || rawSnippet || ''), { status: response.status, code: payload.code || null });
      throw new ApiRequestError(userFacingErrorMessage(unsafeError), { status: response.status, code: payload.code || null, payload });
    }
    return payload as T;
  } catch (error) {
    const details = describeApiError(error);
    console.warn('[romchat-api] request:failed', { requestId, method, url, ...details });
    if (error instanceof ApiRequestError) throw error;
    throw new Error(userFacingErrorMessage(error));
  }
}

export function formatKes(value: number | string | null | undefined) {
  return `KES ${Number(value || 0).toLocaleString('en-KE')}`;
}

export function productConditions(product: MarketplaceProduct) {
  return Array.isArray(product.condition)
    ? product.condition.filter(Boolean)
    : String(product.condition || '')
        .split(/[,/]/)
        .map((item) => item.trim())
        .filter(Boolean);
}

export function productImages(product: MarketplaceProduct) {
  const raw = Array.isArray(product.imageUrls)
    ? product.imageUrls
    : typeof product.imageUrls === 'string'
      ? product.imageUrls.split(',').map((item) => item.trim())
      : [];
  return [product.imageUrl, ...raw].filter((url, index, list): url is string => {
    return Boolean(url) && list.indexOf(url) === index;
  });
}

export function normalizePhoneForWhatsapp(phone?: string | null) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('254')) return digits;
  if (digits.startsWith('0')) return `254${digits.slice(1)}`;
  return digits;
}
