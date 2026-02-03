#!/bin/bash

# Apply Safe RLS Migration via psql
# This script applies the RLS migration to your Supabase database

set -e

echo "🛡️  Applying Safe RLS Migration to Supabase"
echo "============================================"
echo ""

# Extract project ref from .env.local
PROJECT_REF="cbbucdlchhuowilwvgyj"

echo "📋 Project: $PROJECT_REF"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set"
    echo ""
    echo "Please set your DATABASE_URL environment variable:"
    echo "export DATABASE_URL='postgresql://postgres:[PASSWORD]@db.$PROJECT_REF.supabase.co:5432/postgres'"
    echo ""
    echo "Get your password from:"
    echo "1. Supabase Dashboard → Settings → Database"
    echo "2. Look for 'Database password' or reset it"
    echo ""
    exit 1
fi

echo "✅ DATABASE_URL found"
echo ""

# Apply the safe migration
echo "🔄 Applying safe RLS migration..."
echo ""

if psql "$DATABASE_URL" -f migrations/20260202_safe_rls_migration.sql; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "📊 Verifying RLS status..."
    psql "$DATABASE_URL" -c "SELECT tablename, rowsecurity as rls_enabled FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%' ORDER BY tablename;"
else
    echo ""
    echo "❌ Migration failed"
    echo "Check the error message above"
    exit 1
fi

echo ""
echo "🎉 Done! Check your Supabase Security Advisor to see the reduced warnings."
echo ""
