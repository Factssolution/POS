# Render.com Deployment Script for POS Backend
# Run this after creating a Render account at https://render.com

Write-Host "🚀 POS Backend - Render Deployment Instructions" -ForegroundColor Cyan
Write-Host ""
Write-Host "Step 1: Go to https://render.com and sign up/login" -ForegroundColor Yellow
Write-Host "Step 2: Click 'New +' → 'Web Service'" -ForegroundColor Yellow
Write-Host "Step 3: Connect your GitHub repository: Factssolution/POS" -ForegroundColor Yellow
Write-Host "Step 4: Configure with these settings:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Name: pos-backend" -ForegroundColor White
Write-Host "  Region: Oregon (closest to Supabase)" -ForegroundColor White
Write-Host "  Root Directory: src/backend" -ForegroundColor White
Write-Host "  Runtime: Node" -ForegroundColor White
Write-Host "  Build Command: npm install" -ForegroundColor White
Write-Host "  Start Command: node server.js" -ForegroundColor White
Write-Host ""
Write-Host "Step 5: Add these Environment Variables:" -ForegroundColor Yellow
Write-Host ""

# Read Railway variables and display for Render
Write-Host "  DB_HOST=aws-1-ap-south-1.pooler.supabase.com" -ForegroundColor Green
Write-Host "  DB_PORT=6543" -ForegroundColor Green
Write-Host "  DB_NAME=postgres" -ForegroundColor Green
Write-Host "  DB_USER=postgres" -ForegroundColor Green
Write-Host "  DB_PASSWORD=50Ny5lHTWCX98YiW" -ForegroundColor Green
Write-Host "  DB_SSL=true" -ForegroundColor Green
Write-Host "  CORS_ORIGIN=https://pos-iota-sage.vercel.app,https://pos-iota-sage-henna.vercel.app,http://localhost:5173,http://localhost:3000" -ForegroundColor Green
Write-Host "  NODE_ENV=production" -ForegroundColor Green
Write-Host ""

Write-Host "Step 6: Click 'Create Web Service'" -ForegroundColor Yellow
Write-Host ""
Write-Host "Render will automatically deploy from GitHub!" -ForegroundColor Cyan
Write-Host "No caching issues like Railway!" -ForegroundColor Cyan
Write-Host ""
