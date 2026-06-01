@echo off
title Fix Supabase Permissions
color 0A

echo.
echo ============================================
echo   Supabase Permission Fix Tool
echo ============================================
echo.
echo This tool will help you fix the Supabase
echo permission errors for the license system.
echo.
echo ============================================
echo.

echo Please choose an option:
echo.
echo [1] Show SQL commands to run in Supabase Dashboard
echo [2] Run fix script (Local PostgreSQL only)
echo [3] Open Supabase Dashboard in browser
echo [4] View detailed fix guide
echo [5] Exit
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto show_sql
if "%choice%"=="2" goto run_script
if "%choice%"=="3" goto open_dashboard
if "%choice%"=="4" goto view_guide
if "%choice%"=="5" goto exit

echo Invalid choice. Please try again.
pause
goto end

:show_sql
echo.
echo ============================================
echo   SQL Commands for Supabase Dashboard
echo ============================================
echo.
echo 1. Go to: https://supabase.com/dashboard
echo 2. Select your project
echo 3. Click "SQL Editor"
echo 4. Copy and paste this SQL:
echo.
echo --------------------------------------------
echo GRANT SELECT ON public.licenses TO anon;
echo GRANT SELECT ON public.licenses TO authenticated;
echo GRANT INSERT, UPDATE ON public.licenses TO authenticated;
echo GRANT USAGE, SELECT ON SEQUENCE licenses_id_seq TO authenticated;
echo.
echo GRANT SELECT ON public.settings TO anon;
echo GRANT SELECT ON public.settings TO authenticated;
echo GRANT INSERT, UPDATE ON public.settings TO authenticated;
echo GRANT USAGE, SELECT ON SEQUENCE settings_id_seq TO authenticated;
echo --------------------------------------------
echo.
echo 5. Click "Run" to execute
echo.
pause
goto end

:run_script
echo.
echo Running permission fix script...
echo.
cd /d "%~dp0src\backend"
node scripts/fix-supabase-permissions.js
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Script failed!
    echo Make sure PostgreSQL is running and .env is configured.
    echo.
)
pause
goto end

:open_dashboard
echo.
echo Opening Supabase Dashboard...
start https://supabase.com/dashboard/project/hfusrtiqjyiotjewzzkt
echo.
echo Remember to:
echo 1. Click "SQL Editor"
echo 2. Paste the SQL commands
echo 3. Click "Run"
echo.
pause
goto end

:view_guide
echo.
echo Opening fix guide...
start "" "SUPABASE_FIX_GUIDE.md"
pause
goto end

:exit
echo.
echo Exiting...
goto end

:end
echo.
echo ============================================
echo   For more help, see SUPABASE_FIX_GUIDE.md
echo ============================================
echo.
