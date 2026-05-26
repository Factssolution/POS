@echo off
REM ============================================
REM POS System - PostgreSQL Backup Script
REM Professional Backup with Native Format
REM ============================================

SETLOCAL EnableDelayedExpansion

REM Database Configuration
SET PG_HOST=localhost
SET PG_PORT=5432
SET PG_DATABASE=pos
SET PG_USER=postgres
SET PG_PASSWORD=postgres123

REM PostgreSQL Binary Path
SET PG_BIN=C:\Program Files\PostgreSQL\17\bin

REM Backup Directory
SET BACKUP_DIR=D:\POS Business Dashboard ZAYQA\src\backups

REM Generate Timestamp
FOR /F "tokens=2 delims==" %%a IN ('wmic OS Get localdatetime /value') DO SET "DT=%%a"
SET "YEAR=%DT:~0,4%"
SET "MONTH=%DT:~4,2%"
SET "DAY=%DT:~6,2%"
SET "HOUR=%DT:~8,2%"
SET "MIN=%DT:~10,2%"
SET "SEC=%DT:~12,2%"
SET "TIMESTAMP=%YEAR%-%MONTH%-%DAY%T%HOUR%-%MIN%-%SEC%"

REM Backup Filename
SET BACKUP_FILE=%BACKUP_DIR%\pos_backup_%TIMESTAMP%.backup

REM ============================================
REM Create Backup
REM ============================================
echo.
echo ============================================
echo POS System - PostgreSQL Backup
echo ============================================
echo.
echo Starting backup at %DATE% %TIME%
echo Database: %PG_DATABASE%
echo Output: %BACKUP_FILE%
echo.

REM Ensure backup directory exists
IF NOT EXIST "%BACKUP_DIR%" (
    echo Creating backup directory...
    mkdir "%BACKUP_DIR%"
)

REM Set PGPASSWORD for non-interactive authentication
SET PGPASSWORD=%PG_PASSWORD%

REM Run pg_dump with native custom format
echo Running pg_dump...
"%PG_BIN%\pg_dump.exe" ^
    -h %PG_HOST% ^
    -p %PG_PORT% ^
    -U %PG_USER% ^
    -d %PG_DATABASE% ^
    -F c ^
    -v ^
    -f "%BACKUP_FILE%" 2>"%BACKUP_DIR%\backup_error.log"

REM Check if backup was successful
IF %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo BACKUP SUCCESSFUL
    echo ============================================
    echo.
    
    echo File: pos_backup_%TIMESTAMP%.backup
    
    echo.
    echo Backup completed successfully!
    echo File: %BACKUP_FILE%
    echo.
    
    REM Output JSON response for Node.js (size will be calculated by Node.js)
    REM Escape backslashes for JSON
    SET JSON_PATH=%BACKUP_FILE:\=\\%
    echo {"success": true, "filename": "pos_backup_%TIMESTAMP%.backup", "filepath": "%JSON_PATH%", "method": "batch_file"}
    
    EXIT /B 0
) ELSE (
    echo.
    echo ============================================
    echo BACKUP FAILED
    echo ============================================
    echo.
    echo Error Level: %ERRORLEVEL%
    echo.
    echo Error Details:
    type "%BACKUP_DIR%\backup_error.log"
    echo.
    
    REM Output JSON error response
    echo {"success": false, "error": "pg_dump failed with exit code %ERRORLEVEL%"}
    
    EXIT /B 1
)
