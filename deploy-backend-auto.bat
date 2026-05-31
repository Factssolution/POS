@echo off
echo ========================================================
echo   POS Backend - Auto Deploy with Alias Sync
echo ========================================================
echo.

cd /d "%~dp0src\backend"

echo [1/3] Deploying to Vercel...
vercel --prod
if errorlevel 1 (
    echo.
    echo ERROR: Deployment failed!
    pause
    exit /b 1
)

echo.
echo [2/3] Getting latest deployment URL...
for /f "tokens=*" %%i in ('vercel ls --limit 1 --json') do set DEPLOY_OUTPUT=%%i

echo.
echo [3/3] Syncing alias to latest deployment...
vercel alias set pos-api-zayqa.vercel.app pos-api-zayqa.vercel.app

echo.
echo ========================================================
echo   DEPLOYMENT COMPLETE!
echo ========================================================
echo.
echo Backend URL: https://pos-api-zayqa.vercel.app
echo Health Check: https://pos-api-zayqa.vercel.app/health
echo.

pause
