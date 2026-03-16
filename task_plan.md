# Task Plan: Resolve TypeScript Build Errors

## Overview
The project currently fails `npm run type-check` with 98 TypeScript errors across many files. The majority stem from:
- Incorrect imports from `@prisma/client` (e.g., `Role`, `AvailabilityBlock`, `Prisma`, `PrismaClient`).
- Legacy Supabase calls still present in services and actions.
- Mismatched function signatures and missing type definitions.
- UI components expecting props that are not provided.

## Phases
1. **Prisma Client Refactor**
   - Create a central `prisma/config.ts` that exports a singleton `prisma` instance.
   - Update all imports to use this instance.
   - Remove non‑existent exports (`Role`, `AvailabilityBlock`, `Prisma`).
   - Add missing type definitions (e.g., `Role` enum from schema, `AvailabilityBlock` type).
2. **Supabase Migration**
   - Identify all remaining `supabase.from` calls (services, actions, lib).
   - Replace with equivalent Prisma queries using the new `prisma` instance.
3. **Signature & Prop Fixes**
   - Align component props with actual usage (e.g., `HIPAAFormPage` requires `intakeId`).
   - Add missing arguments to service calls (e.g., `caseService.updateCaseStage` needs version).
   - Adjust state updates to match expected types (e.g., `setMessages` in ChatWindow).
4. **Utility & Helper Updates**
   - Ensure `authHelpersServer` imports correct `PrismaClient`.
   - Update any custom utility functions that referenced old Supabase client.
5. **Testing & Validation**
   - Run `npm run type-check` after each phase.
   - Run `npm run lint` to catch remaining style issues.
   - Execute a quick smoke test (`npm run dev`) to ensure the app starts.

## Milestones
- **M1**: Prisma config created and all imports fixed.
- **M2**: Supabase calls replaced; no `from` usage remains.
- **M3**: UI component prop errors resolved.
- **M4**: All TypeScript errors reduced to <5.
- **M5**: Successful build and start of the app.

## Next Immediate Action
Create a `prisma/config.ts` file exporting a configured `PrismaClient` instance and update a sample action (`team-actions.ts`) to use it. This will validate the new import pattern.
