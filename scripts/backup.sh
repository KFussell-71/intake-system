#!/bin/bash
set -e

# V3: Enterprise Database Backup Utility
# Usage: ./scripts/backup.sh

BACKUP_DIR="./app/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/intake_backup_$TIMESTAMP.sql"

echo "🛡️ Starting Database Backup..."

# 1. Create backup directory if missing
mkdir -p "$BACKUP_DIR"

# 2. Run pg_dump via Docker
# Assuming 'intake-db' is the container name from docker-compose
docker exec intake-db pg_dump -U postgres postgres > "$BACKUP_FILE"

# 3. Compress and Encrypt
gzip "$BACKUP_FILE"
GZIPPED_FILE="${BACKUP_FILE}.gz"

if [ -z "$BACKUP_PASSPHRASE" ]; then
    echo "⚠️  WARNING: BACKUP_PASSPHRASE not set. Storing unencrypted."
    FINAL_FILE="$GZIPPED_FILE"
else
    echo "🔐 Encrypting backup..."
    gpg --symmetric --batch --yes --passphrase "$BACKUP_PASSPHRASE" -o "${GZIPPED_FILE}.gpg" "$GZIPPED_FILE"
    rm "$GZIPPED_FILE"
    FINAL_FILE="${GZIPPED_FILE}.gpg"
fi

echo "✅ Backup completed: ${FINAL_FILE}"

# 4. Household: Keep last 7 days
find "$BACKUP_DIR" -name "intake_backup_*" -mtime +7 -delete

echo "🧹 Old backups pruned."
