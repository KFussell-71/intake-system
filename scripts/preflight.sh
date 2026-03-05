#!/bin/bash
# Intake System: Hardware Preflight Diagnostic (Distributed Clinical Node)
# Purpose: Verify system ready for production load and AI operations.

set -e

# Configuration (Minimum Recommended)
MIN_RAM_GB=8
MIN_CORES=4
MIN_DISK_GB=20
PORTS=(80 443 11434 5432)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===================================================${NC}"
echo -e "${BLUE}          INTAKE SYSTEM PREFLIGHT AUDIT            ${NC}"
echo -e "${BLUE}===================================================${NC}"

# 1. RAM Check
TOTAL_RAM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
TOTAL_RAM_GB=$((TOTAL_RAM_KB / 1024 / 1024))

echo -n "Checking RAM... "
if [ "$TOTAL_RAM_GB" -ge "$MIN_RAM_GB" ]; then
    echo -e "${GREEN}PASS (${TOTAL_RAM_GB}GB detected)${NC}"
else
    echo -e "${YELLOW}WARN (${TOTAL_RAM_GB}GB detected. ${MIN_RAM_GB}GB recommended for AI)${NC}"
fi

# 2. CPU Check
CORES=$(nproc)
echo -n "Checking CPU... "
if [ "$CORES" -ge "$MIN_CORES" ]; then
    echo -e "${GREEN}PASS (${CORES} cores detected)${NC}"
else
    echo -e "${YELLOW}WARN (${CORES} cores detected. ${MIN_CORES} cores recommended for concurrency)${NC}"
fi

# 3. Disk Check
DISK_AVAIL_GB=$(df / | tail -1 | awk '{print $4 / 1024 / 1024}' | cut -d. -f1)
echo -n "Checking Disk... "
if [ "$DISK_AVAIL_GB" -ge "$MIN_DISK_GB" ]; then
    echo -e "${GREEN}PASS (${DISK_AVAIL_GB}GB available)${NC}"
else
    echo -e "${RED}FAIL (${DISK_AVAIL_GB}GB available. ${MIN_DISK_GB}GB required)${NC}"
    EXIT_CODE=1
fi

# 4. Port Conflict Check
echo "Checking Ports..."
for PORT in "${PORTS[@]}"; do
    if ss -tuln | grep -q ":$PORT "; then
        echo -e "  - Port $PORT: ${RED}CONFLICT${NC} (Already in use)"
        EXIT_CODE=1
    else
        echo -e "  - Port $PORT: ${GREEN}AVAILABLE${NC}"
    fi
done

# 5. OS Check
echo -n "Checking OS... "
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo -e "${GREEN}PASS (Linux)${NC}"
else
    echo -e "${YELLOW}WARN (Non-Linux detected. Docker recommended)${NC}"
fi

echo -e "${BLUE}===================================================${NC}"
if [ "$EXIT_CODE" == "1" ]; then
    echo -e "${RED}       AUDIT FAILED: FIX CONFLICTS BEFORE SETUP    ${NC}"
    exit 1
else
    echo -e "${GREEN}      AUDIT COMPLETE: SYSTEM READY FOR DEPLOY      ${NC}"
    exit 0
fi
