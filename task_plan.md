# Task Plan - DOR System Upgrade

## Phase 1: Database Architecture (Supabase)

- [x] Modify `schema.sql` with new tables and RPC <!-- status: complete -->
- [x] Apply migrations (manual run or script) <!-- status: complete -->
- [x] Verify `get_client_intake_bundle` returns correct shape <!-- status: complete -->

## Phase 2: Core Logic & Agent

- [x] Implement `dorAgent.ts` <!-- status: complete -->
- [x] Implement `generatePDF.ts` <!-- status: complete -->
- [x] Implement `validateIntakeData.ts` <!-- status: complete -->
- [x] Create API Route `/api/generate-report` <!-- status: complete -->

## Phase 3: UI Implementation

- [x] Create `IntakeReportEditor` <!-- status: complete -->
- [x] Create `SupervisorDashboard` <!-- status: complete -->
- [x] Create `ComplianceDashboard` <!-- status: complete -->

## Phase 4: Integration

- [x] Connect UI to API <!-- status: complete -->
- [x] End-to-end Test <!-- status: complete -->

## Phase 5: Switch to Google Gemini

- [x] Install `@google/generative-ai` <!-- status: complete -->
- [x] Refactor `dorAgent.ts` to use Gemini API <!-- status: complete -->
- [x] Configure Environment Variables <!-- status: complete -->
- [x] Verify Report Generation with Gemini <!-- status: complete -->

## Phase 6: Deployment

- [x] Push to GitHub <!-- status: complete -->

## Phase 7: Preparation & Readiness Enhancements

- [x] DB: Migration for `barriers` and `support_services` <!-- status: complete -->
- [x] UI: Update `PreparationReadinessSection.tsx` <!-- status: complete -->
- [x] Agent: Update `get_client_intake_bundle` RPC <!-- status: complete -->
- [x] Deployment: Push to GitHub <!-- status: complete -->

## Phase 8: Strengths & Motivation

- [x] UI: Add Strengths/Motivation fields to `PreparationReadinessSection` <!-- status: complete -->
- [x] Agent: Update Prompt context <!-- status: complete -->
- [x] Deployment: Push to GitHub <!-- status: complete -->

## Phase 9: Refactor - Move Strengths to Goals

- [x] Refactor: Move Strengths/Motivation UI to Goals Page <!-- status: complete -->
- [x] Deployment: Push to GitHub <!-- status: complete -->

## Phase 10: Industry Preference & Job Targets

- [x] UI: Add Industry/Pay/Type fields to `PreparationReadinessSection` <!-- status: complete -->
- [x] Agent: Update Prompt context <!-- status: complete -->
- [x] Deployment: Push to GitHub <!-- status: complete -->

## Phase 11: Voice-to-Case-Note Dictation 🎙️

- [x] UI: Create `VoiceInput` component <!-- status: complete -->
- [x] UI: Integrate into `ElegantTextarea` <!-- status: complete -->
- [x] Deploy: Push to GitHub <!-- status: complete -->

## Phase 12: Accessibility "Gov-Spec" Mode 👁️

- [ ] UI: Create `AccessibilityToggle` component <!-- status: todo -->
- [ ] UI: Implement High Contrast Theme in Tailwind <!-- status: todo -->
- [ ] UI: Add `OpenDyslexic` font support <!-- status: todo -->
- [ ] Deploy: Push to GitHub <!-- status: todo -->

## Phase 13: Field-Ready Mobility (PWA) 📱

- [ ] Config: Install `next-pwa` <!-- status: todo -->
- [ ] Config: Generate Manifest and Icons <!-- status: todo -->
- [ ] Deploy: Push to GitHub <!-- status: todo -->

## Phase 14: Longitudinal Progress Visualization 📈

- [ ] Config: Install `recharts` <!-- status: todo -->
- [ ] UI: Create `ReadinessChart` component <!-- status: todo -->
- [ ] UI: Create `BarriersChart` component <!-- status: todo -->
- [ ] Deploy: Push to GitHub <!-- status: todo -->

## Phase 15: AI "Pre-Flight" Compliance Check 🛡️

- [ ] Agent: Create `complianceAgent.ts` (LogicValidator) <!-- status: todo -->
- [ ] API: Create `/api/validate-intake` endpoint <!-- status: todo -->
- [ ] UI: Add Validation Step to Review Page <!-- status: todo -->
- [ ] Deploy: Push to GitHub <!-- status: todo -->

## Phase 16: Client "Self-Service" Portal 🤝

- [ ] DB: Create `portal_access_tokens` table <!-- status: todo -->
- [ ] UI: Create Client Login / Magic Link Page <!-- status: todo -->
- [ ] UI: Create Client Intake View (Limited) <!-- status: todo -->
- [ ] Deploy: Push to GitHub <!-- status: todo -->
