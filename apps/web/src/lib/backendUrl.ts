const PROD_BACKEND_URL = 'https://server.romchat.co.ke';
const DEV_BACKEND_URL = 'http://localhost:4000';

const PRODUCTION_HOST_PATTERNS = [
  'romchat.co.ke',
  'www.romchat.co.ke',
  'admin.romchat.co.ke',
];

const isDev = process.env.NODE_ENV !== 'production';

const normalizeUrl = (value?: string | null): string => String(value || '').trim().replace(/\/+$/, '');

const isUnsafeProductionUrl = (value: string): boolean => {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    const isPrivate = host === 'localhost'
      || host === '127.0.0.1'
      || host === '10.0.2.2'
      || /^10\./.test(host)
      || /^192\.168\./.test(host)
      || /^172\.(1[6-9]|2\d|3[01])\./.test(host);
    return parsed.protocol !== 'https:' || isPrivate;
  } catch {
    return true;
  }
};

const isProductionHostname = (hostname?: string): boolean => {
  const host = String(hostname || '').toLowerCase().trim();
  if (!host) return false;
  return PRODUCTION_HOST_PATTERNS.some((pattern) => host === pattern || host.endsWith(`.${pattern}`));
};

export function resolveBackendUrl(envValue?: string | null): string {
  const envUrl = normalizeUrl(envValue);
  if (envUrl && (isDev || !isUnsafeProductionUrl(envUrl))) return envUrl;

  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  if (isProductionHostname(hostname)) {
    return PROD_BACKEND_URL;
  }

  if (isDev) {
    return DEV_BACKEND_URL;
  }

  return PROD_BACKEND_URL;
}

let didLogBackendResolution = false;

export function logResolvedBackendUrl(context: string, backendUrl: string) {
  if (!isDev || didLogBackendResolution) return;
  didLogBackendResolution = true;
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'server';
  console.info('[backend-url] resolved', {
    context,
    backendUrl,
    hostname,
    hasPublicEnv: Boolean(normalizeUrl(process.env.NEXT_PUBLIC_BACKEND_URL)),
    nodeEnv: process.env.NODE_ENV,
  });
}
