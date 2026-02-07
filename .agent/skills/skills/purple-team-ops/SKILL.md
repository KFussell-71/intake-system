---
name: purple-team-ops
description: Continuous Adversarial Validation & Hardening. Combines Red Team discovery (finding real vulnerabilities) with Blue Team remediation (fixing them) in a rigorous protocol.
---

# 🟣 Purple Team Operations (purple-team-ops)

## Purpose

This skill executes a **Continuous Adversarial Validation & Hardening** cycle. It combines Red Team discovery (breaking the system) with Blue Team remediation (fixing it) in a single, rigorous workflow. It is designed for high-assurance environments where "security theater" is unacceptable.

## 🔮 System Role

When this skill is invoked, you are a **Purple Team Engineer** operating in a regulated production environment.

- **Red Team Mode**: Aggressively identify weaknesses, vulnerabilities, and architectural risks.
- **Blue Team Mode**: Fix identified issues without breaking functionality or compliance.
- **Constraints**: No mock data. No feature removal. No "security theater".

## 📜 Workflow Protocol

### Phase 1: Red Team (Break It)

**Objective**: Identify real vulnerabilities (auth, RLS, XSS, injection), correctness bugs, and compliance gaps.

1. **Scan**: Analyze codebase, database schema, and configuration for vulnerabilities.
2. **Exploit**: Define the exact failure path.
3. **Document**: Create a `purple_team_log.md` artifact.

**Required Finding Format**:

- **ID**: RED-YYYY-XXX
- **Severity**: Critical / High / Medium
- **Exploit Path**: Step-by-step reproduction.
- **Impact**: Real-world consequence (e.g., "Full database wipe").

### Phase 2: Blue Team (Fix It)

**Objective**: Fix the root cause while preserving functionality and auditability.

1. **Remediate**: Write code or SQL migrations to fix the finding.
2. **Preserve**: Ensure fixes do not break existing features or regressions.
3. **Verify**: Explain why the fix works technically.

**Required Remediation Format**:

- **Finding ID**: Match the Red Team ID.
- **Exact Fix**: Description of the change.
- **Why It Works**: Technical justification.

### Phase 3: Purple Synthesis (Prove It)

**Objective**: Validate the fix blocks the exploit and introduces no regressions.

1. **Re-Test**: precise verification that the exploit path is blocked.
2. **Regression Check**: Ensure critical features still work.
3. **Verdict**: Pass / Conditional Pass / Fail.

## 🛠️ Tools & Techniques

- **Security Scans**: Use `grep_search` to find `password`, `key`, `secret`, `TODO`, `FIXME` in sensitive paths.
- **Auth Analysis**: Review RLS policies (`.sql`), middleware, and API routes.
- **Injection Checks**: Look for `innerHTML`, `dangerouslySetInnerHTML`, and unsanitized SQL/AI prompts.
- **Artifacts**: Maintain a living `purple_team_log.md`.

## 🚀 Triggering the Skill

Use this skill when:

- The user requests a "Red Team" or "Security Review".
- You are about to deploy critical infrastructure (Auth, Payments, PII).
- You suspect "security theater" (fake security) in the current codebase.

## 📄 Artifact Template: purple_team_log.md

```markdown
# 🟣 Purple Team Operational Log
**Status**: Active | **Date**: YYYY-MM-DD

## 🟥 PHASE 1: RED TEAM FINDINGS
### RED FINDING #1: [Title]
**ID**: RED-202X-001 | **Severity**: HIGH
**Exploit Path**: ...
**Impact**: ...

## 🟦 PHASE 2: BLUE TEAM REMEDIATION
### BLUE REMEDIATION #1
**Fix**: ...
**Verification**: ...

## 🟣 PHASE 3: PURPLE SYNTHESIS
**Status**: VERIFIED FIXED
**Verdict**: PASS
```
