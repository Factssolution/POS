@echo off
echo ========================================
echo  RESTART ALL POS SERVERS
echo ========================================
echo.
echo This script needs Administrator privileges
echo.
echo Step 1: Stopping all Node.js processes...
taskkill /F /IM node.exe
timeout /t 3 /nobreak >nul
echo.
echo Step 2: Starting backend server...
cd /e "%~dp0src\backend"
start "POS Backend Server" node server.js
timeout /t 3 /nobreak >nul
echo.
echo Step 3: Starting frontend server...
cd /e "%~dp0"
start "POS Frontend Server" cmd /k "npm run dev"
timeout /t 5 /nobreak >nul
echo.
echo ========================================
echo  ✅ ALL SERVERS RESTARTED!
echo  📍 Frontend: http://localhost:3000
echo  📍 Backend API: http://localhost:5000/api/v1
echo ========================================
echo.
echo Please wait a few seconds for servers to fully start...
echo Then refresh your browser (Ctrl+F5 for hard refresh)
echo.
echo You can now close this window.
echo Press any key to exit...
pause >nul
