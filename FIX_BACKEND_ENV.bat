@echo off
title Setup Backend Environment Variables
color 0B

echo.
echo ================================================================================
echo              SETUP BACKEND ENVIRONMENT VARIABLES
echo ================================================================================
echo.
echo  The backend API is returning 500 errors because it's missing
echo  database connection environment variables on Vercel.
echo.
echo ================================================================================
echo.
echo  Required Environment Variables:
echo.
echo  [1] DATABASE_URL (Recommended - full connection string)
echo.
echo      Format: postgresql://user:password@host:5432/database
echo.
echo      Get from Supabase Dashboard:
echo        1. Go to: https://supabase.com/dashboard/project/hfusrtiqjyiotjewzzkt
echo        2. Click "Settings" > "Database"
echo        3. Copy "Transaction" pooler connection string
echo.
echo  [2] OR Individual Variables:
echo.
echo      DB_HOST=db.hfusrtiqjyiotjewzzkt.supabase.co
echo      DB_PORT=5432
echo      DB_NAME=postgres
echo      DB_USER=postgres.hfusrtiqjyiotjewzzkt
echo      DB_PASSWORD=your-password
echo.
echo ================================================================================
echo.
echo  Steps to Fix:
echo.
echo  1. Go to Vercel Dashboard:
echo     https://vercel.com/loopkarts-projects/pos/settings
echo.
echo  2. Click "Environment Variables"
echo.
echo  3. Add these variables:
echo.
echo     Name: DATABASE_URL
echo     Value: (paste your Supabase connection string)
echo     Environment: Production, Preview, Development
echo.
echo  4. Click "Save"
echo.
echo  5. Redeploy backend:
echo.
echo     cd src\backend
echo     vercel --prod
echo.
echo ================================================================================
echo.
set /p choice="Do you want to open Vercel settings now? (y/n): "
if /i "%choice%"=="y" (
    echo.
    echo Opening Vercel settings...
    start https://vercel.com/loopkarts-projects/pos/settings
    echo.
    echo Remember to also open Supabase to get the connection string:
    start https://supabase.com/dashboard/project/hfusrtiqjyiotjewzzkt/settings/database
)
echo.
echo ================================================================================
echo.
echo  After setting environment variables:
echo.
echo  1. Redeploy backend: cd src\backend && vercel --prod
echo  2. Test license endpoints again
echo  3. 500 errors should be gone!
echo.
echo ================================================================================
echo.
pause
