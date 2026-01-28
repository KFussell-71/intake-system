# Findings

## User Requirements

- Web app for nonprofit social services.
- Social workers are users.
- Features: Intake, Follow-up, Client History, Search.
- Security: Secure Auth (Username/Password), HIPAA-aware, Role-based access, client isolation.
- Auditing: Log all CRUD actions (Who, What, When).
- PDF Export: State-required formatting, match Word docs.
- Tech: REST/API, Data validation, Secure sessions.

## Document Analysis

### Intake Report (DOR.ES New Beginnings Outreach Report Intake)

- **Fields**: Consumer Name, Report Date, Prepared By, Intake Completion Date.
- **Sections**: Referral Packet Review (Checklist), Work History (Text), Medical/Psych Evaluations (Text), Consent (Boolean).
- **ISP**: Job Search Activities (Applications, Resume, Interviews, Networking), Supportive Services, Time Frames, Goals.

### Tracking System (NBOC Tracking System Current)

- **Fields**: Name, Phone, Email, Address, Referral/Intake Dates.
- **Milestones**: ISP Complete, Employment Prep Classes (1-4), Resume/App Complete.
- **Job Placement**: Company, Wage, Title, Hours, Supervisor, Benefits, Transportation.
- **Retention**: 90-day monitoring, bi-monthly contacts, performance logs, barriers, action plans.
- **Curriculum**: Monday-Thursday training topics.

## Technology Stack

- **Framework**: Next.js (React, Server Components, API routes).
- **Styling**: Vanilla CSS with CSS Variables for a premium, custom design (as per Antigravity guidelines).
- **Database/Auth**: Supabase (PostgreSQL + Auth + Row Level Security).
- **PDF**: `jspdf` or `react-pdf` for state-compliant export.
- **Auditing**: Dedicated `audit_logs` table in PostgreSQL with triggers.

## Database Schema (PostgreSQL)

### `profiles`

- `id`: uuid (PK, links to auth.users)
- `username`: text
- `role`: text (staff, admin)

### `clients`

- `id`: uuid (PK)
- `name`: text (searchable)
- `phone`: text
- `email`: text
- `address`: text
- `created_at`: timestamptz
- `created_by`: uuid (FK profiles)

### `intakes`

- `id`: uuid (PK)
- `client_id`: uuid (FK clients)
- `report_date`: date
- `prepared_by`: uuid (FK profiles)
- `completion_date`: date
- `data`: jsonb (Stores the complex form structure)
- `created_at`: timestamptz
- `updated_at`: timestamptz
- `updated_by`: uuid (FK profiles)

### `tracking_milestones`

- `id`: uuid (PK)
- `client_id`: uuid (FK clients)
- `milestone_name`: text (e.g., 'Class 1', 'ISP Complete')
- `completion_date`: date

### `job_placements`

- `id`: uuid (PK)
- `client_id`: uuid (FK clients)
- `company`: text
- `wage`: text
- `title`: text
- `placement_date`: date

### `follow_ups`

- `id`: uuid (PK)
- `client_id`: uuid (FK clients)
- `contact_date`: date
- `method`: text (phone, in-person)
- `performance`: text
- `notes`: text
- `created_at`: timestamptz
- `created_by`: uuid (FK profiles)

### `audit_logs`

- `id`: uuid (PK)
- `user_id`: uuid (FK profiles)
- `action`: text (CREATE, READ, UPDATE, DELETE)
- `entity_type`: text (client, intake, etc.)
- `entity_id`: uuid
- `details`: jsonb
- `created_at`: timestamptz
