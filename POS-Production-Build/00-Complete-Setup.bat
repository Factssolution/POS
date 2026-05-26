@echo off
setlocal enabledelayedexpansion

echo.
echo ================================================================
echo    POS SYSTEM - COMPLETE DEPLOYMENT
echo ================================================================
echo.
echo This script will:
echo   1. Install all dependencies
echo   2. Setup PostgreSQL database
echo   3. Start both servers
echo.
echo Requirements:
echo   - Node.js v18+
echo   - PostgreSQL v17+
echo.
echo Database Configuration:
echo   - Database Name: pos
echo   - Database Password: Black@786##
echo.
echo ================================================================
echo.
pause

echo.
echo ================================================================
echo    STEP 1: INSTALLING DEPENDENCIES
echo ================================================================
echo.

call "01-Install-Dependencies.bat"

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Dependency installation failed!
    echo Please fix the issue and try again.
    pause
    exit /b 1
)

echo.
echo ================================================================
echo    STEP 2: SETTING UP DATABASE
echo ================================================================
echo.

call "02-Setup-Database.bat"

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Database setup failed!
    echo Please fix the issue and try again.
    pause
    exit /b 1
)

echo.
echo ================================================================
echo    STEP 3: STARTING SERVERS
echo ================================================================
echo.

call "03-Start-Servers.bat"

echo.
echo ================================================================
echo    DEPLOYMENT COMPLETE!
echo ================================================================
echo.
echo Your POS System is now running!
echo.
echo Open browser: http://localhost:5173
echo.
echo Login Credentials:
echo   Super Admin: factsolution@gmail.com / Black@786##
echo   Admin: admin@factssolution.com / Test@123
echo.
echo ================================================================
echo.
pause
