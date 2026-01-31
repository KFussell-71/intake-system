#!/bin/bash
set -e

MESSAGE="${1}"
DATE=$(date '+%Y-%m-%d %H:%M')

if [ -z "$MESSAGE" ]; then
  echo "Usage: update_progress.sh 'Progress message'"
  exit 1
fi

if [ ! -f progress.md ]; then
  echo "⚠️  progress.md not found. Creating..."
  cat > progress.md << EOF
# Progress Log
## Created: $(date '+%Y-%m-%d')
EOF
fi

echo "- $MESSAGE" >> progress.md

echo "✅ Updated progress.md"
