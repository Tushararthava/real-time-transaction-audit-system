@echo off
echo ========================================
echo Building Real-Time Transaction Audit System
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "backend" (
    echo ERROR: backend folder not found!
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

if not exist "fontend" (
    echo ERROR: fontend folder not found!
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

echo [1/4] Building backend...
cd backend
call npm run build
if errorlevel 1 (
    echo ERROR: Backend build failed!
    cd ..
    pause
    exit /b 1
)
echo ✓ Backend built successfully
echo.

echo [2/4] Generating Prisma client...
call npm run prisma:generate
if errorlevel 1 (
    echo ERROR: Prisma generation failed!
    cd ..
    pause
    exit /b 1
)
echo ✓ Prisma client generated
echo.

echo [3/4] Building frontend...
cd ..\fontend
call npm run build
if errorlevel 1 (
    echo ERROR: Frontend build failed!
    cd ..
    pause
    exit /b 1
)
echo ✓ Frontend built successfully
echo.

echo [4/4] Committing and pushing to GitHub...
cd ..
git add backend\dist fontend\dist
git status

echo.
echo Ready to commit and push builds.
set /p CONFIRM="Continue with commit and push? (y/n): "
if /i not "%CONFIRM%"=="y" (
    echo Cancelled by user.
    pause
    exit /b 0
)

git commit -m "Build: %date% %time%"
if errorlevel 1 (
    echo No changes to commit or commit failed.
    echo This might be okay if builds haven't changed.
)

git push origin deploy-aws
if errorlevel 1 (
    echo ERROR: Git push failed!
    echo Please check your git configuration and try again.
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ Build and Deploy Complete!
echo ========================================
echo.
echo Your code has been pushed to GitHub.
echo Jenkins will automatically deploy to EC2.
echo.
echo Check Jenkins: http://your-ec2-ip:8080
echo.
pause
