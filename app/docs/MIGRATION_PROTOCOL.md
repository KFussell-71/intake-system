# 🛑 Database Migration Protocol

## ⚠️ MANDATORY INSTRUCTION FOR AI AGENT

**TRIGGER:** Whenever the user mentions "migrations", "database update", "schema change", or "SQL fix".

**ACTION:** You MUST use the Supabase CLI to apply changes. Do not ask the user to run SQL manually.

### 1. Preferred Command (Zero-Friction)

Use this command to push local schema changes to the remote database:

```bash
npx supabase db push
```

### 2. Alternative Command (Migration Files)

If specifically asked to run up/down migrations:

```bash
npx supabase migration up
```

### 3. Verification

After running the command, always verify the output to ensure the migration was successful.

---
**Why?**
Using the CLI ensures:

- **Idempotency:** Supabase tracks which migrations have run in the `supabase_migrations` table.
- **Safety:** It prevents re-running the same SQL twice (which causes errors like "relation already exists").
- **Consistency:** It keeps the local schema definitions in `supabase/migrations` as the source of truth.
