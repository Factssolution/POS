# Restart PostgreSQL Service
# Run this script as Administrator

Write-Host "Restarting PostgreSQL service..." -ForegroundColor Yellow
Restart-Service -Name "postgresql-x64-17" -Force
Write-Host "PostgreSQL restarted successfully!" -ForegroundColor Green
Write-Host "Waiting 3 seconds for service to fully start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Write-Host "Service Status:" -ForegroundColor Cyan
Get-Service -Name "postgresql-x64-17" | Select-Object Name, Status
