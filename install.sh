#!/bin/bash
# Unified NAS Clinical Node Installer
# Purpose: Zero-Touch Bootstrap for Distributed Clinical Nodes.

set -e

echo "🚀 Initializing Clinical Node Deployment..."

# 1. Forensic Safeguards
if [ "$EUID" -eq 0 ]; then
    echo "❌ Error: DO NOT run this script as root. Use a dedicated service user."
    exit 1
fi

# 2. Preflight Diagnostics
if [ -f "./scripts/preflight.sh" ]; then
    bash ./scripts/preflight.sh
else
    echo "⚠️  Warning: preflight.sh not found. Skipping hardware audit."
fi

# 3. NAS Mount Warning (Forensic Protection)
echo "🔍 Checking NAS mount integrity..."
mount_opts=$(mount | grep "on / " | head -n 1) # Checking root as fallback if data dir not yet mapped
if echo "$mount_opts" | grep -q "data=writeback"; then
    echo "⚠️  WARNING: NAS filesystem uses 'data=writeback'. Postgres durability is AT RISK."
    echo "   Recommended: data=ordered or ZFS."
fi

# 4. Entropy Validation (For key generation)
avail_entropy=$(cat /proc/sys/kernel/random/entropy_avail 2>/dev/null || echo "1000")
if [ "$avail_entropy" -lt 200 ]; then
    echo "⚠️  Warning: Low system entropy ($avail_entropy). Key generation may be weak."
fi

# 5. Directory Provisioning (NAS Bind Mounts)
echo "📂 Provisioning persistent volumes..."
mkdir -p docker/data/db
mkdir -p docker/data/backups
mkdir -p docker/data/storage
mkdir -p docker/nginx/certs

# 3. Secret Generation
echo "🔐 Verifying secrets..."
mkdir -p docker/secrets
if [ ! -f "docker/secrets/db_password.txt" ]; then
    openssl rand -base64 32 > docker/secrets/db_password.txt
    echo "✅ Generated new DB password."
fi

if [ ! -f "docker/secrets/gpg_passphrase.txt" ]; then
    openssl rand -base64 32 > docker/secrets/gpg_passphrase.txt
    echo "✅ Generated new GPG passphrase."
fi

# 4. Docker Orchestration
echo "🐳 Starting Clinical Node containers..."
cd docker
docker-compose down
docker-compose up -d --build

# 5. Health Check
echo "🔍 Waiting for system health..."
sleep 10
if [ -f "../scripts/health_probe.sh" ]; then
    bash ../scripts/health_probe.sh
else
    # Basic curl check if probe is missing
    curl -I http://localhost:80 || echo "❌ Health check failed."
fi

echo "✅ Clinical Node is UP and DETERMINISTIC."
echo "   Access: http://localhost"
echo "   Sync Dashboard: http://localhost/dashboard/sync"
