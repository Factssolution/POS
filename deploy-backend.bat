@echo off
REM Deploy Backend API to Vercel
echo ============================================================
echo   Deploying Backend API to Vercel
echo ============================================================
echo.

cd src\backend

echo Current directory: %CD%
echo.

echo Deploying...
vercel --prod --name pos-backend-api

if %errorlevel% equ 0 (
    echo.
    echo ============================================================
    echo   ✅ Backend Deployed Successfully!
    echo ============================================================
    echo.
    echo Next Steps:
    echo   1. Add environment variables in Vercel Dashboard
    echo   2. Update CORS_ORIGIN with your frontend URL
    echo   3. Test the backend
    echo.
) else (
    echo.
    echo ============================================================
    echo   ❌ Deployment Failed
    echo ============================================================
    echo.
    echo Please check the error message above.
    echo.
)

cd ..\..
pause
