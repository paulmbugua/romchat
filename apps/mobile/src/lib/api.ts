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
  EXPO_PUBLIC_DEVICE_BACKEND_PORT?: string;
  EXPO_PUBLIC_DEVICE_BACKEND_URL?: string;
  EXPO_PUBLIC_PROD_BACKEND_URL?: string;
  EXPO_PUBLIC_LAN_BACKEND_URL?: string;
  BACKENDS?: Record<string, string>;
  DEFAULT_BACKEND?: string;
};

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
  'https://server.romchat.co.ke'
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
  'http://server.romchat.co.ke'
).replace(/\/$/, '');

const developmentDeviceBackendSelected =
  Platform.OS === 'android' &&
  selectedBackendKey === 'prod' &&
  extra.EXPO_PUBLIC_APP_ENV !== 'production' &&
  Boolean(lanBackendUrl) &&
  !process.env.EXPO_PUBLIC_DEVICE_BACKEND_URL &&
  !extra.EXPO_PUBLIC_DEVICE_BACKEND_URL;

export const apiBaseUrl = androidEmulatorBackendSelected || developmentDeviceBackendSelected ? physicalAndroidBackendUrl : configuredApiBaseUrl;

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
      const isHtmlBlock = /text\/html/i.test(contentType) || /^<!DOCTYPE html>/i.test(rawSnippet || '');
      const detail = payload.message || rawSnippet || `Request failed: ${response.status}`;
      if (isHtmlBlock && response.status === 403) {
        throw new Error(`RomChat backend is blocked at ${apiBaseUrl}. In development, start the backend on your PC and set EXPO_PUBLIC_DEVICE_BACKEND_URL to your PC LAN IP, for example http://10.42.11.111:4009, then restart Expo with -c.`);
      }
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
