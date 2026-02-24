#!/bin/bash
set -e

# ==============================================================================
# INTAKE SYSTEM: MIGRATION APPLIER
# ==============================================================================
# This script is a wrapper around the Supabase CLI to ensure consistent application
# of database schemas. It replaces the old legacy SQL runner.

echo "🔄 INTAKE SYSTEM: DATABASE UPDATE"
echo "----------------------------------"

# 1. Check for .env.local
if [ -f .env.local ]; then
    echo "📄 Loading environment from .env.local..."
    export $(grep -v '^#' .env.local | xargs)
else
    echo "⚠️  Warning: .env.local not found. Relying on system environment variables."
fi

# 2. Run Supabase Push
echo "🚀 Applying migrations via Supabase CLI..."
# We pipe 'y' to auto-confirm if interactive, but 'db push' is usually non-interactive in CI
# unless there are conflicts.
npx supabase db push

echo ""
echo "✅ Database is up to date."
