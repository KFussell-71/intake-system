# Production Hardening Plan: Level 1 Architecture

**Objective:** Elevate the codebase to "Production Level 1" by addressing structural issues, mixed trust boundaries, and code smells identified in the architectural health check.

---

## Phase 1: Structural Integrity & Trust Boundaries

*Goal: Enforce strict separation of concerns and remove "God Mode" clients from general scope.*

- [ ] **1.1 Isolate Admin Logic**
  - Create `src/lib/supabase/admin.ts` (Service Role only).
  - Move `createAdminClient` from `server.ts` to `admin.ts`.
  - Add production warning/guard to `admin.ts`.
  - Audit and update all imports.

- [ ] **1.2 Standardize Auth Resolution**
  - Create `src/lib/auth/guard.ts` utility.
  - Implement invariant: `requireAuth()` that throws on failure.
  - Replace ad-hoc `supabase.auth.getUser()` checks in Server Actions.

- [ ] **1.3 CI/CD Hygiene**
  - Verify `tsconfig.json` has `"strict": true`.
  - Add `eslint --max-warnings=0` to build script.
  - Add migration integrity check script.

## Phase 2: Reliability & Error Handling

*Goal: Eliminate silent failures and "it builds but doesn't work" scenarios.*

- [ ] **2.1 Standardize Action Results**
  - Create `src/types/action-result.ts`.
  - Define `type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }`.
  - Refactor `inviteClientToPortal` and `generateEmploymentReport` to use this pattern.

- [ ] **2.2 Idempotency Guards**
  - Update `generateEmploymentReport` to prevent duplicate concurrent runs.
  - Add database-level constraint or application-level check (e.g., checksum or status lock).

## Phase 3: Portal Security Hardening

*Goal: Ensure portal users are strictly isolated from staff logic.*

- [ ] **3.1 Portal RLS Verification**
  - Audit `client_users` policies.
  - Ensure Portal Actions strictly enforce `role = 'client'` (or equivalent metadata check).
  - Test boundary: Verify a localized portal user cannot access staff RPCs.

## Phase 4: Code Smells & Maintenance

*Goal: Fix "repairable" smells for audit cleanliness.*

- [ ] **4.1 HTML Sanitization Review**
  - Audit `IntakeReportEditor.tsx` `dangerouslySetInnerHTML`.
  - Ensure `DOMPurify` is configured with strict AllowList.

- [ ] **4.2 RPC cleanup (Optional/High Effort)**
  - Identify "fat" SQL functions.
  - Plan migration of business logic to TypeScript where feasible.

---
**Success Criteria:**

- No mixed usage of Admin/Anon clients.
- All Server Actions use standardized Guard + Error patterns.
- Build passes with Strict Mode.
- Portal identity is cryptographically isolated.
