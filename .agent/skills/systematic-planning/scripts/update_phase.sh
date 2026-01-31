#!/bin/bash
set -e

PHASE_NAME="${1}"
STATUS="${2}"

if [ -z "$PHASE_NAME" ] || [ -z "$STATUS" ]; then
  echo "Usage: update_phase.sh 'Phase Name' 'status'"
  exit 1
fi

if [ ! -f task_plan.md ]; then
  echo "⚠️  task_plan.md not found."
  exit 1
fi

# This is a simple sed replace assuming a specific format like "- Status: not_started"
# In a real scenario, this might need more robust parsing
sed -i "/$PHASE_NAME/,/Status:/ s/Status: .*/Status: $STATUS/" task_plan.md

echo "✅ Updated phase '$PHASE_NAME' to '$STATUS' in task_plan.md"
