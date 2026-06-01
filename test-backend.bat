@echo off
REM Test Backend Deployment
echo ============================================================
echo   Testing Backend Deployment
echo ============================================================
echo.

set BACKEND_URL=https://backend-three-alpha-44.vercel.app

echo Testing: %BACKEND_URL%
echo.

echo Test 1: Health Check...
curl -s %BACKEND_URL%/health
echo.
echo.

echo Test 2: API Version...
curl -s %BACKEND_URL%/api/v1
echo.
echo.

echo ============================================================
echo   If you see JSON responses, backend is working!
echo ============================================================
echo.
pause
