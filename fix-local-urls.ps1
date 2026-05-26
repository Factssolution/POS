# Fix Local File URLs in Database
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Fixing Local File URLs in Database" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Join-Path $PSScriptRoot "src\backend\scripts\fix-local-file-urls.js"

if (Test-Path $scriptPath) {
    Write-Host "Running cleanup script..." -ForegroundColor Yellow
    Write-Host ""
    
    node $scriptPath
    
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "Database Cleanup Complete!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
} else {
    Write-Host "Error: Script not found at $scriptPath" -ForegroundColor Red
}

Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Restart your backend server" -ForegroundColor White
Write-Host "2. Clear browser cache (Ctrl+Shift+Delete)" -ForegroundColor White
Write-Host "3. Refresh the page (Ctrl+F5)" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
