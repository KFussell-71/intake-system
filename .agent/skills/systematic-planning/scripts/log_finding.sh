#!/bin/bash
set -e

FINDING="${1}"
DATE=$(date '+%Y-%m-%d %H:%M')

if [ -z "$FINDING" ]; then
  echo "Usage: log_finding.sh 'Your finding here'"
  exit 1
fi

if [ ! -f findings.md ]; then
  echo "⚠️  findings.md not found. Creating..."
  cat > findings.md << EOF
# Research Findings
## Created: $(date '+%Y-%m-%d')

## Key Discoveries
EOF
fi

echo "" >> findings.md
echo "### $DATE" >> findings.md
echo "- $FINDING" >> findings.md

echo "✅ Logged finding: $FINDING"
