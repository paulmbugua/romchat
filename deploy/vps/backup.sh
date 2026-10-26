#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

BACKUP_DIR="${BACKUP_DIR:-/backups}"
INTERVAL_SECONDS="${BACKUP_INTERVAL_SECONDS:-86400}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
AGE_RECIPIENT="$(tr -d '\r\n' < /run/secrets/age/recipient.txt)"
MEDIA_BUCKETS=(images-romchat videos-romchat docs-romchat audio-romchat previews-romchat)

run_backup() {
  local stamp work db_file media_file manifest
  stamp="$(date -u +%Y%m%dT%H%M%SZ)"
  work="$(mktemp -d)"
  db_file="$BACKUP_DIR/romchat-db-$stamp.dump.age"
  media_file="$BACKUP_DIR/romchat-media-$stamp.tar.age"
  manifest="$BACKUP_DIR/romchat-$stamp.sha256"
  trap 'rm -rf "$work"' RETURN

  mkdir -p "$BACKUP_DIR" "$work/media"
  pg_dump --format=custom --no-owner --no-privileges | age -r "$AGE_RECIPIENT" -o "$db_file"

  for bucket in "${MEDIA_BUCKETS[@]}"; do
    mkdir -p "$work/media/$bucket"
    AWS_ACCESS_KEY_ID="$MEDIA_ACCESS_KEY" AWS_SECRET_ACCESS_KEY="$MEDIA_SECRET_KEY" \
      aws --endpoint-url "$MEDIA_ENDPOINT" s3 sync "s3://$bucket" "$work/media/$bucket" --only-show-errors
  done
  tar -C "$work" -cf - media | age -r "$AGE_RECIPIENT" -o "$media_file"

  sha256sum "$db_file" "$media_file" > "$manifest"
  if [[ -n "${OFFSITE_BUCKET:-}" ]]; then
    for file in "$db_file" "$media_file" "$manifest"; do
      AWS_ACCESS_KEY_ID="$OFFSITE_ACCESS_KEY" AWS_SECRET_ACCESS_KEY="$OFFSITE_SECRET_KEY" \
        aws --endpoint-url "$OFFSITE_ENDPOINT" s3 cp "$file" \
          "s3://$OFFSITE_BUCKET/${OFFSITE_PREFIX:-vps-backups}/$(basename "$file")" --only-show-errors
    done
  fi

  date +%s > "$BACKUP_DIR/.last-success"
  find "$BACKUP_DIR" -type f -mtime "+$RETENTION_DAYS" -delete
  printf '%s backup completed\n' "$(date -u +%FT%TZ)"
}

if [[ "${BACKUP_RUN_ONCE:-false}" == "true" ]]; then
  run_backup
  exit 0
fi

while true; do
  run_backup
  sleep "$INTERVAL_SECONDS"
done
