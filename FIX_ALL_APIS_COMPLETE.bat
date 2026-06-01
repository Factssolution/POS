@echo off
title Fix ALL Backend APIs - Complete Setup
color 0C
mode con: cols=100 lines=50

echo.
echo ========================================================================================================
echo                        FIX ALL BACKEND APIs ON VERCEL
echo ========================================================================================================
echo.
echo  Problem: All APIs returning 500 on Vercel (backend can't connect to Supabase)
echo  Solution: Set environment variables in Vercel Dashboard
echo.
echo ========================================================================================================
echo.
echo  STEP 1: Get Supabase Service Role Key
echo.
echo  1. Opening Supabase API settings...
start https://supabase.com/dashboard/project/hfusrtiqjyiotjewzzkt/settings/api
echo.
echo  2. Find "service_role" key (NOT anon key!)
echo     - It's longer than anon key
echo     - Starts with "eyJ..."
echo     - Marked as "secret"
echo.
echo  3. Copy the service_role key
echo.
pause
echo.
echo  STEP 2: Get Database Connection String
echo.
echo  1. Opening Supabase Database settings...
start https://supabase.com/dashboard/project/hfusrtiqjyiotjewzzkt/settings/database
echo.
echo  2. Find "Transaction" pooler section
echo  3. Copy the connection string (looks like: postgresql://...)
echo  4. Replace [YOUR-PASSWORD] with your actual database password
echo.
pause
echo.
echo  STEP 3: Generate JWT Secret
echo.
echo  Generating secure JWT secret...
for /f %%i in ('node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do set JWT_SECRET=%%i
echo.
echo  JWT Secret: %JWT_SECRET%
echo.
echo  (Save this for Vercel)
echo.
pause
echo.
echo ========================================================================================================
echo.
echo  STEP 4: Add Environment Variables to Vercel
echo.
echo  Opening Vercel project settings...
start https://vercel.com/loopkarts-projects/pos/settings
echo.
echo  Add these variables one by one:
echo.
echo  Variable 1:
echo    Name:  SUPABASE_SERVICE_ROLE_KEY
echo    Value: (paste the service_role key from Step 1)
echo    Environments: Production, Preview, Development
echo.
echo  Variable 2:
echo    Name:  SUPABASE_ANON_KEY
echo    Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmdXNydGlxanlpb3RqZXd6emt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MDExODYsImV4cCI6MjA5NTM3NzE4Nn0.Hihh9K0B1WIsZxlIZBEBfIp9ouUL3ZkG3cpnrfxOEdM
echo    Environments: Production, Preview, Development
echo.
echo  Variable 3:
echo    Name:  DATABASE_URL
echo    Value: (paste connection string from Step 2)
echo    Environments: Production, Preview, Development
echo.
echo  Variable 4:
echo    Name:  JWT_SECRET
echo    Value: %JWT_SECRET%
echo    Environments: Production, Preview, Development
echo.
echo  Variable 5:
echo    Name:  NODE_ENV
echo    Value: production
echo    Environments: Production, Preview, Development
echo.
pause
echo.
echo ========================================================================================================
echo.
echo  STEP 5: Redeploy Backend
echo.
echo  After adding environment variables, redeploy the backend:
echo.
echo  Commands to run:
echo.
echo    cd src\backend
echo    vercel --prod
echo.
set /p deploy="Do you want to redeploy backend now? (y/n): "
if /i "%deploy%"=="y" (
    echo.
    echo Redeploying backend...
    cd /d "%~dp0src\backend"
    vercel --prod
    if %errorlevel% neq 0 (
        echo.
        echo ERROR: Deployment failed!
        pause
    ) else (
        echo.
        echo Backend deployed successfully!
    )
)
echo.
echo ========================================================================================================
echo.
echo  SUMMARY
echo.
echo  After completing all steps:
echo    - Wait 30 seconds for deployment
echo    - Refresh your POS app: https://pos-iota-sage.vercel.app
echo    - All APIs should work (products, categories, suppliers, licenses)
echo    - No more 500 errors
echo.
echo  If still having issues:
echo    - Check Vercel logs: vercel logs pos-api-zayqa.vercel.app
echo    - Verify environment variables are set correctly
echo    - Test with: node quick-api-test.cjs
echo.
echo ========================================================================================================
echo.
pause
