# Feature 4: Document Management - Task Plan

## Overview

- **Goal**: Enable efficient document handling (Upload, Storage, Preview) linked to Clients.
- **Success Criteria**:
  - Users can upload PDFs/Images to a secure Storage Bucket.
  - Uploads are linked to `documents` table records.
  - Users can preview PDFs within the app without downloading.
  - Security: RLS enforces access (Staff only see assigned clients' docs).
- **Constraints**:
  - Supabase Storage requires "Storage Policies" (distinct from Table RLS).
  - Mock environment must simulate storage actions (`upload`, `createSignedUrl`).

## Phases

### Phase 1: Storage & Backend Verification

- Status: not_started
- Tasks:
  - [ ] Verify `documents` table schema (done?).
  - [ ] Create `storage_policies.sql` migration for "documents" bucket.
  - [ ] Verify `documentService.ts` supports storage operations.
  - [ ] Update `mock.ts` to simulate file uploads.
- Output: Backend ready for binary data.

### Phase 2: UI Implementation

- Status: complete
- Tasks:
  - [ ] Create `FileUploadZone` component (Drag & Drop).
  - [ ] Create `DocumentPreview` modal (PDF Viewer).
  - [ ] Integrate into Client Profile -> Documents Tab.
- Output: Functional Document UI.

## Decision Log

| Date | Decision | Alternatives | Rationale |
|------|----------|--------------|-----------|
| | | | |

## Error Log

| Attempt | Error | Resolution |
|---------|-------|------------|
| | | |
