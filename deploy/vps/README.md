# RomChat HostPinnacle deployment

This stack runs PostgreSQL, Redis, S3-compatible media storage, the backend, the public web app, the admin SPA, encrypted backups, and Cloudflare Tunnel without publishing application or database ports.

## Secrets

Create these ignored files on the server under `deploy/vps/secrets/`:

- `stack.env`: database, Redis, media credentials, release SHA, and backup schedule.
- `app.env`: backend production configuration. Database, Redis, storage, public URLs, CORS, and port are overridden by Compose.
- `backup.env`: off-site S3/R2 endpoint, bucket, prefix, and credentials.
- `age/identity.txt` and `age/recipient.txt`: backup encryption identity and public recipient.
- `cloudflared/config.yml` and the tunnel credential JSON.

Never commit this directory.

## Deployment

```bash
cd deploy/vps
docker compose --env-file secrets/stack.env -f compose.yml up -d postgres redis minio minio-init
# Restore the production dump before starting the backend.
docker compose --env-file secrets/stack.env -f compose.yml up -d --build backend web admin backup
./verify.sh
docker compose --profile cutover --env-file secrets/stack.env -f compose.yml up -d cloudflared
```

## Rollback

1. Do not delete or stop the previous Railway backend or Cloudflare Worker deployments during migration validation.
2. Repoint each affected hostname to its recorded pre-cutover target, one hostname at a time.
3. Verify TLS, HTTP status, API health, login, uploads, and Worker/Railway logs after each reversal.
4. Stop only the RomChat tunnel after all hostnames serve the previous deployment again:

```bash
docker compose --profile cutover --env-file secrets/stack.env -f compose.yml stop cloudflared
```

The local database and encrypted backups remain intact for investigation or a later retry.
