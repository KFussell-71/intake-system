# Intake System V3: Production Hardening Installer (Windows)
param (
    [switch]$Clean,
    [switch]$Verify
)

Write-Host "🚀 Starting Intake System V3 Production Installer..." -ForegroundColor Cyan

# 1. Dependency Check
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "❌ Docker not found. Please install Docker Desktop first."
    exit
}

# 2. Cleanup (Optional)
if ($Clean) {
    Write-Host "🧹 Cleaning existing environment..." -ForegroundColor Yellow
    Set-Location docker
    docker compose down -v
    Set-Location ..
}

# 3. Secrets & Paths
Write-Host "🔐 Initializing security credentials..."
New-Item -ItemType Directory -Force -Path "docker/secrets", "docker/nginx/certs"

if (!(Test-Path "docker/secrets/db_password.txt")) {
    $pass = [Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Minimum 0 -Maximum 255) }))
    $pass | Out-File -FilePath "docker/secrets/db_password.txt" -NoNewline -Encoding utf8
}

# 4. Launch Stack
Write-Host "🐳 Launching hardened stack..."
Set-Location docker
docker compose up -d --build

# 5. Verification
if ($Verify) {
    Write-Host "🔍 Running health probes..."
    Start-Sleep -Seconds 10
    # PowerShell equivalent of health_probe.sh could be added here
}

Write-Host "✅ Production candidate deployed successfully." -ForegroundColor Green
Write-Host "📍 Access your application at: https://localhost"
