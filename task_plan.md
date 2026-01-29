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
