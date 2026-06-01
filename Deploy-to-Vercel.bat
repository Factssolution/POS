@echo off
REM ═══════════════════════════════════════════════════════════
REM POS System - Automated Vercel + Supabase Deployment
REM ═══════════════════════════════════════════════════════════

echo ============================================================
echo   POS System - Production Deployment (Vercel + Supabase)
echo ============================================================
echo.

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARN] Vercel CLI is not installed. Installing...
    npm install -g vercel
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install Vercel CLI
        echo   Please run: npm install -g vercel
        pause
        exit /b 1
    )
)

echo [OK] Vercel CLI is installed
echo.

REM Step 1: Database Schema Check
echo ============================================================
echo   STEP 1: Supabase Database Setup
echo ============================================================
echo.
echo IMPORTANT: Before proceeding, you must run the database migration:
echo   1. Go to: https://supabase.com/dashboard
echo   2. Open SQL Editor for your project
echo   3. Run: supabase-multi-tenant-schema.sql
echo.
set /p db_migrated="Have you executed the database migration? (y/n): "
if /i not "%db_migrated%"=="y" (
    echo.
    echo [ACTION REQUIRED] Please run the database migration first.
    echo   File: supabase-multi-tenant-schema.sql
    echo.
    pause
    exit /b 1
)
echo [OK] Database migration confirmed
echo.

REM Step 2: Check Backend Files
echo ============================================================
echo   STEP 2: Verifying Backend Files
echo ============================================================
echo.

if not exist "src\backend\server.js" (
    echo [ERROR] server.js not found
    pause
    exit /b 1
)
echo [OK] server.js found

if not exist "src\backend\api\index.js" (
    echo [ERROR] api/index.js not found
    pause
    exit /b 1
)
echo [OK] api/index.js found

if not exist "src\backend\vercel.json" (
    echo [ERROR] vercel.json not found
    pause
    exit /b 1
)
echo [OK] vercel.json found

if not exist "src\backend\package.json" (
    echo [ERROR] package.json not found
    pause
    exit /b 1
)
echo [OK] package.json found

echo.
echo [OK] All backend files verified
echo.

REM Step 3: Deploy Backend
echo ============================================================
echo   STEP 3: Deploy Backend API to Vercel
echo ============================================================
echo.
echo This will deploy the backend API to Vercel.
echo Make sure you are logged in to Vercel CLI.
echo.
set /p deploy_backend="Deploy backend now? (y/n): "
if /i "%deploy_backend%"=="y" (
    echo.
    echo Deploying backend...
    cd src\backend
    vercel --prod --confirm
    if %errorlevel% neq 0 (
        echo [ERROR] Backend deployment failed
        cd ..\..
        pause
        exit /b 1
    )
    echo [OK] Backend deployed successfully
    cd ..\..
) else (
    echo Skipping backend deployment
)
echo.

REM Step 4: Get Backend URL
echo ============================================================
echo   STEP 4: Backend URL Configuration
echo ============================================================
echo.
echo Please enter your deployed backend URL:
echo (Example: https://pos-backend-api.vercel.app)
echo.
set /p backend_url="Backend URL: "
if "%backend_url%"=="" (
    echo [WARN] No backend URL provided. Using existing configuration.
) else (
    echo [OK] Backend URL saved: %backend_url%
)
echo.

REM Step 5: Deploy Frontend
echo ============================================================
echo   STEP 5: Deploy Frontend to Vercel
echo ============================================================
echo.
echo This will deploy the frontend to Vercel.
echo.
set /p deploy_frontend="Deploy frontend now? (y/n): "
if /i "%deploy_frontend%"=="y" (
    echo.
    echo Deploying frontend...
    vercel --prod --confirm
    if %errorlevel% neq 0 (
        echo [ERROR] Frontend deployment failed
        pause
        exit /b 1
    )
    echo [OK] Frontend deployed successfully
) else (
    echo Skipping frontend deployment
)
echo.

REM Step 6: Configuration Summary
echo ============================================================
echo   DEPLOYMENT COMPLETE
echo ============================================================
echo.
echo Your POS System is now deployed!
echo.
echo Backend API:  %backend_url%
echo Frontend:     https://your-frontend.vercel.app
echo Database:     Supabase (Production)
echo.
echo Next Steps:
echo   1. Configure CORS in Vercel backend settings
echo      Set CORS_ORIGIN to your frontend URL
echo.
echo   2. Test the deployment
echo      Open: https://your-frontend.vercel.app
echo      Login: factssolution@gmail.com / Black@786##
echo.
echo   3. Verify database connection
echo      Check backend logs for connection status
echo.
echo   4. Monitor deployment
echo      Vercel Dashboard: https://vercel.com/dashboard
echo      Supabase Dashboard: https://supabase.com/dashboard
echo.
echo ============================================================
echo.
pause
