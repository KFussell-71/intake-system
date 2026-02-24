# Client Portal Security Architecture

## Overview

The Client Portal provides a secure, limited-access interface for DOR Employment Services clients to:

- Upload documents requested by their Employment Specialist
- View their case progress and milestones
- Complete assigned questionnaires

This document describes the security controls implemented to protect client data.

---

## Authentication Model

### Magic-Link Only (Passwordless)

The portal uses **Supabase Magic-Link authentication** exclusively. This design:

- **Eliminates password-related vulnerabilities** (no brute force attacks, no password reuse)
- **Removes SSN-based authentication** (previous insecure pattern)
- **Prevents self-registration** (all access is staff-controlled)

**Flow:**

```
1. Case Manager invites client via inviteClientToPortal.ts
2. Supabase sends magic-link email to client
3. Client clicks link, redirected to /portal
4. Session created with automatic expiration (30 days default)
```

### Access Lifecycle

| State | Description |
|-------|-------------|
| `is_active = true, expires_at > now()` | Valid access |
| `is_active = true, expires_at <= now()` | Expired (pending revocation) |
| `is_active = false` | Revoked |
| `revoked_at IS NOT NULL` | Explicitly revoked by staff |

---

## Authorization Model

### client_users Link Table

```sql
client_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    client_id UUID REFERENCES clients(id),
    is_active BOOLEAN,
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    invited_by UUID REFERENCES profiles(id)
)
```

This table links an authenticated user (from Supabase Auth) to a specific client record.

### Row-Level Security (RLS) Policies

All portal access is enforced at the database level:

| Table | Policy | Effect |
|-------|--------|--------|
| `clients` | `Portal clients can view own client record` | Can only see their own data |
| `documents` | `Portal clients can view/upload own documents` | Isolated to their client_id |
| `report_versions` | `Deny portal access` | Blocked entirely |
| `report_reviews` | `Deny portal access` | Blocked entirely |
| `audit_logs` | Existing restrictive policies | Blocked |

### Data Sanitization

Portal endpoints return **sanitized data only**:

- ✅ Client name, address, member since date
- ✅ Milestones (name, status, achieved date)
- ✅ Document metadata (name, type, date)
- ❌ SSN, internal notes, AI reports, supervisor comments

---

## Rate Limiting

Edge middleware enforces rate limits on all portal routes:

| Endpoint Pattern | Limit | Window |
|-----------------|-------|--------|
| `/portal/*` | 30 requests | 1 minute |
| Magic-link generation | 5 requests | 1 hour |
| File uploads | 20 uploads | 1 hour |

Rate limit violations return `HTTP 429 Too Many Requests`.

---

## Audit Logging

All portal actions are logged to `portal_activity`:

```sql
portal_activity (
    id UUID,
    client_id UUID,
    user_id UUID,
    action TEXT,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ
)
```

### Logged Actions

| Action | Trigger |
|--------|---------|
| `INVITE_SENT` | Staff invites client |
| `LOGIN` | Client accesses portal |
| `DOCUMENT_UPLOADED` | File upload completed |
| `PROFILE_VIEWED` | Dashboard accessed |
| `STATUS_VIEWED` | Status page accessed |
| `ACCESS_REVOKED` | Staff revokes access |
| `ACCESS_EXPIRED` | Automatic expiration |

---

## Automatic Expiration

A scheduled function runs nightly (2:00 AM) to revoke expired access:

```sql
CREATE FUNCTION revoke_expired_portal_access()
RETURNS void AS $$
BEGIN
    UPDATE client_users
    SET is_active = false, revoked_at = NOW()
    WHERE expires_at <= NOW()
    AND is_active = true
    AND revoked_at IS NULL;
END;
$$;
```

This ensures access is automatically terminated even without manual intervention.

---

## File Upload Security

| Control | Implementation |
|---------|---------------|
| Size limit | 10MB maximum |
| Type validation | PDF, JPG, PNG, GIF, WebP only |
| Filename sanitization | Non-alphanumeric characters replaced |
| Path isolation | Files stored in `client-{client_id}/portal-uploads/` |
| Ownership verification | RLS enforces client_id match |

---

## Middleware Protection

The Next.js middleware (`src/middleware.ts`) provides first-line defense:

1. **Rate limiting** before application logic
2. **Auth token validation** before portal access
3. **Automatic redirect** to login for unauthenticated requests
4. **Rate limit headers** in responses

---

## WCAG 2.1 AA Compliance

The portal UI is designed for accessibility:

- ✅ Semantic HTML structure
- ✅ ARIA labels on interactive elements
- ✅ Keyboard navigation support
- ✅ Color contrast ratios (4.5:1 minimum)
- ✅ Focus management for dynamic content
- ✅ Screen reader compatibility

---

## Threat Mitigations

| Threat | Mitigation |
|--------|-----------|
| Link brute forcing | Rate limiting, single-use links |
| Session hijacking | Supabase secure cookies, HTTPS |
| Cross-client access | RLS policies, ownership checks |
| Privilege escalation | No staff functions exposed |
| Data exfiltration | Sanitized responses, explicit selects |
| Audit circumvention | Immutable logs, service role inserts |

---

## Related Files

- `migrations/20260131_client_portal_schema.sql` - Database schema
- `src/app/actions/portal/` - Server actions
- `src/app/portal/` - UI pages
- `src/middleware.ts` - Edge protection
- `src/lib/rate-limit.ts` - Rate limiting utility

---

*Last Updated: 2026-01-31*
