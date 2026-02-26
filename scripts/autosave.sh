#!/bin/bash
# 🤖 Project Vanguard: Robust Autosave Daemon
# This script ensures progress is saved every 120 seconds.

INTERVAL=120
LOG_FILE="./app/autosave.log"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Autosave daemon started. Interval: ${INTERVAL}s" >> "$LOG_FILE"

while true; do
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Starting autosave cycle..." >> "$LOG_FILE"
  
  # 1. Git Commit (if changes exist)
  if [[ -n $(git status -s) ]]; then
    git add .
    git commit -m "CHORE: Automated progress checkpoint (Protocol Sync)" >> "$LOG_FILE" 2>&1
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Git commit successful." >> "$LOG_FILE"
  else
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] No changes detected in Git." >> "$LOG_FILE"
  fi

  # 2. Database Backup (via backup.sh)
  if [ -f "./scripts/backup.sh" ]; then
    bash ./scripts/backup.sh >> "$LOG_FILE" 2>&1
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Database backup cycle complete." >> "$LOG_FILE"
  fi

  sleep $INTERVAL
done
