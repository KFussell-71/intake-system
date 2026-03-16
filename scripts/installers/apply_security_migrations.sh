#!/bin/bash

# Security Migration Application Script
# Applies Blue Team and HIPAA compliance migrations

set -e  # Exit on error

echo "🛡️  Security Migration Application Script"
echo "=========================================="
echo ""

# Check if DATABASE_URL is provided
if [ -z "$1" ]; then
    echo "❌ Error: DATABASE_URL required"
    echo ""
    echo "Usage: ./apply_security_migrations.sh <DATABASE_URL>"
    echo ""
    echo "Get your DATABASE_URL from:"
    echo "1. Supabase Dashboard → Settings → Database"
    echo "2. Look for 'Connection string' under 'Connection pooling'"
    echo "3. Use the 'Transaction' mode connection string"
    echo ""
    echo "Example:"
    echo "./apply_security_migrations.sh 'postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres'"
    exit 1
fi

DATABASE_URL="$1"

echo "📋 Migrations to apply:"
echo "  1. Blue Team RLS Fixes"
echo "  2. HIPAA Column Security"
echo "  3. HIPAA Audit Immutability"
echo ""

# Function to apply migration
apply_migration() {
    local file=$1
    local name=$2
    
    echo "🔄 Applying: $name"
    if psql "$DATABASE_URL" -f "$file" > /dev/null 2>&1; then
        echo "✅ Success: $name"
    else
        echo "❌ Failed: $name"
        echo "   Trying with verbose output..."
        psql "$DATABASE_URL" -f "$file"
        return 1
    fi
}

# Apply migrations in order
echo "Starting migration application..."
echo ""

apply_migration "migrations/20260202_blue_team_rls_fixes.sql" "Blue Team RLS Fixes"
apply_migration "migrations/20260202_hipaa_column_security.sql" "HIPAA Column Security"
apply_migration "migrations/20260202_hipaa_audit_immutability.sql" "HIPAA Audit Immutability"

echo ""
echo "🎉 All migrations applied successfully!"
echo ""
echo "✅ Verification:"
psql "$DATABASE_URL" -c "SELECT * FROM verify_audit_log_integrity();" 2>/dev/null || echo "⚠️  Audit log verification function not yet available (will be after migration)"

echo ""
echo "📊 Next steps:"
echo "  1. Test SSN access controls"
echo "  2. Verify audit log immutability"
echo "  3. Check application logs for PHI redaction"
echo ""
