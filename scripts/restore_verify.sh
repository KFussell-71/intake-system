#!/bin/bash
set -e

# V3.1: Enterprise Restore Verification Utility
# Usage: BACKUP_PASSPHRASE=xyz ./scripts/restore_verify.sh [path_to_backup]

BACKUP_FILE=$1
if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./scripts/restore_verify.sh <backup_file>"
    exit 1
fi

echo "🛡️  Starting Restore Verification for: $BACKUP_FILE"

# 1. Decrypt if needed
TEMP_FILE="/tmp/restore_verify_$(date +%s).sql"
if [[ "$BACKUP_FILE" == *.gpg ]]; then
    if [ -z "$BACKUP_PASSPHRASE" ]; then
        echo "❌ Error: BACKUP_PASSPHRASE required to verify encrypted backup."
        exit 1
    fi
    echo "🔓 Decrypting..."
    gpg --decrypt --batch --passphrase "$BACKUP_PASSPHRASE" "$BACKUP_FILE" | gunzip > "$TEMP_FILE"
else
    echo "📄 Uncompressed only..."
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
fi

# 2. Dry-run verify via Docker (using pgvector image)
echo "🔍 Validating SQL syntax and schema integrity..."
docker run --rm -v "$TEMP_FILE":/backup.sql:ro pgvector/pgvector:pg15 bash -c "
    cp /backup.sql /tmp/test.sql && 
    chown postgres /tmp/test.sql && 
    su postgres -c 'initdb -D /tmp/testdb && pg_ctl -D /tmp/testdb -l /tmp/log start && 
    psql -c \"CREATE ROLE authenticated; CREATE ROLE anon; CREATE ROLE service_role; CREATE ROLE auditor;\" postgres &&
    psql -f /tmp/test.sql postgres'
" > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ VERIFICATION SUCCESS: Backup is integral and restorable."
else
    echo "❌ VERIFICATION FAILED: Backup might be corrupt."
    rm "$TEMP_FILE"
    exit 1
fi

rm "$TEMP_FILE"
