#!/bin/bash
set -e

ERROR_MSG="${1}"
RESOLUTION="${2:-Pending}"
DATE=$(date '+%Y-%m-%d %H:%M')

if [ -z "$ERROR_MSG" ]; then
  echo "Usage: log_error.sh 'Error message' 'Proposed resolution'"
  exit 1
fi

if [ ! -f task_plan.md ]; then
  echo "⚠️  task_plan.md not found. Cannot log error."
  exit 1
fi

# Append to Error Log table in task_plan.md
# Assumes the table is at the end or marked with ## Error Log
if ! grep -q "## Error Log" task_plan.md; then
  echo -e "\n## Error Log\n| Attempt | Error | Resolution |\n|---------|-------|------------|" >> task_plan.md
fi

echo "| $DATE | $ERROR_MSG | $RESOLUTION |" >> task_plan.md

echo "✅ Logged error to task_plan.md"
