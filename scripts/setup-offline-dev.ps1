# Local Development Preparation Script
# This script sets up a local SQLite database for Prisma so you can generate types
# and continue development on your laptop even without NAS access.

Write-Host "Setting up local development environment..." -ForegroundColor Cyan

# 1. Create a local .env file if it doesn't exist
$envFile = "prisma/.env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "Creating local environment file: $envFile"
    'DATABASE_URL="file:./local.db"' | Out-File -FilePath $envFile -Encoding ascii
}

# 2. Update schema temporarily or ensure it supports SQLite?
# PRISMA NOTE: You'll need to change provider = "postgresql" to provider = "sqlite" 
# in prisma/schema.prisma if you want to run MIGRATIONS locally.
# If you just want to generate types, we can try to "stub" the URL.

Write-Host "`nTo generate types locally on your laptop:" -ForegroundColor Yellow
Write-Host "1. In prisma/schema.prisma, temporarily change the provider from 'postgresql' to 'sqlite'."
Write-Host "2. Run: npx prisma generate"
Write-Host "3. When ready for NAS, switch it back to 'postgresql'."

Write-Host "`nLocal environment is ready for offline development." -ForegroundColor Green
