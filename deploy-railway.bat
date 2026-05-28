@echo off
echo ============================================
echo  Railway Auto-Deploy Script
echo ============================================
echo.

echo Step 1: Checking Railway CLI...
railway --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Railway CLI not found!
    echo Installing Railway CLI...
    npm i -g @railway/cli
)

echo.
echo Step 2: Login to Railway...
echo Please complete login in browser
railway login

echo.
echo Step 3: Linking project...
railway link --project 39cc831e-2642-4fe3-b101-754036db14e8

echo.
echo Step 4: Setting environment variables...
railway variables set DB_HOST=db.hfusrtiqjyiotjewzzkt.supabase.co
railway variables set DB_PORT=5432
railway variables set DB_NAME=postgres
railway variables set DB_USER=postgres
railway variables set DB_PASSWORD=Black@786##
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=pos-system-secret-key-change-in-production-2026
railway variables set JWT_EXPIRE=7d
railway variables set CORS_ORIGIN=https://pos-iota-sage.vercel.app
railway variables set MAX_FILE_SIZE=5242880
railway variables set UPLOAD_DIR=./uploads
railway variables set BACKUP_DIR=./backups
railway variables set BACKUP_RETENTION_DAYS=30
railway variables set TZ=Asia/Karachi

echo.
echo Step 5: Removing PORT variable (Railway auto-sets)...
railway variables delete PORT

echo.
echo Step 6: Deploying to Railway...
cd src\backend
railway up --detach

echo.
echo ============================================
echo  Deployment Started!
echo ============================================
echo.
echo Check status at:
echo https://railway.com/project/39cc831e-2642-4fe3-b101-754036db14e8
echo.
echo Press any key to exit...
pause >nul
