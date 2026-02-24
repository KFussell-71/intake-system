#!/bin/bash
# 🏥 Intake System: Enterprise Release Manifest Signer (v3.2)
# Purpose: Generate and sign a bit-level manifest for clinical distribution.

set -e

MANIFEST="release_manifest.sha256"
SIG_FILE="${MANIFEST}.sig"
GPG_PASS_FILE="docker/secrets/gpg_passphrase.txt"

echo "🔐 Generating Enterprise Release Manifest..."

# 1. Clean old artifacts
rm -f $MANIFEST $SIG_FILE

# 2. Checklist (Critical Infrastructure)
FILES=(
    "install.sh"
    "install.bat"
    "docker/docker-compose.yml"
    "docker/discovery/discovery_agent.py"
    "docker/discovery/Dockerfile"
    "docker/supabase/migrations/20260224_forensic_certification.sql"
    "docker/supabase/migrations/20260224_hardware_tuning.sql"
    "app/src/app/api/fleet/route.ts"
    "app/src/components/dashboard/ClinicalFleetVisualizer.tsx"
    "scripts/forensic_e2e.sh"
    "scripts/forensic_state_hash.sh"
)

# 3. Hash Generation
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        sha256sum "$file" >> $MANIFEST
    else
        echo "⚠️  Warning: Missing critical file $file. Release may be incomplete."
    fi
done

# 4. Cryptographic Signing
if [ -f "$GPG_PASS_FILE" ]; then
    GPG_PASS=$(cat $GPG_PASS_FILE)
    echo "$GPG_PASS" | gpg --batch --yes --passphrase-fd 0 --clearsign --output $SIG_FILE $MANIFEST
    echo "✅ Release Manifest SIGNED: $SIG_FILE"
else
    echo "❌ Error: GPG Passphrase not found. Run ./install.sh first to generate keys."
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 VERIFICATION COMMAND:"
echo "   gpg --verify $SIG_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
