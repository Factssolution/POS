@echo off
echo ========================================
echo  IMPORTANT: Backend Restart Required
echo ========================================
echo.
echo The receipt endpoint (GET /api/v1/orders/:id/receipt)
echo has been added to the code but the backend server
echo is still running the OLD version.
echo.
echo MANUAL STEPS REQUIRED:
echo.
echo 1. Open Services Manager:
echo    - Press Windows + R
echo    - Type: services.msc
echo    - Press Enter
echo.
echo 2. Find the POS Backend service:
echo    - Look for a service running on port 5000
echo    - It might be named "POS Backend" or similar
echo.
echo 3. Restart the service:
echo    - Right-click the service
echo    - Click "Restart"
echo    - Wait 5 seconds
echo.
echo 4. Test the receipt endpoint:
echo    - Open POS system in browser
echo    - Create a new order
echo    - Receipt should now load properly
echo.
echo ALTERNATIVE: If running from command line:
echo    - Close any terminal running "node server.js"
echo    - Run: .\RESTART-BACKEND-RECEIPT.bat
echo.
echo ========================================
echo  Code Changes Made:
echo ========================================
echo  - Added GET /api/v1/orders/:id/receipt endpoint
echo  - Updated orderController.js with getOrderReceipt()
echo  - Updated routes/orders.js with new route
echo  - All changes saved successfully
echo ========================================
echo.
pause
