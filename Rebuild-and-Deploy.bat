@echo off
title Rebuild and Redeploy POS with Fixes
color 0B

echo.
echo ============================================
echo   Rebuild and Redeploy POS System
echo ============================================
echo.
echo This will:
echo  1. Build the frontend with the fixes
echo  2. Guide you to deploy to Vercel
echo  3. Remind you to fix Supabase permissions
echo.
echo ============================================
echo.

echo [1/3] Building frontend...
echo.
call npm run build

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Build Complete!
echo ============================================
echo.
echo Next steps:
echo.
echo [1] Fix Supabase Permissions (REQUIRED)
echo.
echo     Go to: https://supabase.com/dashboard/project/hfusrtiqjyiotjewzzkt
echo     Click "SQL Editor"
echo     Run this SQL:
echo.
echo     GRANT SELECT ON public.licenses TO anon;
echo     GRANT SELECT ON public.licenses TO authenticated;
echo     GRANT SELECT ON public.settings TO anon;
echo.
echo [2] Deploy to Vercel
echo.
echo     Run: vercel --prod
echo     Or push to git and let Vercel auto-deploy
echo.
echo [3] Test the application
echo.
echo     Login as Super Admin and check console for errors
echo.
echo ============================================
echo.

set /p choice="Do you want to deploy to Vercel now? (y/n): "
if /i "%choice%"=="y" (
    echo.
    echo Deploying to Vercel...
    call vercel --prod
    if %errorlevel% neq 0 (
        echo.
        echo ERROR: Vercel deployment failed!
        echo Make sure you have Vercel CLI installed: npm i -g vercel
        pause
    )
) else (
    echo.
    echo Deployment skipped. Deploy manually when ready.
)

echo.
echo ============================================
echo   Don't Forget!
echo ============================================
echo.
echo Run the Supabase permission fix SQL or
echo double-click: Fix-Supabase-Permissions.bat
echo.
echo ============================================
echo.
pause
