@echo off
setlocal enabledelayedexpansion

echo.
echo ================================================================
echo    POS SYSTEM - MANUAL DATABASE SCHEMA UPDATE
echo ================================================================
echo.
echo This will update the PostgreSQL database schema
echo using the SQL file from the build folder.
echo.
echo Database: pos
echo Password: Black@786##
echo.
echo ================================================================
echo.
pause

echo.
echo [1/3] Checking PostgreSQL connection...
echo.

set PGPASSWORD=Black@786##

REM Check if database exists
psql -U postgres -lqt | findstr /i "pos" >nul
if %errorlevel% neq 0 (
    echo ERROR: Database 'pos' does not exist!
    echo Please run '02-Setup-Database.bat' first to create the database.
    pause
    exit /b 1
)

echo ✓ Database 'pos' found
echo.

echo [2/3] Updating database schema...
echo.
echo Executing: database-schema.sql
echo.

REM Execute SQL schema file
psql -U postgres -d pos -f "database-schema.sql"

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Schema update failed!
    echo Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo ✓ Schema updated successfully
echo.

echo [3/3] Verifying database...
echo.

REM Verify tables
psql -U postgres -d pos -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"

echo.
echo ================================================================
echo    ✓ DATABASE SCHEMA UPDATE COMPLETED!
echo ================================================================
echo.
echo To verify:
echo   1. Open pgAdmin or psql
echo   2. Connect to 'pos' database
echo   3. Check tables are created
echo.
pause
