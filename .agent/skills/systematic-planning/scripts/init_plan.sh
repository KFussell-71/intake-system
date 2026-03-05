#!/bin/bash
set -e

PROJECT_NAME="${1:-Unnamed Project}"
DATE=$(date '+%Y-%m-%d')

# Create task_plan.md
cat > task_plan.md << EOF
# $PROJECT_NAME - Task Plan
## Created: $DATE

## Overview
- **Goal**: 
- **Success Criteria**:
- **Constraints**:

## Phases
### Phase 1: Discovery
- Status: not_started
- Tasks:
  - [ ] 
- Output:

## Decision Log
| Date | Decision | Alternatives | Rationale |
|------|----------|--------------|-----------|

## Error Log  
| Attempt | Error | Resolution |
|---------|-------|------------|
EOF

# Create findings.md
cat > findings.md << EOF
# $PROJECT_NAME - Research Findings
## Created: $DATE

## Key Discoveries
-

## Open Questions
-

## Resources
-
EOF

# Create progress.md
cat > progress.md << EOF
# $PROJECT_NAME - Progress Log
## Created: $DATE

## Session Log
### $DATE
- Started project: $PROJECT_NAME
- Created planning files
- Next: Define project goal and phases

## Test Results
| Test | Result | Notes |
|------|--------|-------|
EOF

echo "✅ Created planning files for: $PROJECT_NAME"
echo "📝 task_plan.md - Phases and decisions"
echo "🔍 findings.md - Research and discoveries"
echo "📊 progress.md - Session log and tests"
