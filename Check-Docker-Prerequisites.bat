@echo off
REM Docker Prerequisites Checker for POS System
echo ============================================================
echo   POS System - Docker Prerequisites Check
echo ============================================================
echo.

REM Check Docker
echo Checking Docker...
where docker >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Docker is installed
    docker --version
    echo.
    
    REM Check if Docker is running
    docker info >nul 2>nul
    if %errorlevel% equ 0 (
        echo [OK] Docker is running
    ) else (
        echo [ERROR] Docker is installed but NOT running
        echo   Please start Docker Desktop
        echo.
    )
) else (
    echo [ERROR] Docker is NOT installed
    echo.
    echo   To install Docker Desktop for Windows:
    echo   1. Visit: https://www.docker.com/products/docker-desktop
    echo   2. Download Docker Desktop for Windows
    echo   3. Run the installer
    echo   4. Enable WSL2 backend during installation
    echo   5. Restart your computer
    echo   6. Start Docker Desktop
    echo.
)

echo.
echo Checking Docker Compose...
where docker-compose >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Docker Compose is installed
    docker-compose --version
) else (
    echo [ERROR] Docker Compose is NOT installed
    echo   Note: Docker Compose is included with Docker Desktop
)

echo.
echo Checking Ports...
echo.

REM Check port 80
netstat -ano | findstr ":80 " | findstr "LISTENING" >nul 2>nul
if %errorlevel% equ 0 (
    echo [WARN] Port 80 is already in use (needed for Frontend)
    echo   You may need to stop IIS or other web services
) else (
    echo [OK] Port 80 is available
)

REM Check port 5000
netstat -ano | findstr ":5000 " | findstr "LISTENING" >nul 2>nul
if %errorlevel% equ 0 (
    echo [WARN] Port 5000 is already in use (needed for Backend)
    echo   Please stop any service using port 5000
) else (
    echo [OK] Port 5000 is available
)

REM Check port 5432
netstat -ano | findstr ":5432 " | findstr "LISTENING" >nul 2>nul
if %errorlevel% equ 0 (
    echo [WARN] Port 5432 is already in use (needed for PostgreSQL)
    echo   Please stop local PostgreSQL if running
) else (
    echo [OK] Port 5432 is available
)

echo.
echo Checking Disk Space...
for /f "tokens=3" %%a in ('dir ^| find "bytes free"') do set freespace=%%a
echo [INFO] Free disk space: %freespace% bytes
echo   Recommended: At least 5 GB free

echo.
echo ============================================================
echo   Summary
echo ============================================================
echo.
echo   If all checks show [OK], you can run:
echo     Deploy-Docker.bat
echo.
echo   If you see [ERROR] or [WARN], fix the issues first.
echo.
echo ============================================================
echo.
pause
