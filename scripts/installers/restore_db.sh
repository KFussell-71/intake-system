#!/usr/bin/env bash
set -Eeuo pipefail

echo "🔄 Finalizing Supabase Database Restoration..."

PROJECT_DIR="/home/kfussell/Documents/Intake"

if [ ! -d "$PROJECT_DIR" ]; then
  echo "❌ Project directory not found: $PROJECT_DIR"
  exit 1
fi

cd "$PROJECT_DIR"

if [ ! -f "supabase/config.toml" ]; then
  echo "❌ Not a Supabase project"
  exit 1
fi

# Resource Optimization: Ensure dependencies are ready but don't force install if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies"
  npm install
fi

# Ensure Supabase is started (if it was stopped)
if ! ./node_modules/.bin/supabase status > /dev/null 2>&1; then
  echo "🚀 Starting Supabase..."
  ./node_modules/.bin/supabase start
fi

echo "🧨 Resetting database"
npx supabase db reset --debug

echo "🔍 Verifying critical RPCs"
npx supabase db query <<EOF
select proname
from pg_proc
where proname in (
  'save_intake_progress_atomic',
  'upsert_intake_assessment_atomic',
  'save_intake_draft',
  'get_latest_user_draft'
);
EOF

echo "✅ Database reset and verification complete"
