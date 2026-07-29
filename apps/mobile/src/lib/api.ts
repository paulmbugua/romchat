import Constants from 'expo-constants';
import { Platform } from 'react-native';

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

type ApiOptions = RequestInit & { token?: string | null };
type ExpoExtra = {
  EXPO_PUBLIC_ALLOW_ANDROID_EMULATOR_BACKEND?: string;
  EXPO_PUBLIC_APP_ENV?: string;
  EXPO_PUBLIC_BACKEND_URL?: string;
  EXPO_PUBLIC_PROD_BACKEND_URL?: string;
  BACKENDS?: Record<string, string>;
  DEFAULT_BACKEND?: string;
};

const manifestExtra = (Constants.manifest as { extra?: unknown } | null | undefined)?.extra;
const extra = (Constants.expoConfig?.extra || manifestExtra || {}) as ExpoExtra;
const selectedBackendKey = extra.DEFAULT_BACKEND || 'direct';
const selectedBackend =
  extra.BACKENDS && extra.DEFAULT_BACKEND ? extra.BACKENDS[extra.DEFAULT_BACKEND] : undefined;

const configuredApiBaseUrl = (
  selectedBackend ||
  extra.EXPO_PUBLIC_BACKEND_URL ||
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  extra.EXPO_PUBLIC_PROD_BACKEND_URL ||
  process.env.EXPO_PUBLIC_PROD_BACKEND_URL ||
  'https://server.desiredoha.com'
).replace(/\/$/, '');

const allowAndroidEmulatorBackend =
  String(extra.EXPO_PUBLIC_ALLOW_ANDROID_EMULATOR_BACKEND || process.env.EXPO_PUBLIC_ALLOW_ANDROID_EMULATOR_BACKEND || '').toLowerCase() === 'true';

const androidEmulatorBackendSelected =
  Platform.OS === 'android' &&
  /^(https?:\/\/)?10\.0\.2\.2(?::\d+)?(?:\/)?$/i.test(configuredApiBaseUrl) &&
  !allowAndroidEmulatorBackend;

const physicalAndroidBackendUrl = (
  process.env.EXPO_PUBLIC_DEVICE_BACKEND_URL ||
  extra.EXPO_PUBLIC_BACKEND_URL ||
  'http://server.desiredoha.com'
).replace(/\/$/, '');

export const apiBaseUrl = androidEmulatorBackendSelected ? physicalAndroidBackendUrl : configuredApiBaseUrl;

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
    backendKey: selectedBackendKey,
    androidEmulatorBackendSelected,
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
      const detail = payload.message || rawSnippet || `Request failed: ${response.status}`;
      throw new Error(`Request failed: ${response.status}. ${detail}`);
    }
    return payload as T;
  } catch (error) {
    const details = describeApiError(error);
    console.warn('[romchat-api] request:failed', { requestId, method, url, ...details });
    if (details.message.includes('Network request failed')) {
      throw new Error(`Network request failed while contacting RomChat backend at ${apiBaseUrl}. Check that this URL is reachable from the phone and that HTTPS certificates are trusted.`);
    }
    throw error instanceof Error ? error : new Error(String(error));
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
