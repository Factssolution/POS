@echo off
setlocal enabledelayedexpansion

echo.
echo ================================================================
echo    POS SYSTEM - DROP AND RECREATE DATABASE
echo ================================================================
echo.
echo WARNING: This will DELETE the existing 'pos' database
echo and create a fresh one with complete schema!
echo.
echo ALL DATA WILL BE LOST!
echo.
echo ================================================================
echo.
pause

set PGPASSWORD=Black@786##

echo.
echo [1/4] Dropping existing database...
echo.

psql -U postgres -c "DROP DATABASE IF EXISTS pos;"

if %errorlevel% neq 0 (
    echo ERROR: Failed to drop database!
    pause
    exit /b 1
)

echo ✓ Database dropped
echo.

echo [2/4] Creating fresh database...
echo.

psql -U postgres -c "CREATE DATABASE pos;"

if %errorlevel% neq 0 (
    echo ERROR: Failed to create database!
    pause
    exit /b 1
)

echo ✓ Database created
echo.

echo [3/4] Setting up complete schema...
echo.

psql -U postgres -d pos -f "database-schema.sql"

if %errorlevel% neq 0 (
    echo ERROR: Schema setup failed!
    pause
    exit /b 1
)

echo ✓ Schema setup complete
echo.

echo [4/4] Setting up default users...
echo.

REM Run the Node.js setup script for users
node "setup-database.js"

echo.
echo ================================================================
echo    ✓ DATABASE RECREATED SUCCESSFULLY!
echo ================================================================
echo.
echo Fresh database created with:
echo   - Complete schema (12 tables)
echo   - Default settings
echo   - Default users
echo.
echo Login Credentials:
echo   Super Admin: factsolution@gmail.com / Black@786##
echo   Admin: admin@factssolution.com / Test@123
echo.
pause
