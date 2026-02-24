# Blue Team Remediation Plan

## Objective

Systematically remediate critical security vulnerabilities identified in Red Team audit while preserving architecture, maintaining compliance, and avoiding regressions.

## Phase 1: Finding Triage

### Critical Findings

- [ ] **CRITICAL-1**: Missing authentication in `/api/generate-report` - CONFIRMED
- [ ] **HIGH-2**: Hardcoded API key in `dorAgent.ts:217` - CONFIRMED
- [ ] **HIGH-3**: AI prompt injection vulnerability - CONFIRMED
- [ ] **HIGH-4**: Overly permissive RLS policies - CONFIRMED
- [ ] **HIGH-5**: Missing audit logging - CONFIRMED

### Medium Findings

- [ ] **MEDIUM-6**: Email service lacks rate limiting - CONFIRMED
- [ ] **MEDIUM-7**: Document upload missing virus scanning - CONFIRMED
- [ ] **MEDIUM-8**: SQL injection risk in search - CONFIRMED
- [ ] **MEDIUM-9**: Weak markdown parser - FALSE POSITIVE (already using DOMPurify)

### Low Findings

- [ ] **LOW-10**: Missing HTTPS enforcement - CONFIRMED

## Phase 2: Remediation Strategy

### CRITICAL-1: Missing Auth in Generate Report API

**Root Cause:** No authentication/authorization checks in API route
**Files to Change:**

- `src/app/api/generate-report/route.ts`

**Fix Strategy:**

1. Add authentication check using existing `verifyAuthorization`
2. Add CSRF protection using `verifyOrigin`
3. Add client access verification
4. Add audit logging
5. Add rate limiting

**Compliance Impact:** Fixes HIPAA violation, adds audit trail

### HIGH-2: Hardcoded API Key

**Root Cause:** Fallback API key in source code
**Files to Change:**

- `src/lib/agents/dorAgent.ts`
- `.env.example`

**Fix Strategy:**

1. Remove hardcoded fallback
2. Throw error if env var missing
3. Document in .env.example

**Compliance Impact:** Prevents key exposure

### HIGH-3: AI Prompt Injection

**Root Cause:** Unsanitized user data in prompts
**Files to Change:**

- `src/lib/agents/dorAgent.ts`

**Fix Strategy:**

1. Create sanitization function for all user inputs
2. Validate output for injection indicators
3. Add content filtering

**Compliance Impact:** Prevents data exfiltration via AI

### HIGH-4: Overly Permissive RLS

**Root Cause:** `USING (true)` policies
**Files to Change:**

- `migrations/20260127_tracking_system.sql`

**Fix Strategy:**

1. Replace with scoped policies
2. Add helper functions for common checks
3. Test with different user roles

**Compliance Impact:** Enforces least privilege

### HIGH-5: Missing Audit Logging

**Root Cause:** Critical operations not logged
**Files to Change:**

- `src/lib/notifications/notificationService.ts`
- `src/lib/documents/documentService.ts`
- `src/lib/search/searchService.ts`

**Fix Strategy:**

1. Add audit log calls to all critical operations
2. Ensure immutable audit logs
3. Add retention policy

**Compliance Impact:** SOC 2 requirement

### MEDIUM-6: Email Rate Limiting

**Root Cause:** No rate limiting on email sends
**Files to Change:**

- `src/lib/email/emailService.ts`

**Fix Strategy:**

1. Add simple in-memory rate limiter
2. Track by email address
3. Return error on limit exceeded

**Compliance Impact:** Prevents abuse

### MEDIUM-7: Virus Scanning

**Root Cause:** No file validation
**Files to Change:**

- `src/lib/documents/documentService.ts`

**Fix Strategy:**

1. Add MIME type validation
2. Add file extension validation
3. Add file size limits
4. Document need for external virus scanning

**Compliance Impact:** Reduces malware risk

### MEDIUM-8: SQL Injection in Search

**Root Cause:** Unsanitized query in .ilike()
**Files to Change:**

- `src/lib/search/searchService.ts`

**Fix Strategy:**

1. Create query sanitization function
2. Escape SQL wildcards
3. Limit query length

**Compliance Impact:** Prevents SQL injection

### LOW-10: HTTPS Enforcement

**Root Cause:** No HTTPS check in production
**Files to Change:**

- `src/lib/auth/authHelpersServer.ts`

**Fix Strategy:**

1. Add HTTPS check in verifyOrigin
2. Only enforce in production

**Compliance Impact:** Prevents MITM attacks

## Phase 3: Implementation Order

### Week 1 (CRITICAL)

1. CRITICAL-1: Auth in generate-report API
2. HIGH-2: Remove hardcoded API key
3. HIGH-4: Fix RLS policies
4. HIGH-5: Add audit logging

### Week 2 (HIGH + MEDIUM)

5. HIGH-3: AI prompt sanitization
2. MEDIUM-6: Email rate limiting
3. MEDIUM-7: File validation
4. MEDIUM-8: Search sanitization
5. LOW-10: HTTPS enforcement

## Phase 4: Testing Strategy

### For Each Fix

1. Unit test the fix
2. Integration test the workflow
3. Verify no regressions
4. Verify audit logs created
5. Test with different user roles

### Regression Tests

- Report generation still works
- Supervisor workflows intact
- PDF generation works
- Audit trails preserved
- UI/UX unchanged

## Phase 5: Verification Criteria

### Success Criteria

- All CRITICAL and HIGH findings resolved
- No new vulnerabilities introduced
- All existing tests pass
- Build passes
- Audit logs complete
- Documentation updated

### Evidence Required

- Code changes with inline comments
- Test results
- Build output
- Retest of Red Team scenarios
