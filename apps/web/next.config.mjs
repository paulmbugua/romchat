/** @type {import('next').NextConfig} */
import { createRequire } from 'node:module';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

const require = createRequire(import.meta.url);
const DEFAULT_PUBLIC_BACKEND_URL = 'https://server.romchat.co.ke';
const nextPublicBackendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL?.trim().replace(/\/+$/, '') || DEFAULT_PUBLIC_BACKEND_URL;

// Helpful: proves Next sees env at startup (server-side)
console.log('[next] env check', {
  hasBackendUrl: Boolean(process.env.NEXT_PUBLIC_BACKEND_URL),
  resolvedBackendUrl: nextPublicBackendUrl,
});

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@mindcare/shared'],
  trailingSlash: true,
  images: { unoptimized: true },

  experimental: {
    optimizePackageImports: ['@tanstack/react-query'],
    externalDir: true,
  },

  // ✅ Safety net: ensure these are always exposed to the client bundle
  env: {
    NEXT_PUBLIC_BACKEND_URL: nextPublicBackendUrl,
    NEXT_PUBLIC_API_URL: nextPublicBackendUrl,
    NEXT_PUBLIC_API_BASE_URL: nextPublicBackendUrl,
    NEXT_PUBLIC_APP_ORIGIN: process.env.NEXT_PUBLIC_APP_ORIGIN || 'https://www.romchat.co.ke',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.romchat.co.ke',
  },

  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@tanstack/react-query': require.resolve('@tanstack/react-query'),
      '@tanstack/query-core': require.resolve('@tanstack/query-core'),
    };
    return config;
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
