# Findings

## Analysis of Current System

- Existing stack: Next.js + Supabase.
- Current `intakes` table uses JSONB `data` column.
- **Requirement**: Pivot to normalized tables (`employment_history`, `isp_goals`, etc.) for deterministic reporting.

## UI/UX Requirements

- Skill `ui-ux-pro-max` requires:
  - No emojis as icons.
  - SVG icons (Heroicons/Lucide).
  - `cursor-pointer` on interactives.
  - High contrast (4.5:1).
  - 44x44px touch targets.
