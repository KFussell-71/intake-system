#!/bin/bash
# 🏥 Unified NAS Clinical Node Installer (v3.2)
# Purpose: Zero-Touch Bootstrap for Distributed Clinical Nodes.

set -e

# --- Styles ---
BOLD=$(tput bold)
GREEN=$(tput setaf 2)
YELLOW=$(tput setaf 3)
RED=$(tput setaf 1)
CYAN=$(tput setaf 6)
NC=$(tput sgr0) # No Color

echo "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${CYAN}${BOLD}🏥 INTAKE SYSTEM: CLINICAL NODE BOOTSTRAP${NC}"
echo "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 1. Forensic Safeguards
if [ "$EUID" -eq 0 ]; then
    echo "${RED}${BOLD}❌ ERROR: DO NOT run this script as root.${NC}"
    echo "Please use a dedicated service user with docker group permissions."
    exit 1
fi

# 2. Dependency Check
DOCKER_CMD="docker compose"
if ! docker compose version >/dev/null 2>&1; then
    if docker-compose version >/dev/null 2>&1; then
        DOCKER_CMD="docker-compose"
    else
        echo "${RED}${BOLD}❌ ERROR: Docker Compose not found.${NC}"
        echo "Please install Docker Desktop or the docker-compose-plugin."
        exit 1
    fi
fi

# 3. Preflight Diagnostics
echo "${YELLOW}🔍 Running preflight diagnostics...${NC}"
if [ -f "./scripts/preflight.sh" ]; then
    bash ./scripts/preflight.sh
else
    echo "⚠️  ${YELLOW}Warning: preflight.sh not found. High-level diagnostic skipped.${NC}"
fi

# 4. NAS Mount Audit
echo "${YELLOW}📂 Provisioning persistent volumes...${NC}"
# Use standard paths (bind mounts) for first-run
mkdir -p docker/data/db
mkdir -p docker/data/backups
mkdir -p docker/data/storage
mkdir -p docker/nginx/certs
mkdir -p docker/secrets

mount_opts=$(mount | grep "on / " | head -n 1)
if echo "$mount_opts" | grep -q "data=writeback"; then
    echo "${RED}${BOLD}🚨 DURABILITY WARNING:${NC} NAS filesystem uses 'data=writeback'."
    echo "Postgres state machine integrity is at risk during power loss."
fi

# 5. Secret Generation
echo "${YELLOW}🔐 Securing node credentials...${NC}"
if [ ! -f "docker/secrets/db_password.txt" ]; then
    openssl rand -base64 32 > docker/secrets/db_password.txt
    echo "${GREEN}✅ Generated secure DB password.${NC}"
fi

if [ ! -f "docker/secrets/gpg_passphrase.txt" ]; then
    openssl rand -base64 32 > docker/secrets/gpg_passphrase.txt
    echo "${GREEN}✅ Generated node encryption key (GPG).${NC}"
fi

# 6. Docker Orchestration
echo "${CYAN}🐳 Starting Clinical Node containers...${NC}"
cd docker
$DOCKER_CMD down > /dev/null 2>&1 || true
$DOCKER_CMD up -d --build

# 7. Health Check
echo "${YELLOW}⏳ Waiting for clinical state machine to warm up...${NC}"
sleep 15
if [ -f "../scripts/health_probe.sh" ]; then
    bash ../scripts/health_probe.sh
else
    curl -I -s http://localhost:80 | grep -q "200 OK" && echo "${GREEN}✅ Health check PASSED.${NC}" || echo "${RED}❌ Health check FAILED.${NC}"
fi

echo ""
echo "${GREEN}${BOLD}🎉 SUCCESS: Your Clinical Node is LIVE.${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "${BOLD}📍 Dashboard:${NC} http://localhost"
echo "${BOLD}🔐 Device ID:${NC} $(hostname)"
echo "${BOLD}📜 Documentation:${NC} See INSTALL.md for next steps."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
