#!/bin/bash
# Project Vanguard Sovereign Sync V4.1
# Verified PATH for QNAP Container Station
export PATH=/share/CACHEDEV1_DATA/.qpkg/container-station/bin:$PATH

STACK_DIR="/share/Container/vanguard/intake_stack"
BRANCH="V4.1-Edge-RAG-Release"
cd $STACK_DIR

echo "[$(date)] [Sync] Checking updates ($BRANCH)..."

# 1. Fetch updates
docker run --rm -v $(pwd):/repo -w /repo alpine/git fetch origin $BRANCH

# 2. Check for local modifications (Safety Gate)
if [[ -n $(docker run --rm -v $(pwd):/repo -w /repo alpine/git status --porcelain) ]]; then
    echo "[$(date)] [Sync] [WARNING] Local modifications detected. Skipping auto-sync."
    exit 0
fi

# 3. Check if remote is ahead
LOCAL=$(docker run --rm -v $(pwd):/repo -w /repo alpine/git rev-parse HEAD)
REMOTE=$(docker run --rm -v $(pwd):/repo -w /repo alpine/git rev-parse origin/$BRANCH)

if [ "$LOCAL" != "$REMOTE" ]; then
    echo "[$(date)] [Sync] Newer version found. Updating..."
    docker run --rm -v $(pwd):/repo -w /repo alpine/git reset --hard origin/$BRANCH
    docker compose up -d --build app
    echo "[$(date)] [Sync] Success: NAS updated."
else
    echo "[$(date)] [Sync] Success: Already at latest version."
fi
