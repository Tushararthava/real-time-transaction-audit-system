# ====================================================================
# Real-Time Transaction Audit System - Automated Setup Script
# PowerShell Script for Windows
# ====================================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Transaction Audit System - Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-Command {
    param($Command)
    try {
        if (Get-Command $Command -ErrorAction Stop) {
            return $true
        }
    }
    catch {
        return $false
    }
}

# Function to check if Docker is running
function Test-DockerRunning {
    try {
        docker info > $null 2>&1
        return $?
    }
    catch {
        return $false
    }
}

# Check prerequisites
Write-Host "Step 1: Checking Prerequisites..." -ForegroundColor Yellow
Write-Host ""

# Check Node.js
if (Test-Command node) {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js is installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check npm
if (Test-Command npm) {
    $npmVersion = npm --version
    Write-Host "[OK] npm is installed: v$npmVersion" -ForegroundColor Green
} else {
    Write-Host "[ERROR] npm is not installed!" -ForegroundColor Red
    exit 1
}

# Check Docker
if (Test-Command docker) {
    Write-Host "[OK] Docker is installed" -ForegroundColor Green
    
    # Check if Docker is running
    if (Test-DockerRunning) {
        Write-Host "[OK] Docker is running" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Docker is installed but not running!" -ForegroundColor Yellow
        Write-Host "Please start Docker Desktop and run this script again." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "[ERROR] Docker is not installed!" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start Docker containers
Write-Host "Step 2: Starting PostgreSQL Database..." -ForegroundColor Yellow
Write-Host ""

docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Database containers started successfully" -ForegroundColor Green
    Start-Sleep -Seconds 5  # Wait for database to initialize
} else {
    Write-Host "[ERROR] Failed to start Docker containers" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Backend Setup
Write-Host "Step 3: Setting Up Backend..." -ForegroundColor Yellow
Write-Host ""

Set-Location backend

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Backend dependencies installed" -ForegroundColor Green
Write-Host ""

# Create .env file if it doesn't exist
if (-Not (Test-Path .env)) {
    Write-Host "Creating .env file for backend..." -ForegroundColor Cyan
    
    $envContent = @"
# Application Environment
NODE_ENV=development
PORT=5000

# Database Configuration
DATABASE_URL=postgresql://postgres:postgres123@localhost:5433/transaction_audit

# JWT Secrets (CHANGE THESE IN PRODUCTION!)
JWT_ACCESS_SECRET=change-this-to-a-secure-random-string-at-least-32-characters-long
JWT_REFRESH_SECRET=change-this-also-to-a-different-secure-random-string-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_ROUNDS=12

# Redis (Optional)
REDIS_URL=
"@

    $envContent | Out-File -FilePath .env -Encoding UTF8
    Write-Host "[OK] .env file created" -ForegroundColor Green
    Write-Host ""
    Write-Host "[IMPORTANT] Please update JWT secrets in backend/.env file!" -ForegroundColor Yellow
    Write-Host "Generate secure secrets using: node -e `"console.log(require('crypto').randomBytes(32).toString('hex'))`"" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "[OK] .env file already exists" -ForegroundColor Green
}

# Generate Prisma Client
Write-Host "Generating Prisma Client..." -ForegroundColor Cyan
npx prisma generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Prisma client generated" -ForegroundColor Green
Write-Host ""

# Run Prisma migrations
Write-Host "Running database migrations..." -ForegroundColor Cyan
npx prisma db push

if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] Database migration encountered issues" -ForegroundColor Yellow
    Write-Host "You may need to run migrations manually: npx prisma migrate dev" -ForegroundColor Yellow
} else {
    Write-Host "[OK] Database migrations completed" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Frontend Setup
Write-Host "Step 4: Setting Up Frontend..." -ForegroundColor Yellow
Write-Host ""

Set-Location ..\fontend

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Frontend dependencies installed" -ForegroundColor Green
Write-Host ""

# Return to project root
Set-Location ..

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update JWT secrets in backend/.env file (IMPORTANT!)" -ForegroundColor White
Write-Host "2. Start backend:  cd backend && npm run dev" -ForegroundColor White
Write-Host "3. Start frontend: cd fontend && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Yellow
Write-Host "- Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "- Backend:   http://localhost:5000" -ForegroundColor White
Write-Host "- pgAdmin:   http://localhost:5051" -ForegroundColor White
Write-Host ""
Write-Host "Database Credentials:" -ForegroundColor Yellow
Write-Host "- Host:      localhost" -ForegroundColor White
Write-Host "- Port:      5433" -ForegroundColor White
Write-Host "- Database:  transaction_audit" -ForegroundColor White
Write-Host "- User:      postgres" -ForegroundColor White
Write-Host "- Password:  postgres123" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
