#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

archive="${1:?Usage: restore-test.sh /path/to/database.dump.age}"
key="${AGE_KEY_FILE:-/run/secrets/age/identity.txt}"
test_db="romchat_restore_test_$(date +%s)"
plain="$(mktemp)"
trap 'rm -f "$plain"; dropdb --if-exists "$test_db" >/dev/null 2>&1 || true' EXIT

age --decrypt -i "$key" -o "$plain" "$archive"
createdb "$test_db"
pg_restore --exit-on-error --no-owner --no-privileges --dbname "$test_db" "$plain"
psql --dbname "$test_db" --set ON_ERROR_STOP=1 --file /usr/local/share/romchat/fingerprint.sql
printf 'Isolated restore test completed for %s\n' "$test_db"
