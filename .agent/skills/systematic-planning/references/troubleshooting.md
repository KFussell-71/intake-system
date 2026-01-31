# Troubleshooting

## Lost State

If you lose context or the window resets, immediately re-read `task_plan.md` and `progress.md` to reconstruct your current state.

## Repeated Errors

If an error persists across 3 attempts, follow the **3-Strike Error Protocol** in `SKILL.md`. Check `findings.md` for similar errors encountered previously.

## Script Failures

Ensure scripts in `scripts/` have execution permissions:

```bash
chmod +x .agent/skills/systematic-planning/scripts/*.sh
```
