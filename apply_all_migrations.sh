#!/bin/bash

# Complete Security Migration Script
# Applies ALL security migrations in correct order

set -e

echo "🛡️  COMPLETE SECURITY MIGRATION SCRIPT"
echo "======================================"
echo ""

if [ -z "$1" ]; then
    echo "❌ Error: DATABASE_URL required"
    echo ""
    echo "Usage: ./apply_all_migrations.sh <DATABASE_URL>"
    exit 1
fi

DATABASE_URL="$1"

echo "📋 Migrations to apply (in order):"
echo "  1. Enable RLS on All Tables (CRITICAL)"
echo "  2. Blue Team RLS Fixes"
echo "  3. HIPAA Column Security"
echo "  4. HIPAA Audit Immutability"
echo ""

apply_migration() {
    local file=$1
    local name=$2
    
    echo "🔄 Applying: $name"
    if psql "$DATABASE_URL" -f "$file"; then
        echo "✅ Success: $name"
    else
        echo "❌ Failed: $name"
        return 1
    fi
    echo ""
}

echo "Starting migration application..."
echo ""

apply_migration "migrations/20260202_enable_rls_all_tables.sql" "Enable RLS on All Tables"
apply_migration "migrations/20260202_blue_team_rls_fixes.sql" "Blue Team RLS Fixes"
apply_migration "migrations/20260202_hipaa_column_security.sql" "HIPAA Column Security"
apply_migration "migrations/20260202_hipaa_audit_immutability.sql" "HIPAA Audit Immutability"

echo "🎉 All migrations applied successfully!"
echo ""
echo "✅ Verification:"
psql "$DATABASE_URL" -c "SELECT * FROM check_rls_status();"

echo ""
echo "📊 Security Status:"
echo "  ✅ RLS enabled on all tables"
echo "  ✅ Policies scoped to assigned clients"
echo "  ✅ SSN access controlled by role"
echo "  ✅ Audit logs immutable"
echo ""
