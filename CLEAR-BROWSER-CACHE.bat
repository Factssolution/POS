@echo off
echo ========================================
echo   CLEARING BROWSER & VITE CACHE
echo ========================================
echo.

REM Clear Vite cache
if exist "node_modules\.vite" (
    echo [1/3] Clearing Vite cache...
    rmdir /s /q "node_modules\.vite"
    echo       ✓ Vite cache cleared
) else (
    echo [1/3] Vite cache not found (already clean)
)

REM Clear build directory
if exist "build" (
    echo [2/3] Clearing build directory...
    rmdir /s /q "build"
    echo       ✓ Build directory cleared
) else (
    echo [2/3] Build directory not found
)

REM Instructions for browser cache
echo [3/3] BROWSER CACHE CLEAR INSTRUCTIONS:
echo.
echo   1. Press Ctrl+Shift+Delete in your browser
echo   2. Select "Cached images and files"
echo   3. Click "Clear data"
echo   4. OR press Ctrl+Shift+R for hard refresh
echo.
echo ========================================
echo   NOW RESTARTING DEVELOPMENT SERVER
echo ========================================
echo.

REM Kill existing node processes
taskkill /F /IM node.exe >nul 2>&1

REM Wait 2 seconds
timeout /t 2 /nobreak >nul

echo Starting frontend server...
start /min cmd /c "cd /d "d:\POS Business Dashboard ZAYQA" && npm run dev"

timeout /t 3 /nobreak >nul

echo Starting backend server...
start /min cmd /c "cd /d "d:\POS Business Dashboard ZAYQA\src\backend" && node server.js"

timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   ✓ BOTH SERVERS RESTARTED
echo ========================================
echo.
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000
echo.
echo   IMPORTANT: Press Ctrl+Shift+R in browser!
echo ========================================
pause
