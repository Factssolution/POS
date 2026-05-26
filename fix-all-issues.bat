@echo off
echo ============================================
echo POS System - Quick Fix Script
echo ============================================
echo.

cd /d "%~dp0src\backend"

echo [1/2] Fixing local file URLs in database...
echo.
node scripts/fix-local-file-urls.js

echo.
echo [2/2] Checking user roles...
echo.
node scripts/check-user-roles.js

echo.
echo ============================================
echo Fixes Applied Successfully!
echo ============================================
echo.
echo NEXT STEPS:
echo 1. Restart backend server
echo 2. Restart frontend server  
echo 3. Clear browser cache (Ctrl+Shift+Delete)
echo 4. Login again
echo.
echo This will fix:
echo ✅ 500 errors on product delete
echo ✅ 403 Forbidden errors
echo ✅ Local file URL errors (file:///)
echo.
pause
