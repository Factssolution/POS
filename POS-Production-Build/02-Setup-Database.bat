@echo off
setlocal enabledelayedexpansion

echo.
echo ═══════════════════════════════════════════════════════════
echo    POS SYSTEM - DATABASE SETUP
echo ═══════════════════════════════════════════════════════════
echo.

REM Check if PostgreSQL is installed
echo [1/3] Checking PostgreSQL installation...
where psql >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PostgreSQL is not installed or not in PATH!
    echo.
    echo Please install PostgreSQL 17+ from https://www.postgresql.org/download/
    echo Make sure to add PostgreSQL to your system PATH
    pause
    exit /b 1
)

psql --version
echo ✓ PostgreSQL is installed
echo.

REM Check if Node.js is installed
echo [2/3] Checking Node.js installation...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

node --version
echo ✓ Node.js is installed
echo.

REM Install required Node.js packages for setup
echo [3/3] Installing setup dependencies...
cd src\backend

if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo Checking for required packages...
    call npm list pg >nul 2>&1
    if %errorlevel% neq 0 (
        echo Installing missing packages...
        call npm install pg bcryptjs
    )
)

cd ..\..
echo ✓ Dependencies ready
echo.

REM Run database setup script
echo ═══════════════════════════════════════════════════════════
echo    RUNNING DATABASE SETUP...
echo ═══════════════════════════════════════════════════════════
echo.
echo This will:
echo  - Create 'pos' database
echo  - Setup complete schema with all tables
echo  - Create indexes and constraints
echo  - Initialize default settings
echo  - Create Super Admin and Admin users
echo.
echo PostgreSQL Password: Black@786##
echo.
pause

node "POS-Production-Build\setup-database.js"

if %errorlevel% neq 0 (
    echo.
    echo ═══════════════════════════════════════════════════════════
    echo    ❌ DATABASE SETUP FAILED
    echo ═══════════════════════════════════════════════════════════
    echo.
    echo Please check:
    echo 1. PostgreSQL is running
    echo 2. Password is correct (Black@786##)
    echo 3. You have admin privileges
    echo.
    pause
    exit /b 1
)

echo.
echo ═══════════════════════════════════════════════════════════
echo    ✓ DATABASE SETUP COMPLETED!
echo ═══════════════════════════════════════════════════════════
echo.
echo Next Step:
echo Run '03-Start-Servers.bat' to start the application
echo.
pause
