# =====================================================
# POS Business Dashboard - Automated Installer
# =====================================================
# This script automates the complete setup process
# Run as Administrator for best results
# =====================================================

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Step { param($msg) Write-Host "`n▶ $msg" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Error-Custom { param($msg) Write-Host "  ✗ $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "  ℹ $msg" -ForegroundColor Yellow }

# Header
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "  POS Business Dashboard - Setup Wizard" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# =====================================================
# Step 1: Check Prerequisites
# =====================================================
Write-Step "Checking prerequisites..."

# Check Node.js
Write-Info "Checking Node.js..."
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Success "Node.js installed: $nodeVersion"
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-Error-Custom "Node.js is NOT installed!"
    Write-Info "Download from: https://nodejs.org/"
    Write-Info "Install LTS version and re-run this script"
    pause
    exit 1
}

# Check npm
Write-Info "Checking npm..."
$npmVersion = npm --version 2>$null
Write-Success "npm version: $npmVersion"

# Check PostgreSQL
Write-Info "Checking PostgreSQL..."
try {
    $psqlVersion = psql --version 2>$null
    if ($psqlVersion) {
        Write-Success "PostgreSQL installed: $psqlVersion"
    } else {
        throw "PostgreSQL not found"
    }
} catch {
    Write-Error-Custom "PostgreSQL is NOT installed!"
    Write-Info "Download from: https://www.postgresql.org/download/windows/"
    Write-Info "Install PostgreSQL 14+ and re-run this script"
    Write-Info "Remember the password you set during installation!"
    pause
    exit 1
}

# =====================================================
# Step 2: Project Setup
# =====================================================
Write-Step "Setting up project directories..."

$projectRoot = $PSScriptRoot

# Check if we're in the right directory
if (-not (Test-Path "$projectRoot\package.json")) {
    Write-Error-Custom "Error: package.json not found!"
    Write-Info "Please run this script from the POS project root directory"
    pause
    exit 1
}

Write-Success "Project directory validated"

# =====================================================
# Step 3: Install Frontend Dependencies
# =====================================================
Write-Step "Installing frontend dependencies..."

if (Test-Path "$projectRoot\node_modules") {
    Write-Info "Frontend dependencies already installed, skipping..."
} else {
    Write-Info "Running npm install (this may take a few minutes)..."
    Set-Location $projectRoot
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Frontend dependencies installed successfully"
    } else {
        Write-Error-Custom "Frontend dependency installation failed!"
        pause
        exit 1
    }
}

# =====================================================
# Step 4: Install Backend Dependencies
# =====================================================
Write-Step "Installing backend dependencies..."

$backendDir = "$projectRoot\src\backend"
if (Test-Path "$backendDir\node_modules") {
    Write-Info "Backend dependencies already installed, skipping..."
} else {
    Write-Info "Installing backend packages..."
    Set-Location $backendDir
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Backend dependencies installed successfully"
    } else {
        Write-Error-Custom "Backend dependency installation failed!"
        pause
        exit 1
    }
}

# =====================================================
# Step 5: Configure Environment
# =====================================================
Write-Step "Configuring environment variables..."

$envFile = "$backendDir\.env"

if (Test-Path $envFile) {
    Write-Info ".env file already exists"
    $overwrite = Read-Host "Do you want to reconfigure database settings? (y/n)"
    if ($overwrite -ne 'y' -and $overwrite -ne 'Y') {
        Write-Success "Keeping existing configuration"
    } else {
        Remove-Item $envFile -Force
    }
}

if (-not (Test-Path $envFile)) {
    Write-Info "Please enter your PostgreSQL credentials:"
    Write-Info "(Default PostgreSQL superuser is 'postgres')"
    
    $dbUser = Read-Host "Database username"
    $dbPassword = Read-Host "Database password" -AsSecureString
    $dbPasswordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
    )
    $dbName = Read-Host "Database name" -Prompt "pos_database"
    if (-not $dbName) { $dbName = "pos_database" }
    $dbHost = Read-Host "Database host" -Prompt "localhost"
    if (-not $dbHost) { $dbHost = "localhost" }
    $dbPort = Read-Host "Database port" -Prompt "5432"
    if (-not $dbPort) { $dbPort = "5432" }

    # Create .env file
    $envContent = @"
# Database Configuration
DB_HOST=$dbHost
DB_PORT=$dbPort
DB_NAME=$dbName
DB_USER=$dbUser
DB_PASSWORD=$dbPasswordPlain

# Server Configuration
PORT=5001
NODE_ENV=production

# JWT Secret (Auto-generated)
JWT_SECRET=$( -join ((65..90) + (97..122) | Get-Random -Count 50 | ForEach-Object {[char]$_}) )

# Session Secret
SESSION_SECRET=$( -join ((65..90) + (97..122) | Get-Random -Count 50 | ForEach-Object {[char]$_}) )
"@

    $envContent | Out-File -FilePath $envFile -Encoding UTF8
    Write-Success "Environment configuration saved"
}

# =====================================================
# Step 6: Database Setup
# =====================================================
Write-Step "Setting up database..."

Set-Location $backendDir

# Check if database exists
$checkDbQuery = "SELECT 1 FROM pg_database WHERE datname = '$dbName';"
$dbExists = psql -U $dbUser -h $dbHost -p $dbPort -tAc "$checkDbQuery" 2>$null

if ($dbExists -eq "1") {
    Write-Info "Database '$dbName' already exists"
    $recreate = Read-Host "Do you want to recreate it? This will DELETE all data! (y/n)"
    if ($recreate -eq 'y' -or $recreate -eq 'Y') {
        Write-Info "Dropping existing database..."
        psql -U $dbUser -h $dbHost -p $dbPort -c "DROP DATABASE IF EXISTS $dbName;" 2>$null
        psql -U $dbUser -h $dbHost -p $dbPort -c "CREATE DATABASE $dbName;" 2>$null
        Write-Success "Database recreated"
    }
} else {
    Write-Info "Creating database '$dbName'..."
    psql -U $dbUser -h $dbHost -p $dbPort -c "CREATE DATABASE $dbName;" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database created successfully"
    } else {
        Write-Error-Custom "Failed to create database!"
        Write-Info "Check your PostgreSQL credentials and try again"
        pause
        exit 1
    }
}

# Run database schema
Write-Info "Initializing database schema..."
if (Test-Path "$projectRoot\database-schema.sql") {
    psql -U $dbUser -h $dbHost -p $dbPort -d $dbName -f "$projectRoot\database-schema.sql" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database schema initialized"
    } else {
        Write-Error-Custom "Schema initialization failed!"
        pause
        exit 1
    }
} else {
    Write-Error-Custom "database-schema.sql not found!"
    pause
    exit 1
}

# =====================================================
# Step 7: Seed Initial Data
# =====================================================
Write-Step "Seeding initial data..."

if (Test-Path "$backendDir\scripts\seed.js") {
    Write-Info "Running database seed script..."
    node "$backendDir\scripts\seed.js"
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Initial data seeded successfully"
    } else {
        Write-Error-Custom "Seeding failed!"
        Write-Info "You can manually run: node src\backend\scripts\seed.js"
    }
} else {
    Write-Info "Seed script not found, skipping..."
}

# =====================================================
# Step 8: Create Default Admin User
# =====================================================
Write-Step "Creating default admin user..."

if (Test-Path "$backendDir\scripts\create-user.js") {
    Write-Info "Setting up default credentials..."
    node "$backendDir\scripts\create-user.js"
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Admin user created"
    }
} else {
    Write-Info "User creation script not found"
    Write-Info "You can create users manually through the application"
}

# =====================================================
# Step 9: Create Startup Scripts
# =====================================================
Write-Step "Creating startup scripts..."

# Create Start-POS.bat for easy launching
$startScript = @"
@echo off
echo ============================================
echo   POS Business Dashboard
echo ============================================
echo.

echo Starting Backend Server...
start "POS Backend" cmd /k "cd /d %~dp0src\backend && npm start"
timeout /t 3 /nobreak >nul

echo Starting Frontend Server...
start "POS Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ============================================
echo   POS System Started Successfully!
echo ============================================
echo.
echo Backend:  http://localhost:5001
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit this window...
pause >nul
"@

$startScript | Out-File -FilePath "$projectRoot\Start-POS.bat" -Encoding ASCII
Write-Success "Startup script created: Start-POS.bat"

# =====================================================
# Step 10: Final Validation
# =====================================================
Write-Step "Running final validation..."

Set-Location $projectRoot

$allGood = $true

# Check critical files
$criticalFiles = @(
    "package.json",
    "src\backend\server.js",
    "src\backend\.env",
    "src\App.tsx",
    "database-schema.sql"
)

foreach ($file in $criticalFiles) {
    if (Test-Path "$projectRoot\$file") {
        Write-Success "$file exists"
    } else {
        Write-Error-Custom "$file is MISSING!"
        $allGood = $false
    }
}

# =====================================================
# Completion
# =====================================================
Write-Host "`n================================================" -ForegroundColor Green
if ($allGood) {
    Write-Host "  ✓ SETUP COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "================================================`n" -ForegroundColor Green
    
    Write-Host "NEXT STEPS:" -ForegroundColor Cyan
    Write-Host "1. Double-click 'Start-POS.bat' to launch the system" -ForegroundColor White
    Write-Host "2. Open browser: http://localhost:5173" -ForegroundColor White
    Write-Host "3. Login with default credentials (check your seed script output)" -ForegroundColor White
    Write-Host ""
    Write-Host "DEFAULT CREDENTIALS:" -ForegroundColor Yellow
    Write-Host "Username: admin" -ForegroundColor White
    Write-Host "Password: admin123 (or check seed.js for actual password)" -ForegroundColor White
    Write-Host ""
    Write-Host "PORTS:" -ForegroundColor Yellow
    Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
    Write-Host "Backend:  http://localhost:5001" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host "  ⚠ SETUP COMPLETED WITH WARNINGS" -ForegroundColor Yellow
    Write-Host "================================================`n" -ForegroundColor Yellow
    Write-Info "Some files are missing. Check the errors above."
    Write-Info "You may need to manually complete the setup."
}

Write-Host "`nFor support, contact: factssolution@gmail.com`n" -ForegroundColor Cyan

pause
