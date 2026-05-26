@echo off
setlocal enabledelayedexpansion

echo.
echo =========================================================
echo    POS SYSTEM - STARTING SERVERS
echo =========================================================
echo.

REM Kill any existing Node.js processes
echo [1/3] Stopping existing servers...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo Existing servers stopped
) else (
    echo No running servers found
)
timeout /t 2 /nobreak >nul
echo.

REM Check if dependencies are installed
echo [2/3] Checking dependencies...
if not exist "node_modules" (
    echo WARNING: Frontend dependencies not found
    echo Please run '01-Install-Dependencies.bat' first
    pause
    exit /b 1
)

if not exist "src\backend\node_modules" (
    echo WARNING: Backend dependencies not found
    echo Please run '01-Install-Dependencies.bat' first
    pause
    exit /b 1
)

echo Dependencies found
echo.

REM Start Backend Server
echo [3/3] Starting servers...
echo.
echo =========================================================
echo    STARTING BACKEND SERVER (Port 5000)
echo =========================================================
start "POS Backend Server" cmd /k "cd /d "%~dp0src\backend" && echo Starting Backend Server... && node server.js"

timeout /t 3 /nobreak >nul

REM Start Frontend Server
echo.
echo =========================================================
echo    STARTING FRONTEND SERVER (Port 5173)
echo =========================================================
start "POS Frontend Server" cmd /k "cd /d "%~dp0" && echo Starting Frontend Server... && npm run dev"

echo.
echo =========================================================
echo    SERVERS STARTED SUCCESSFULLY!
echo =========================================================
echo.
echo Server Information:
echo    Backend:  http://localhost:5000
echo    Frontend: http://localhost:5173
echo.
echo Default Login Credentials:
echo    Super Admin:
echo      Email: factsolution@gmail.com
echo      Password: Black@786##
echo.
echo    Admin:
echo      Email: admin@factssolution.com
echo      Password: Test@123
echo.
echo Tips:
echo    - Two terminal windows will open (Backend and Frontend)
echo    - Wait for both servers to fully start
echo    - Open browser and go to: http://localhost:5173
echo    - Press Ctrl+C in each terminal to stop servers
echo.
echo =========================================================
echo.
pause
