@echo off
REM Docker Deployment Script for POS System (Windows)
REM Professional-grade deployment with health checks and verification

echo ============================================================
echo   POS System - Docker Deployment
echo ============================================================
echo.

REM Check if Docker is installed
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
where docker-compose >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not installed.
    pause
    exit /b 1
)

echo [OK] Docker and Docker Compose are installed
echo.

REM Check if .env file exists
if not exist .env (
    echo [WARN] .env file not found. Creating from .env.docker...
    copy .env.docker .env
    echo [OK] Created .env file. Please review and update values if needed.
    echo.
)

REM Step 1: Stop existing containers
echo Step 1: Stopping existing containers...
docker-compose down --remove-orphans 2>nul
echo [OK] Existing containers stopped
echo.

REM Step 2: Pull latest images
echo Step 2: Pulling latest base images...
docker-compose pull 2>nul
echo [OK] Base images updated
echo.

REM Step 3: Build images
echo Step 3: Building Docker images...
docker-compose build --no-cache
if %errorlevel% neq 0 (
    echo [ERROR] Failed to build Docker images
    pause
    exit /b 1
)
echo [OK] Docker images built successfully
echo.

REM Step 4: Start containers
echo Step 4: Starting containers...
docker-compose up -d
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start containers
    pause
    exit /b 1
)
echo [OK] Containers started
echo.

REM Step 5: Wait for services
echo Step 5: Waiting for services to be ready...
echo   - Waiting for PostgreSQL...
timeout /t 10 /nobreak >nul

echo   - Waiting for Backend API...
set /a retries=0
:check_backend
timeout /t 2 /nobreak >nul
curl -s http://localhost:5000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend API is ready
    goto check_frontend
)
set /a retries+=1
if %retries% lss 30 goto check_backend
echo [ERROR] Backend API failed to start
docker-compose logs backend
pause
exit /b 1

:check_frontend
echo   - Waiting for Frontend...
set /a retries=0
:check_frontend_loop
timeout /t 2 /nobreak >nul
curl -s http://localhost:80 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Frontend is ready
    goto verify
)
set /a retries+=1
if %retries% lss 15 goto check_frontend_loop
echo [ERROR] Frontend failed to start
docker-compose logs frontend
pause
exit /b 1

REM Step 6: Verify deployment
:verify
echo.
echo Step 6: Verifying deployment...
echo.

REM Check Backend
curl -s -o nul -w "%%{http_code}" http://localhost:5000/health > %temp%\backend_status.txt
set /p backend_status=<%temp%\backend_status.txt
if "%backend_status%"=="200" (
    echo [OK] Backend API: Running (Port 5000)
) else (
    echo [ERROR] Backend API: Not responding (Status: %backend_status%)
)

REM Check Frontend
curl -s -o nul -w "%%{http_code}" http://localhost:80 > %temp%\frontend_status.txt
set /p frontend_status=<%temp%\frontend_status.txt
if "%frontend_status%"=="200" (
    echo [OK] Frontend: Running (Port 80)
) else (
    echo [ERROR] Frontend: Not responding (Status: %frontend_status%)
)

REM Step 7: Display access information
echo.
echo ============================================================
echo   ^✓ DEPLOYMENT COMPLETE!
echo ============================================================
echo.
echo   Frontend:  http://localhost
echo   Backend:   http://localhost:5000
echo   API Docs:  http://localhost:5000/api/v1
echo   Health:    http://localhost:5000/health
echo.
echo   Default Credentials:
echo     Super Admin: factssolution@gmail.com
echo     Password:    Black@786##
echo.
echo ============================================================
echo   Useful Commands:
echo ============================================================
echo.
echo   View logs:          docker-compose logs -f
echo   View backend logs:  docker-compose logs -f backend
echo   Stop services:      docker-compose down
echo   Restart services:   docker-compose restart
echo   Rebuild:            docker-compose up -d --build
echo   Database shell:     docker-compose exec postgres psql -U postgres
echo.
echo ============================================================
echo.
pause
