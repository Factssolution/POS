@echo off
echo ============================================
echo POS User Role Diagnostic Tool
echo ============================================
echo.

cd /d "%~dp0src\backend"

echo Running user role check...
echo.

node scripts/check-user-roles.js

echo.
echo ============================================
echo Diagnostic Complete
echo ============================================
echo.
echo If your user role is 'Cashier', you need to:
echo 1. Login as Admin, OR
echo 2. Run: node scripts/upgrade-user-to-admin.js [email]
echo.
pause
