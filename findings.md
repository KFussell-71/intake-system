# Findings: Build Resolution Phase

## Discovery 1: TypeScript Errors
- **Current Error Count**: 98
- **Major Issue**: Missing exports from `@prisma/client`. This usually indicates the Prisma client needs to be re-generated or the schema is out of sync.
- **Legacy Code**: Significant amount of `supabase.from` calls still exist in `ResourceService.ts` and `portal-activity.ts`.

## Discovery 2: Component Prop Mismatches
- `HIPAAFormPage` requires `intakeId`, but it's not being passed from its parent page.
- `TelemetryDashboard` is using snake_case properties (e.g., `event_name`) on types that expect camelCase (e.g., `eventName`).

## Discovery 3: Service Method Signatures
- `CaseService.updateCaseStage` expects a `version` argument that is missing in the call site.
- `DashboardRepository` expects a `userId` that isn't provided by the service wrapper.
