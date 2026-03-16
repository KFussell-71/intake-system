# E2E Portal Verification - Research Findings

## Created: 2026-02-16

## Key Discoveries

- **CSP Violation**: Found that `connect-src` only allowed `*.supabase.co` and `*.googleapis.com`, blocking local Supabase instance at `http://127.0.0.1:54321`.
- **Import Regression**: Encountered `Module not found: Can't resolve '@/app/actions/comparabilityActions'` in `ComparabilityWidget.tsx`. This was caused by the move into the `(app)` route group.
- **Mock Auth Necessity**: Verified that `NEXT_PUBLIC_ALLOW_MOCK_AUTH=true` is required in `.env.local` to bypass external auth during local E2E testing.

## Open Questions

- [ ] Does the `(portal)` route group have similar import path regressions?
- [ ] Are there other local development URLs blocked by the production-hardened CSP?

## Resources

- [next.config.js](file:///home/kfussell/Documents/Intake/next.config.js)
- [src/features/comparability/components/ComparabilityWidget.tsx](file:///home/kfussell/Documents/Intake/src/features/comparability/components/ComparabilityWidget.tsx)
- [scripts/architecture-guard.js](file:///home/kfussell/Documents/Intake/scripts/architecture-guard.js)
