@echo off
REM ====================================================================
REM Real-Time Transaction Audit System - Automated Setup Script
REM Batch Script for Windows
REM ====================================================================

echo ========================================
echo   Transaction Audit System - Setup
echo ========================================
echo.

REM Check Node.js
echo Step 1: Checking Prerequisites...
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

node --version
echo [OK] Node.js is installed
echo.

REM Check npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed!
    pause
    exit /b 1
)

npm --version
echo [OK] npm is installed
echo.

REM Check Docker
where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed!
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

echo [OK] Docker is installed
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Docker is not running!
    echo Please start Docker Desktop and run this script again.
    pause
    exit /b 1
)

echo [OK] Docker is running
echo.
echo ========================================
echo.

REM Start Docker containers
echo Step 2: Starting PostgreSQL Database...
echo.

docker-compose up -d

if %errorlevel% neq 0 (
    echo [ERROR] Failed to start Docker containers
    pause
    exit /b 1
)

echo [OK] Database containers started successfully
echo Waiting for database to initialize...
timeout /t 5 /nobreak >nul
echo.
echo ========================================
echo.

REM Backend Setup
echo Step 3: Setting Up Backend...
echo.

cd backend

echo Installing backend dependencies...
call npm install

if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)

echo [OK] Backend dependencies installed
echo.

REM Create .env file if it doesn't exist
if not exist .env (
    echo Creating .env file for backend...
    (
        echo # Application Environment
        echo NODE_ENV=development
        echo PORT=5000
        echo.
        echo # Database Configuration
        echo DATABASE_URL=postgresql://postgres:postgres123@localhost:5433/transaction_audit
        echo.
        echo # JWT Secrets ^(CHANGE THESE IN PRODUCTION!^)
        echo JWT_ACCESS_SECRET=change-this-to-a-secure-random-string-at-least-32-characters-long
        echo JWT_REFRESH_SECRET=change-this-also-to-a-different-secure-random-string-32-chars
        echo JWT_ACCESS_EXPIRY=15m
        echo JWT_REFRESH_EXPIRY=7d
        echo.
        echo # Frontend URL
        echo FRONTEND_URL=http://localhost:5173
        echo.
        echo # Rate Limiting
        echo RATE_LIMIT_WINDOW_MS=900000
        echo RATE_LIMIT_MAX_REQUESTS=100
        echo.
        echo # Security
        echo BCRYPT_ROUNDS=12
        echo.
        echo # Redis ^(Optional^)
        echo REDIS_URL=
    ) > .env
    
    echo [OK] .env file created
    echo.
    echo [IMPORTANT] Please update JWT secrets in backend\.env file!
    echo.
) else (
    echo [OK] .env file already exists
)

echo Generating Prisma Client...
call npx prisma generate

if %errorlevel% neq 0 (
    echo [ERROR] Failed to generate Prisma client
    pause
    exit /b 1
)

echo [OK] Prisma client generated
echo.

echo Running database migrations...
call npx prisma db push

if %errorlevel% neq 0 (
    echo [WARNING] Database migration encountered issues
    echo You may need to run migrations manually: npx prisma migrate dev
) else (
    echo [OK] Database migrations completed
)

echo.
echo ========================================
echo.

REM Frontend Setup
echo Step 4: Setting Up Frontend...
echo.

cd ..\fontend

echo Installing frontend dependencies...
call npm install

if %errorlevel% neq 0 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
)

echo [OK] Frontend dependencies installed
echo.

REM Return to project root
cd ..

echo ========================================
echo.
echo Setup completed successfully!
echo.
echo Next Steps:
echo 1. Update JWT secrets in backend\.env file ^(IMPORTANT!^)
echo 2. Start backend:  cd backend ^&^& npm run dev
echo 3. Start frontend: cd fontend ^&^& npm run dev
echo.
echo Access Points:
echo - Frontend:  http://localhost:5173
echo - Backend:   http://localhost:5000
echo - pgAdmin:   http://localhost:5051
echo.
echo Database Credentials:
echo - Host:      localhost
echo - Port:      5433
echo - Database:  transaction_audit
echo - User:      postgres
echo - Password:  postgres123
echo.
echo ========================================
echo.
pause
