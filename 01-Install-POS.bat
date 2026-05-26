@echo off
REM =====================================================
REM POS Business Dashboard - One-Click Installer
REM =====================================================
REM Double-click this file to install automatically
REM =====================================================

echo ============================================
echo   POS Business Dashboard - Installer
echo ============================================
echo.
echo AUTOMATED INSTALLATION
echo This will install everything automatically!
echo.
echo PREREQUISITES (Install these first):
echo   1. Node.js - https://nodejs.org/ (LTS version)
echo   2. PostgreSQL - https://www.postgresql.org/download/windows/
echo.
echo DEFAULT DATABASE SETTINGS:
echo   Database: pos_system
echo   Username: postgres
echo   Password: postgres (PostgreSQL default)
echo.
echo If you set a different PostgreSQL password,
echo you can change it later in: src\backend\.env
echo.
echo ============================================
echo.
echo Starting installation in 3 seconds...
timeout /t 3 /nobreak >nul
echo.

REM Run PowerShell script with execution policy bypass
powershell -ExecutionPolicy Bypass -File "%~dp0Install-POS.ps1"

echo.
echo ============================================
echo   Installation Complete!
echo ============================================
echo.
echo NEXT STEP:
echo Double-click "Start-POS.bat" to launch the system
echo.
echo Default Login:
echo   Username: admin
echo   Password: admin123
echo.
pause
