@echo off
REM =====================================================
REM POS Business Dashboard - Quick Installer
REM =====================================================
REM Double-click this file to start automated installation
REM =====================================================

echo ============================================
echo   POS Business Dashboard - Installer
echo ============================================
echo.
echo This will install and configure the POS system
echo Prerequisites required:
echo   - Node.js (LTS version)
echo   - PostgreSQL 14+
echo.
echo If you haven't installed these, please:
echo   1. Download Node.js from https://nodejs.org/
echo   2. Download PostgreSQL from https://www.postgresql.org/download/windows/
echo   3. Re-run this installer
echo.
pause

echo.
echo Starting installation...
echo.

REM Run PowerShell script with execution policy bypass
powershell -ExecutionPolicy Bypass -File "%~dp0Install-POS.ps1"

echo.
echo ============================================
echo   Installation Process Complete
echo ============================================
echo.
pause
