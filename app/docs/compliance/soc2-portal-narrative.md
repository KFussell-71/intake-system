# SOC 2 Compliance Narrative: Client Portal

## Section: Client Portal Security & Access Controls

The platform includes a secure, read-only client portal designed to support document submission and limited self-service functionality while maintaining strict data protection standards.

---

### Authentication

Clients access the portal exclusively via **time-limited, one-time magic links** issued by authorized Employment Specialists. The platform does not use passwords, SSN-based authentication, or open registration. All access is explicitly provisioned and can be revoked at any time.

**Key Controls:**

- No password storage or transmission
- No use of Social Security Numbers for authentication
- Single-use magic links with 30-day expiration
- Staff-controlled access provisioning
- Immediate revocation capability

---

### Access Scope

Client portal users are restricted to a **minimal data surface**. Clients may:

- ✅ Upload documents requested by their Employment Specialist
- ✅ Complete assigned questionnaires
- ✅ View a sanitized summary of their own information
- ✅ Track case milestones and progress

Clients are explicitly **prevented from accessing**:

- ❌ Internal case notes
- ❌ AI-generated reports
- ❌ Supervisory comments and reviews
- ❌ Audit logs
- ❌ Other clients' data

---

### Authorization Enforcement

**Row Level Security (RLS) policies** enforce ownership-based access at the database level. Even in the event of application-layer failure, unauthorized access to data is prevented. All portal queries are filtered by the authenticated user's linked client record.

**Defense in Depth Layers:**

1. Edge middleware rate limiting
2. Supabase Auth session validation
3. client_users linkage verification
4. RLS policy enforcement at database level
5. Explicit DENY policies on sensitive tables

---

### Audit Logging

All client portal actions are recorded in **immutable audit logs** with timestamps and actor attribution:

| Event | Logged Data |
|-------|-------------|
| Invitation Sent | Invited email, expiration date, inviting staff ID |
| Portal Login | User ID, client ID, timestamp |
| Document Upload | Filename, file size, content type, upload path |
| Access Revocation | Revoking staff ID, reason, timestamp |
| Access Expiration | System-triggered, automatic logging |

Audit logs cannot be modified or deleted by portal users or standard staff accounts.

---

### Data Protection

Sensitive identifiers are **never transmitted to the client browser**. All uploads are validated for size (10MB maximum), type (PDF, JPG, PNG, GIF, WebP only), and ownership prior to storage. File paths are isolated by client ID to prevent cross-client access.

---

### Revocation & Lifecycle

Client portal access is **time-bounded** (30 days by default) and may be:

- Manually revoked by assigned staff or supervisors
- Automatically expired by nightly system job
- Extended by issuing a new invitation

Upon revocation or expiration, all subsequent access attempts are denied immediately at the database level.

---

### Accessibility Compliance

The client portal is designed to conform with **WCAG 2.1 Level AA accessibility standards**, including:

- Keyboard operability for all interactive elements
- Screen reader compatibility with proper ARIA labels
- Color contrast compliance (minimum 4.5:1 ratio)
- Semantic HTML markup for navigation
- Focus management for dynamic content updates

Accessibility testing is conducted prior to deployment and as part of ongoing release cycles.

---

### Rate Limiting

To protect against abuse, rate limiting is enforced at the edge:

| Endpoint | Rate Limit |
|----------|------------|
| Portal pages | 30 requests/minute |
| Magic-link requests | 5/hour per email |
| File uploads | 20/hour per user |

Violations result in HTTP 429 responses with retry guidance.

---

### Procurement-Ready Statement

> *This design aligns with SOC 2 principles for access control, least privilege, and auditability, and reflects best practices used by public-sector digital services.*

---

### Technical Implementation

| Component | File |
|-----------|------|
| Database Schema | `migrations/20260131_client_portal_schema.sql` |
| Server Actions | `src/app/actions/portal/` |
| Rate Limiting | `src/lib/rate-limit.ts` |
| Middleware | `src/middleware.ts` |
| Portal UI | `src/app/portal/` |
| Activity Logging | `src/lib/portal-activity.ts` |

---

*Document Version: 1.0*  
*Last Updated: 2026-01-31*  
*Prepared For: SOC 2 Type II Audit*
