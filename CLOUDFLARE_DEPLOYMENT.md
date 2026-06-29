# Cloudflare deployment

The public website uses Next.js through OpenNext for Cloudflare Workers. The admin console is a Vite SPA served by Cloudflare Workers Static Assets.

## Public website

- Worker: `grogonsacco`
- Domains: `grogonsacco.co.ke`, `www.grogonsacco.co.ke`
- Build command from repository root: `corepack enable && yarn install --immutable && yarn cf:build:web`
- Deploy command: `yarn cf:deploy:web`

## Admin console

- Worker: `grogonsacco-admin`
- Domain: `admin.grogonsacco.co.ke`
- Build command from repository root: `corepack enable && yarn install --immutable && yarn cf:build:admin`
- Deploy command: `yarn cf:deploy:admin`

## Build variables

`NODE_ENV=production`, `NEXTJS_ENV=production`, `NEXT_PUBLIC_SITE_URL=https://grogonsacco.co.ke`, `NEXT_PUBLIC_APP_ORIGIN=https://grogonsacco.co.ke`, `NEXT_PUBLIC_BACKEND_URL=https://server.grogonsacco.co.ke`, `NEXT_PUBLIC_API_URL=https://server.grogonsacco.co.ke`, `NEXT_PUBLIC_API_BASE_URL=https://server.grogonsacco.co.ke`, and `VITE_BACKEND_URL=https://server.grogonsacco.co.ke`.

Never add `DATABASE_URL`, JWT secrets, M-Pesa credentials, admin passwords, SMTP credentials, or storage keys to either frontend Worker. The backend must allow all three frontend origins in CORS.
