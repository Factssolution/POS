Write-Host "Railway Auto-Monitor and Login Test" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "STEP 1: Open Railway dashboard and click Redeploy" -ForegroundColor Yellow
Write-Host "   URL: https://railway.com/project/precious-benevolence/pos-backend" -ForegroundColor White
Write-Host ""
Write-Host "Monitoring Railway logs for new deployment..." -ForegroundColor Cyan
Write-Host ""

$maxWait = 600
$waited = 0
$interval = 10

while ($waited -lt $maxWait) {
    Start-Sleep -Seconds $interval
    $waited += $interval
    
    $logs = railway logs --tail 20 2>$null
    $newDeployment = $logs | Select-String "Starting Container"
    
    if ($newDeployment) {
        Write-Host ""
        Write-Host "SUCCESS - NEW DEPLOYMENT DETECTED!" -ForegroundColor Green
        Write-Host "Waiting for deployment to complete (90 seconds)..." -ForegroundColor Cyan
        Start-Sleep -Seconds 90
        
        Write-Host ""
        Write-Host "Running login test..." -ForegroundColor Cyan
        npx playwright test tests/production-login.spec.ts --config playwright-production.config.ts
        
        Write-Host ""
        Write-Host "Checking Railway logs..." -ForegroundColor Cyan
        railway logs --tail 30 | Select-String "Database|Connected|error" -CaseSensitive:$false | Select-Object -Last 10
        
        break
    }
    
    if ($waited % 60 -eq 0) {
        Write-Host "   Still waiting... ($($waited/60) min)" -ForegroundColor Gray
    }
}

if ($waited -ge $maxWait) {
    Write-Host ""
    Write-Host "Timeout - No new deployment detected in 10 minutes" -ForegroundColor Red
    Write-Host "Please manually click Redeploy on Railway dashboard" -ForegroundColor Yellow
}
