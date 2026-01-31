---
name: systematic-planning
description: >
  Implements Manus-style file-based planning for complex tasks. 
  Creates task_plan.md, findings.md, and progress.md. Use when starting 
  complex multi-step tasks, research projects, or any task requiring >5 tool calls.
  Also triggers when user mentions "plan", "research", "complex task", 
  "multi-step", or "project setup". Follows the 2-action rule and 3-strike error protocol.
license: MIT
---

# Systematic Planning - File-Based Working Memory

Work like Manus: Use persistent markdown files as your "working memory on disk" for complex tasks.

## Core Principle

```
Context Window = RAM (volatile, limited)
Filesystem = Disk (persistent, unlimited)

→ Anything important gets written to disk immediately.
```

## Quick Start

**BEFORE ANY COMPLEX TASK**, create these three files:

1. **task_plan.md** — Track phases, progress, and decisions
2. **findings.md** — Store research, discoveries, and insights  
3. **progress.md** — Session log and test results

Use the provided scripts to scaffold these files automatically:

```bash
# Create all planning files
bash .agent/skills/systematic-planning/scripts/init_plan.sh "Project Name"

# Or create individually
bash .agent/skills/systematic-planning/scripts/create_plan.sh "Task description"
bash .agent/skills/systematic-planning/scripts/log_finding.sh "Key discovery"
bash .agent/skills/systematic-planning/scripts/update_progress.sh "Completed phase 1"
```

## File Purposes & Update Triggers

| File | Purpose | When to Update | Template |
|------|---------|----------------|----------|
| `task_plan.md` | Phases, progress, key decisions | After each phase completion | [task_plan_template.md](references/task_plan_template.md) |
| `findings.md` | Research, discoveries, insights | After ANY discovery | [findings_template.md](references/findings_template.md) |
| `progress.md` | Session log, test results, errors | Continuously throughout work | [progress_template.md](references/progress_template.md) |

## Critical Rules (Non-Negotiable)

### 1. Create Plan First

**Never start a complex task without `task_plan.md`.** Define phases, success criteria, and constraints before any execution.

### 2. The 2-Action Rule
>
> "After every 2 view/browser/search operations, IMMEDIATELY save key findings to text files."

Prevents loss of visual/multimodal information. Use script:

```bash
bash .agent/skills/systematic-planning/scripts/log_finding.sh "Found that X framework supports Y feature"
```

### 3. Read Before Decide

Before major decisions, read the relevant section of the plan file. Keep goals in your attention window.

### 4. Update After Act

After completing any phase:

1. Mark status: `in_progress` → `complete`
2. Log errors encountered
3. Note files created/modified
4. Update next steps if needed

### 5. Log ALL Errors

Every error goes in the plan file immediately. Builds institutional knowledge and prevents repetition.

### 6. Never Repeat Failures

```
if action_failed:
    next_action != same_action
```

Track what you tried. Mutate the approach systematically.

## The 3-Strike Error Protocol

```
ATTEMPT 1: Diagnose & Fix
  → Read error carefully
  → Identify root cause
  → Apply targeted fix

ATTEMPT 2: Alternative Approach
  → Same error? Try different method
  → Different tool? Different library?
  → NEVER repeat exact same failing action

ATTEMPT 3: Broader Rethink
  → Question assumptions
  → Search for existing solutions
  → Consider updating the plan

AFTER 3 FAILURES: Escalate to User
  → Explain what you tried
  → Share specific errors and diagnostics
  → Ask for guidance or permission to pivot
```

## When to Use This Pattern

### ✅ Use For

- Multi-step tasks (3+ steps)
- Research projects requiring exploration
- Building/creating projects from scratch
- Tasks spanning many tool calls (>5)
- When user mentions: "plan", "research", "complex task", "project setup"
- Debugging sessions with multiple approaches needed

### ❌ Skip For

- Simple questions (single answer)
- Single-file edits
- Quick lookups (one search/response)
- Trivial formatting changes

## Workflow Integration

### With Brainstorming Skill

When using `brainstorming-ideas-into-designs` skill:

1. Create `task_plan.md` first with brainstorming phase
2. Use findings.md to capture design decisions
3. Progress.md tracks validation steps

### With Git Skill  

When using `git-pushing` skill:

1. Log major milestones in progress.md
2. Create commit messages from plan updates
3. Include planning files in version control

### With UI/UX Skill

When using `ui-ux-pro-max` skill:

1. Plan research phases for design exploration
2. Log color palette decisions in findings.md
3. Track component implementation in progress.md

## Templates & Examples

### Task Plan Structure

```markdown
# [Project Name] - Task Plan

## Overview
- **Goal**: [Clear objective]
- **Success Criteria**: [Measurable outcomes]
- **Constraints**: [Limitations, deadlines]

## Phases
### Phase 1: [Discovery/Research]
- Status: not_started | in_progress | complete | blocked
- Tasks: [Specific actions]
- Output: [Expected deliverables]

### Phase 2: [Implementation]
- Status: not_started
- Tasks: []
- Output: []

## Decision Log
| Date | Decision | Alternatives | Rationale |
|------|----------|--------------|-----------|
| | | | |

## Error Log
| Attempt | Error | Resolution |
|---------|-------|------------|
| | | |
```

## Advanced Patterns

### Progressive Disclosure

For very large projects, use nested planning:

```
project/
├── master_plan.md (High-level phases)
├── phase_1/ (Detailed planning per phase)
│   ├── plan.md
│   ├── findings.md
│   └── progress.md
└── phase_2/
    ├── plan.md
    └── ...
```

### Integration with Project Tools

```bash
# Create planning files in project root
bash .agent/skills/systematic-planning/scripts/init_plan.sh "API Integration Project"

# Use with existing project structure
cp .agent/skills/systematic-planning/references/task_plan_template.md docs/planning/
cp .agent/skills/systematic-planning/references/findings_template.md docs/research/
```

## Anti-Patterns to Avoid

| Don't | Do Instead |
|-------|------------|
| State goals once and forget | Re-read plan before each decision |
| Hide errors and retry silently | Log errors immediately to plan file |
| Stuff everything in context | Store large content in findings.md |
| Start executing immediately | Create plan file FIRST |
| Repeat failed actions | Track attempts, mutate approach |
| Keep mental track of progress | Update progress.md continuously |
| Assume you'll remember findings | Log after every 2 actions (2-action rule) |

## Quality Checklist

Before considering a phase complete:

### Planning Quality

- [ ] All phases have clear success criteria
- [ ] Each task is actionable and specific
- [ ] Constraints and assumptions documented
- [ ] Error log includes all failures

### Execution Quality  

- [ ] 2-action rule followed (findings logged regularly)
- [ ] Progress updated after each session
- [ ] Decisions logged with rationale
- [ ] No repeated failure patterns

### Documentation Quality

- [ ] Files are well-structured and readable
- [ ] Key discoveries easily findable
- [ ] Test results include context
- [ ] All files committed to version control

## Exit Criteria

A project is ready for completion when:

1. **task_plan.md**: All phases marked `complete`
2. **findings.md**: Key discoveries summarized
3. **progress.md**: Final results documented
4. **Error log**: All issues resolved or documented
5. **Decision log**: Complete rationale for major choices

Only then should you proceed to final delivery or handoff.

---

## References

- **Templates**: See `references/` directory for all templates
- **Examples**: `examples/` contains real-world planning files
- **Integration Guide**: `references/integration.md` for combining with other skills
- **Troubleshooting**: `references/troubleshooting.md` for common issues

## Quick Commands Reference

```bash
# Initialize everything
bash .agent/skills/systematic-planning/scripts/init_plan.sh "Project Name"

# Quick logging
bash .agent/skills/systematic-planning/scripts/log_finding.sh "Discovered X"
bash .agent/skills/systematic-planning/scripts/log_error.sh "Error message" "Fix attempt"

# Status updates  
bash .agent/skills/systematic-planning/scripts/update_phase.sh "Phase Name" complete
bash .agent/skills/systematic-planning/scripts/update_progress.sh "Completed testing"
```

---
*This skill implements systematic thinking patterns inspired by engineering best practices and cognitive psychology principles for effective problem-solving.*
