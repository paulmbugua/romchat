#!/usr/bin/env bash
set -Eeuo pipefail

set -a
source secrets/stack.env
set +a

compose=(docker compose --env-file secrets/stack.env -f compose.yml)
"${compose[@]}" ps
"${compose[@]}" exec -T postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"
"${compose[@]}" exec -T redis sh -ec 'redis-cli -a "$REDIS_PASSWORD" --no-auth-warning ping | grep PONG'
"${compose[@]}" exec -T backend node -e "fetch('http://127.0.0.1:4009/health').then(async r=>{console.log(r.status,await r.text());if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
"${compose[@]}" exec -T backend node -e "fetch('http://127.0.0.1:4009/api/romchat/version').then(async r=>{console.log(r.status,await r.text());if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
"${compose[@]}" exec -T web node -e "fetch('http://127.0.0.1:3000/').then(r=>{console.log(r.status);if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
"${compose[@]}" exec -T admin sh -ec 'wget -qO- http://127.0.0.1:8080/healthz | grep -q ok'
"${compose[@]}" exec -T admin sh -ec 'wget -qO- http://127.0.0.1:8080/nonexistent-spa-route | grep -qi "<html"'
