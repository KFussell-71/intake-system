# Task Plan - Production Ready Product

## Phase 1: Research & Assessment

- [x] Analyze project structure and dependencies
- [x] Identify available and missing skills
- [x] Review core application logic in `src/app` and `src/lib`
- [x] Review database schema in `schema.sql` and `migrations`

## Phase 2: Core Infrastructure & Backend

- [x] Centralized configuration (`unifiedConfig.ts`)
- [x] Refactor `supabase.ts` to use `unifiedConfig`
- [x] Implement Repository layer (`ClientRepository`, `DashboardRepository`)
- [x] Implement Service layer (`IntakeService`, `DashboardService`, `AuthService`)
- [x] Implement Controller layer (`IntakeController`, `DashboardController`, `AuthController`)
- [x] Generate database types (`src/types/supabase.ts`)

## Phase 3: Frontend & UI/UX Modularization

- [x] Move intake logic to `src/features/intake/`
- [x] Modularize `NewIntakePage` into sub-components
- [x] Refactor Dashboard and Login pages to use controllers
- [x] Enhance UI components (`GlassCard`, `ActionButton`)

## Phase 4: Verification & Sign-off

- [x] Setup Vitest and write unit tests
- [x] Manual verification and Security audit
- [x] Final CI Pass Report

## Phase 10: One-Click Setup Utility

- [x] Brainstorm the most 'noob-friendly' way to set up a Next.js/Supabase app
- [x] Create `setup.js` script
- [x] Update `package.json` with setup command
- [x] Document usage in README
- [x] Deployment Debugging: Fix TypeScript build and Missing Dependencies (Round 7)
- [x] Update `README.md` with the new one-step process
- [x] Final manual verification of the setup flow

## Phase 12: Application Enhancements

- [x] Add "Document Review & Verification" to Identity Page
  - [x] UI: Checkboxes/Status for Referral, Auth, Work History
  - [x] UI: Date Reviewed fields
  - [x] UI: Notes/Comments textarea for each item
  - [x] UI: Upload/View integration
  - [x] DB: Update `intakes` schema (JSONB)

## Phase 13: Prep Page Enhancements

- [ ] Add "Preparation & Readiness Tracking" to Prep Page
  - [ ] DB/Types: Add Resume, Mock Interview, and Networking date+notes fields
  - [ ] UI: Create `PreparationReadinessSection` component (matching Doc Review style)
  - [ ] UI: Integrate into `IntakeStepPrep`
