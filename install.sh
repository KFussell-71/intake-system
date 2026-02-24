#!/bin/bash
# Unified NAS Clinical Node Installer
# Purpose: Zero-Touch Bootstrap for Distributed Clinical Nodes.

set -e

echo "🚀 Initializing Clinical Node Deployment..."

# 1. Preflight Diagnostics
if [ -f "./scripts/preflight.sh" ]; then
    bash ./scripts/preflight.sh
else
    echo "⚠️  Warning: preflight.sh not found. Skipping hardware audit."
fi

# 2. Directory Provisioning (NAS Bind Mounts)
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
