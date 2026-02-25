@echo off
:: 🏥 Intake System: Windows One-Click Bootstrap
:: Purpose: Launches the PowerShell installer with elevated bypass permissions.

setlocal
cd /d %~dp0

echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🏥 INTAKE SYSTEM: CLINICAL NODE BOOTSTRAP (Windows)
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

:: Check for PowerShell
where powershell >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] PowerShell not found. Please install Windows Management Framework.
    pause
    exit /b 1
)

:: Execute the setup script
powershell -ExecutionPolicy Bypass -File "scripts\setup.ps1"

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Installation failed. Please check the logs above.
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Operation complete.
pause
