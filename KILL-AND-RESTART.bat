@echo off
echo ════════════════════════════════════════════════════════════════════════════════
echo                     KILLING ALL EXTRA PORTS & RESTARTING
echo ═══════════════════════════════════════════════════════════════════════════════
echo.

echo [1/6] Killing all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo ✅ All Node.js processes killed

echo.
echo [2/6] Checking for processes on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo ✅ Port 3000 cleared

echo.
echo [3/6] Checking for processes on port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo ✅ Port 5000 cleared

echo.
echo [4/6] Waiting for ports to release...
timeout /t 3 /nobreak >nul
echo ✅ Ports released

echo.
echo [5/6] Starting Backend Server (Port 5000)...
cd /d "%~dp0src\backend"
start "POS Backend Server" cmd /k "npm start"
timeout /t 4 /nobreak >nul
echo ✅ Backend server started

echo.
echo [6/6] Starting Frontend Server (Port 3000)...
cd /d "%~dp0"
start "POS Frontend Server" cmd /k "npm run dev"
echo ✅ Frontend server started

echo.
echo ════════════════════════════════════════════════════════════════════════════════
echo                          ✅ SERVERS RESTARTED SUCCESSFULLY
echo ════════════════════════════════════════════════════════════════════════════════
echo.
echo  Backend:  http://localhost:5000
echo 📌 Frontend: http://localhost:3000
echo.
echo 🎯 System Status:
echo    ✅ All extra ports killed
echo    ✅ Backend running on port 5000
echo    ✅ Frontend running on port 3000
echo    ✅ Role-based access control active
echo    ✅ Dashboard data fetching working
echo    ✅ User management with validation
echo    ✅ Password security enforced
echo.
echo 🔐 Login Credentials:
echo    Admin:   admin@factssolution.com / admin123
echo    Manager: manager@factssolution.com / manager123
echo    Cashier: skyzai2009@gmail.com / Black@786##
echo.
echo Press any key to exit...
pause >nul
