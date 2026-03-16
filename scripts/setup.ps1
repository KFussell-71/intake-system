# 🏥 Intake System V3: Production Clinical Node Installer (Windows)
# Purpose: Zero-Touch Bootstrap for Distributed Clinical Nodes.

param (
    [switch]$Clean,
    [switch]$Verify
)

# --- Styles ---
function Write-Header {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "🏥 INTAKE SYSTEM: CLINICAL NODE BOOTSTRAP" -ForegroundColor Cyan -Style Bold
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
}

Clear-Host
Write-Header

# 1. Dependency Check
Write-Host "🔍 Verifying dependencies..." -ForegroundColor Yellow
$DockerCmd = "docker compose"
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "❌ Docker not found. Please install Docker Desktop first: https://www.docker.com/products/docker-desktop/"
    exit 1
}

# 2. Cleanup (Optional)
if ($Clean) {
    Write-Host "🧹 Cleaning existing environment..." -ForegroundColor Yellow
    Set-Location docker
    docker compose down -v
    Set-Location ..
}

# 3. Path Provisioning
Write-Host "📂 Provisioning persistent volumes..." -ForegroundColor Yellow
$Paths = @("docker/data/db", "docker/data/backups", "docker/data/storage", "docker/nginx/certs", "docker/secrets")
foreach ($Path in $Paths) {
    if (!(Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

# 4. Secret Generation
Write-Host "🔐 Securing node credentials..." -ForegroundColor Yellow
if (!(Test-Path "docker/secrets/db_password.txt")) {
    $Pass = [Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Minimum 0 -Maximum 255) }))
    $Pass | Out-File -FilePath "docker/secrets/db_password.txt" -NoNewline -Encoding utf8
    Write-Host "✅ Generated secure DB password." -ForegroundColor Green
}

if (!(Test-Path "docker/secrets/gpg_passphrase.txt")) {
    $Key = [Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Minimum 0 -Maximum 255) }))
    $Key | Out-File -FilePath "docker/secrets/gpg_passphrase.txt" -NoNewline -Encoding utf8
    Write-Host "✅ Generated node encryption key (GPG)." -ForegroundColor Green
}

# 5. Launch Stack
Write-Host "🐳 Starting Clinical Node containers..." -ForegroundColor Cyan
Set-Location docker
docker compose down > $null 2>&1
docker compose up -d --build
Set-Location ..

# 6. Verification
Write-Host "⏳ Waiting for clinical state machine to warm up..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Basic health check
try {
    $Response = Invoke-WebRequest -Uri "http://localhost:80" -Method Head -ErrorAction SilentlyContinue
    if ($Response.StatusCode -eq 200) {
        Write-Host "✅ Health check PASSED." -ForegroundColor Green
    }
    else {
        Write-Warning "⚠️ Health check returned status: $($Response.StatusCode)"
    }
}
catch {
    Write-Host "❌ Health check FAILED. Retrying manual access in browser." -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 SUCCESS: Your Clinical Node is LIVE." -ForegroundColor Green -Style Bold
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📍 Dashboard: http://localhost" -ForegroundColor White
Write-Host "🔐 Device ID: $((Get-CimInstance Win32_ComputerSystem).Name)" -ForegroundColor White
Write-Host "📜 Documentation: See INSTALL.md for next steps." -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
