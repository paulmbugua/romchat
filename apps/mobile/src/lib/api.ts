import Constants from 'expo-constants';

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
  condition?: string | null;
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
  EXPO_PUBLIC_BACKEND_URL?: string;
  BACKENDS?: Record<string, string>;
  DEFAULT_BACKEND?: string;
};

const manifestExtra = (Constants.manifest as { extra?: unknown } | null | undefined)?.extra;
const extra = (Constants.expoConfig?.extra || manifestExtra || {}) as ExpoExtra;
const selectedBackend =
  extra.BACKENDS && extra.DEFAULT_BACKEND ? extra.BACKENDS[extra.DEFAULT_BACKEND] : undefined;

export const apiBaseUrl =
  selectedBackend ||
  extra.EXPO_PUBLIC_BACKEND_URL ||
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  'http://localhost:4000';

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || `Request failed: ${response.status}`);
  return payload as T;
}

export function formatKes(value: number | string | null | undefined) {
  return `KES ${Number(value || 0).toLocaleString('en-KE')}`;
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
