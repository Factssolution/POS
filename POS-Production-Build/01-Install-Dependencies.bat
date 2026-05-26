@echo off
setlocal enabledelayedexpansion

echo.
echo ═══════════════════════════════════════════════════════════
echo    POS SYSTEM - DEPENDENCY INSTALLATION
echo ═══════════════════════════════════════════════════════════
echo.

REM Check if Node.js is installed
echo [1/4] Checking Node.js installation...
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

REM Check if npm is installed
echo [2/4] Checking npm installation...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed!
    echo Please install npm along with Node.js
    pause
    exit /b 1
)

npm --version
echo ✓ npm is installed
echo.

REM Install Backend Dependencies
echo [3/4] Installing Backend Dependencies...
echo Installing packages in src\backend...
cd src\backend

if exist package.json (
    echo Installing backend packages...
    call npm install --production
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install backend dependencies
        pause
        exit /b 1
    )
    echo ✓ Backend dependencies installed successfully
) else (
    echo ERROR: package.json not found in src\backend
    pause
    exit /b 1
)

cd ..\..
echo.

REM Install Frontend Dependencies
echo [4/4] Installing Frontend Dependencies...
echo Installing packages in root directory...

if exist package.json (
    echo Installing frontend packages...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
    echo ✓ Frontend dependencies installed successfully
) else (
    echo ERROR: package.json not found in root directory
    pause
    exit /b 1
)

echo.
echo ═══════════════════════════════════════════════════════════
echo    ✓ ALL DEPENDENCIES INSTALLED SUCCESSFULLY!
echo ═══════════════════════════════════════════════════════════
echo.
echo Next Steps:
echo 1. Run '02-Setup-Database.bat' to create database and schema
echo 2. Run '03-Start-Servers.bat' to start the application
echo.
pause
