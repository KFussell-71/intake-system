# Red Team Security Audit - Task Plan

## Objective

Conduct aggressive security and compliance audit of DOR Employment Services platform from perspective of state IT security office, SOC 2 auditor, and procurement review board.

## Attack Surfaces to Analyze

### 1. Security & Vulnerabilities

- [ ] SQL injection risks in Supabase queries
- [ ] AI prompt injection vulnerabilities
- [ ] HTML/PDF injection in report generation
- [ ] Secrets handling and environment variables
- [ ] Supabase RLS policy analysis
- [ ] Unauthorized data access paths
- [ ] SSRF risks in PDF generation
- [ ] Supply chain / dependency analysis

### 2. Privacy & Data Protection

- [ ] PII/PHI exposure in code
- [ ] Access scoping and data leakage
- [ ] Error logging exposing sensitive data
- [ ] AI hallucination risks with client data
- [ ] Client data in browser storage

### 3. AI Governance & Safety

- [ ] Role leakage in AI prompts
- [ ] Missing guardrails
- [ ] Non-deterministic outputs
- [ ] Fabrication prevention
- [ ] Input/output layer separation

### 4. Compliance & Regulatory

- [ ] California DOR standards compliance
- [ ] Audit trail completeness
- [ ] Change management controls
- [ ] Supervisor oversight enforcement
- [ ] Appeal/correction workflows

### 5. Reliability & Failure Modes

- [ ] Partial data handling
- [ ] Race conditions
- [ ] Idempotency
- [ ] PDF generation failure recovery
- [ ] Database transaction integrity

### 6. Maintainability & Scalability

- [ ] Code duplication
- [ ] Hard-coded logic
- [ ] Separation of concerns
- [ ] Multi-county scalability
- [ ] Technical debt

### 7. UX / Human Error Risk

- [ ] Incorrect submission flows
- [ ] Ambiguous status indicators
- [ ] Missing confirmations
- [ ] WCAG compliance
- [ ] Government UX standards

## Files to Review

- Authentication/authorization code
- API routes
- Database schemas and RLS policies
- AI report generation
- Supervisor actions
- Audit logging
- Email/notification services
- Document management
- Environment configuration
